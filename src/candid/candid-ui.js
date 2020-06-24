"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const canisterId_1 = require("../canisterId");
const IDL = __importStar(require("../idl"));
const UI = __importStar(require("./candid-core"));
const InputConfig = { parse: parsePrimitive };
const FormConfig = { render: renderInput };
exports.inputBox = (t, config) => {
    return new UI.InputBox(t, Object.assign(Object.assign({}, InputConfig), config));
};
exports.recordForm = (fields, config) => {
    return new UI.RecordForm(fields, Object.assign(Object.assign({}, FormConfig), config));
};
exports.variantForm = (fields, config) => {
    return new UI.VariantForm(fields, Object.assign(Object.assign({}, FormConfig), config));
};
exports.optForm = (ty, config) => {
    return new UI.OptionForm(ty, Object.assign(Object.assign({}, FormConfig), config));
};
exports.vecForm = (ty, config) => {
    return new UI.VecForm(ty, Object.assign(Object.assign({}, FormConfig), config));
};
class Render extends IDL.Visitor {
    visitType(t, d) {
        const input = document.createElement('input');
        input.classList.add('argument');
        input.placeholder = t.display();
        return exports.inputBox(t, { input });
    }
    visitNull(t, d) {
        return exports.inputBox(t, {});
    }
    visitRecord(t, fields, d) {
        let config = {};
        if (fields.length > 1) {
            const container = document.createElement('div');
            container.classList.add('popup-form');
            config = { container };
        }
        const form = exports.recordForm(fields, config);
        return exports.inputBox(t, { form });
    }
    visitVariant(t, fields, d) {
        const select = document.createElement('select');
        for (const [key, type] of fields) {
            const option = new Option(key);
            select.add(option);
        }
        select.selectedIndex = -1;
        select.classList.add('open');
        const config = { open: select, event: 'change' };
        const form = exports.variantForm(fields, config);
        return exports.inputBox(t, { form });
    }
    visitOpt(t, ty, d) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('open');
        const form = exports.optForm(ty, { open: checkbox, event: 'change' });
        return exports.inputBox(t, { form });
    }
    visitVec(t, ty, d) {
        const len = document.createElement('input');
        len.type = 'number';
        len.min = '0';
        len.max = '100';
        len.style.width = '3em';
        len.placeholder = 'len';
        len.classList.add('open');
        const container = document.createElement('div');
        container.classList.add('popup-form');
        const form = exports.vecForm(ty, { open: len, event: 'change', container });
        return exports.inputBox(t, { form });
    }
    visitRec(t, ty, d) {
        return renderInput(ty);
    }
}
exports.Render = Render;
class Parse extends IDL.Visitor {
    visitNull(t, v) {
        return null;
    }
    visitBool(t, v) {
        if (v === 'true') {
            return true;
        }
        if (v === 'false') {
            return false;
        }
        throw new Error(`Cannot parse ${v} as boolean`);
    }
    visitText(t, v) {
        return v;
    }
    visitFloat(t, v) {
        return parseFloat(v);
    }
    visitNumber(t, v) {
        return new bignumber_js_1.default(v);
    }
    visitPrincipal(t, v) {
        return canisterId_1.CanisterId.fromText(v);
    }
    visitService(t, v) {
        return canisterId_1.CanisterId.fromText(v);
    }
    visitFunc(t, v) {
        const x = v.split('.', 2);
        return [canisterId_1.CanisterId.fromText(x[0]), x[1]];
    }
}
class Random extends IDL.Visitor {
    visitNull(t, v) {
        return null;
    }
    visitBool(t, v) {
        return Math.random() < 0.5;
    }
    visitText(t, v) {
        return Math.random()
            .toString(36)
            .substring(6);
    }
    visitFloat(t, v) {
        return Math.random();
    }
    visitInt(t, v) {
        return new bignumber_js_1.default(this.generateNumber(true));
    }
    visitNat(t, v) {
        return new bignumber_js_1.default(this.generateNumber(false));
    }
    visitFixedInt(t, v) {
        return new bignumber_js_1.default(this.generateNumber(true));
    }
    visitFixedNat(t, v) {
        return new bignumber_js_1.default(this.generateNumber(false));
    }
    generateNumber(signed) {
        const num = Math.floor(Math.random() * 100);
        if (signed && Math.random() < 0.5) {
            return -num;
        }
        else {
            return num;
        }
    }
}
function parsePrimitive(t, config, d) {
    if (config.random && d === '') {
        return t.accept(new Random(), d);
    }
    else {
        return t.accept(new Parse(), d);
    }
}
function renderInput(t) {
    return t.accept(new Render(), null);
}
exports.renderInput = renderInput;
function renderValue(t, input, value) {
    return t.accept(new RenderValue(), { input, value });
}
exports.renderValue = renderValue;
class RenderValue extends IDL.Visitor {
    visitType(t, d) {
        d.input.ui.input.value = t.valueToString(d.value);
    }
    visitNull(t, d) { }
    visitText(t, d) {
        d.input.ui.input.value = d.value;
    }
    visitRec(t, ty, d) {
        renderValue(ty, d.input, d.value);
    }
    visitOpt(t, ty, d) {
        if (d.value.length === 0) {
            return;
        }
        else {
            const form = d.input.ui.form;
            const open = form.ui.open;
            open.checked = true;
            open.dispatchEvent(new Event(form.ui.event));
            renderValue(ty, form.form[0], d.value[0]);
        }
    }
    visitRecord(t, fields, d) {
        const form = d.input.ui.form;
        fields.forEach(([key, type], i) => {
            renderValue(type, form.form[i], d.value[key]);
        });
    }
    visitVariant(t, fields, d) {
        const form = d.input.ui.form;
        const selected = Object.entries(d.value)[0];
        fields.forEach(([key, type], i) => {
            if (key === selected[0]) {
                const open = form.ui.open;
                open.selectedIndex = i;
                open.dispatchEvent(new Event(form.ui.event));
                renderValue(type, form.form[0], selected[1]);
            }
        });
    }
    visitVec(t, ty, d) {
        const form = d.input.ui.form;
        const len = d.value.length;
        const open = form.ui.open;
        open.value = len;
        open.dispatchEvent(new Event(form.ui.event));
        d.value.forEach((v, i) => {
            renderValue(ty, form.form[i], v);
        });
    }
}
//# sourceMappingURL=candid-ui.js.map