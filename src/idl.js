"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const Pipe = require("buffer-pipe");
const buffer_1 = require("buffer/");
const canisterId_1 = require("./canisterId");
const hash_1 = require("./utils/hash");
const leb128_1 = require("./utils/leb128");
const leb128_2 = require("./utils/leb128");
const magicNumber = 'DIDL';
function zipWith(xs, ys, f) {
    return xs.map((x, i) => f(x, ys[i]));
}
/**
 * An IDL Type Table, which precedes the data in the stream.
 */
class TypeTable {
    constructor() {
        // List of types. Needs to be an array as the index needs to be stable.
        this._typs = [];
        this._idx = new Map();
    }
    has(obj) {
        return this._idx.has(obj.name);
    }
    add(type, buf) {
        const idx = this._typs.length;
        this._idx.set(type.name, idx);
        this._typs.push(buf);
    }
    merge(obj, knot) {
        const idx = this._idx.get(obj.name);
        const knotIdx = this._idx.get(knot);
        if (idx === undefined) {
            throw new Error('Missing type index for ' + obj);
        }
        if (knotIdx === undefined) {
            throw new Error('Missing type index for ' + knot);
        }
        this._typs[idx] = this._typs[knotIdx];
        // Delete the type.
        this._typs.splice(knotIdx, 1);
        this._idx.delete(knot);
    }
    encode() {
        const len = leb128_1.lebEncode(this._typs.length);
        const buf = buffer_1.Buffer.concat(this._typs);
        return buffer_1.Buffer.concat([len, buf]);
    }
    indexOf(typeName) {
        if (!this._idx.has(typeName)) {
            throw new Error('Missing type index for ' + typeName);
        }
        return leb128_1.slebEncode(this._idx.get(typeName) || 0);
    }
}
class Visitor {
    visitType(t, data) {
        throw new Error('Not implemented');
    }
    visitPrimitive(t, data) {
        return this.visitType(t, data);
    }
    visitEmpty(t, data) {
        return this.visitPrimitive(t, data);
    }
    visitBool(t, data) {
        return this.visitPrimitive(t, data);
    }
    visitNull(t, data) {
        return this.visitPrimitive(t, data);
    }
    visitText(t, data) {
        return this.visitPrimitive(t, data);
    }
    visitNumber(t, data) {
        return this.visitPrimitive(t, data);
    }
    visitInt(t, data) {
        return this.visitNumber(t, data);
    }
    visitNat(t, data) {
        return this.visitNumber(t, data);
    }
    visitFloat(t, data) {
        return this.visitPrimitive(t, data);
    }
    visitFixedInt(t, data) {
        return this.visitNumber(t, data);
    }
    visitFixedNat(t, data) {
        return this.visitNumber(t, data);
    }
    visitPrincipal(t, data) {
        return this.visitPrimitive(t, data);
    }
    visitConstruct(t, data) {
        return this.visitType(t, data);
    }
    visitVec(t, ty, data) {
        return this.visitConstruct(t, data);
    }
    visitOpt(t, ty, data) {
        return this.visitConstruct(t, data);
    }
    visitRecord(t, fields, data) {
        return this.visitConstruct(t, data);
    }
    visitVariant(t, fields, data) {
        return this.visitConstruct(t, data);
    }
    visitRec(t, ty, data) {
        return this.visitConstruct(ty, data);
    }
    visitFunc(t, data) {
        return this.visitConstruct(t, data);
    }
    visitService(t, data) {
        return this.visitConstruct(t, data);
    }
}
exports.Visitor = Visitor;
/**
 * Represents an IDL type.
 */
class Type {
    /* Display type name */
    display() {
        return this.name;
    }
    valueToString(x) {
        return JSON.stringify(x);
    }
    /* Implement `T` in the IDL spec, only needed for non-primitive types */
    buildTypeTable(typeTable) {
        if (!typeTable.has(this)) {
            this._buildTypeTableImpl(typeTable);
        }
    }
}
exports.Type = Type;
class PrimitiveType extends Type {
    _buildTypeTableImpl(typeTable) {
        // No type table encoding for Primitive types.
        return;
    }
}
exports.PrimitiveType = PrimitiveType;
class ConstructType extends Type {
    encodeType(typeTable) {
        return typeTable.indexOf(this.name);
    }
}
exports.ConstructType = ConstructType;
/**
 * Represents an IDL Empty, a type which has no inhabitants.
 * Since no values exist for this type, it cannot be serialised or deserialised.
 * Result types like `Result<Text, Empty>` should always succeed.
 */
class EmptyClass extends PrimitiveType {
    accept(v, d) {
        return v.visitEmpty(this, d);
    }
    covariant(x) {
        return false;
    }
    encodeValue() {
        throw new Error('Empty cannot appear as a function argument');
    }
    valueToString() {
        throw new Error('Empty cannot appear as a value');
    }
    encodeType() {
        return leb128_1.slebEncode(-17 /* Empty */);
    }
    decodeValue() {
        throw new Error('Empty cannot appear as an output');
    }
    get name() {
        return 'empty';
    }
}
exports.EmptyClass = EmptyClass;
/**
 * Represents an IDL Bool
 */
class BoolClass extends PrimitiveType {
    accept(v, d) {
        return v.visitBool(this, d);
    }
    covariant(x) {
        return typeof x === 'boolean';
    }
    encodeValue(x) {
        const buf = buffer_1.Buffer.alloc(1);
        buf.writeInt8(x ? 1 : 0, 0);
        return buf;
    }
    encodeType() {
        return leb128_1.slebEncode(-2 /* Bool */);
    }
    decodeValue(b) {
        const x = b.read(1).toString('hex');
        return x === '01';
    }
    get name() {
        return 'bool';
    }
}
exports.BoolClass = BoolClass;
/**
 * Represents an IDL Null
 */
class NullClass extends PrimitiveType {
    accept(v, d) {
        return v.visitNull(this, d);
    }
    covariant(x) {
        return x === null;
    }
    encodeValue() {
        return buffer_1.Buffer.alloc(0);
    }
    encodeType() {
        return leb128_1.slebEncode(-1 /* Null */);
    }
    decodeValue() {
        return null;
    }
    get name() {
        return 'null';
    }
}
exports.NullClass = NullClass;
/**
 * Represents an IDL Text
 */
class TextClass extends PrimitiveType {
    accept(v, d) {
        return v.visitText(this, d);
    }
    covariant(x) {
        return typeof x === 'string';
    }
    encodeValue(x) {
        const buf = buffer_1.Buffer.from(x, 'utf8');
        const len = leb128_1.lebEncode(buf.length);
        return buffer_1.Buffer.concat([len, buf]);
    }
    encodeType() {
        return leb128_1.slebEncode(-15 /* Text */);
    }
    decodeValue(b) {
        const len = leb128_1.lebDecode(b).toNumber();
        return b.read(len).toString('utf8');
    }
    get name() {
        return 'text';
    }
    valueToString(x) {
        return '"' + x + '"';
    }
}
exports.TextClass = TextClass;
/**
 * Represents an IDL Int
 */
class IntClass extends PrimitiveType {
    accept(v, d) {
        return v.visitInt(this, d);
    }
    covariant(x) {
        // We allow encoding of JavaScript plain numbers.
        // But we will always decode to BigNumber.
        return (bignumber_js_1.default.isBigNumber(x) && x.isInteger()) || Number.isInteger(x);
    }
    encodeValue(x) {
        return leb128_1.slebEncode(x);
    }
    encodeType() {
        return leb128_1.slebEncode(-4 /* Int */);
    }
    decodeValue(b) {
        return leb128_1.slebDecode(b);
    }
    get name() {
        return 'int';
    }
    valueToString(x) {
        return x.toFixed();
    }
}
exports.IntClass = IntClass;
/**
 * Represents an IDL Nat
 */
class NatClass extends PrimitiveType {
    accept(v, d) {
        return v.visitNat(this, d);
    }
    covariant(x) {
        // We allow encoding of JavaScript plain numbers.
        // But we will always decode to BigNumber.
        return ((bignumber_js_1.default.isBigNumber(x) && x.isInteger() && !x.isNegative()) ||
            (Number.isInteger(x) && x >= 0));
    }
    encodeValue(x) {
        return leb128_1.lebEncode(x);
    }
    encodeType() {
        return leb128_1.slebEncode(-3 /* Nat */);
    }
    decodeValue(b) {
        return leb128_1.lebDecode(b);
    }
    get name() {
        return 'nat';
    }
    valueToString(x) {
        return x.toFixed();
    }
}
exports.NatClass = NatClass;
/**
 * Represents an IDL Float
 */
class FloatClass extends PrimitiveType {
    accept(v, d) {
        return v.visitFloat(this, d);
    }
    covariant(x) {
        return typeof x === 'number' || x instanceof Number;
    }
    encodeValue(x) {
        const buf = buffer_1.Buffer.allocUnsafe(8);
        buf.writeDoubleLE(x, 0);
        return buf;
    }
    encodeType() {
        return leb128_1.slebEncode(-14 /* Float64 */);
    }
    decodeValue(b) {
        const x = b.read(8);
        return x.readDoubleLE(0);
    }
    get name() {
        return 'float64';
    }
    valueToString(x) {
        return x.toString();
    }
}
exports.FloatClass = FloatClass;
/**
 * Represents an IDL fixed-width Int(n)
 */
class FixedIntClass extends PrimitiveType {
    constructor(_bits) {
        super();
        this._bits = _bits;
    }
    accept(v, d) {
        return v.visitFixedInt(this, d);
    }
    covariant(x) {
        const min = new bignumber_js_1.default(2).pow(this._bits - 1).negated();
        const max = new bignumber_js_1.default(2).pow(this._bits - 1).minus(1);
        if (bignumber_js_1.default.isBigNumber(x) && x.isInteger()) {
            return x.gte(min) && x.lte(max);
        }
        else if (Number.isInteger(x)) {
            const v = new bignumber_js_1.default(x);
            return v.gte(min) && v.lte(max);
        }
        else {
            return false;
        }
    }
    encodeValue(x) {
        return leb128_2.writeIntLE(x, this._bits / 8);
    }
    encodeType() {
        const offset = Math.log2(this._bits) - 3;
        return leb128_1.slebEncode(-9 - offset);
    }
    decodeValue(b) {
        const num = leb128_2.readIntLE(b, this._bits / 8);
        if (this._bits <= 32) {
            return num.toNumber();
        }
        else {
            return num;
        }
    }
    get name() {
        return `int${this._bits}`;
    }
    valueToString(x) {
        return x.toString();
    }
}
exports.FixedIntClass = FixedIntClass;
/**
 * Represents an IDL fixed-width Nat(n)
 */
class FixedNatClass extends PrimitiveType {
    constructor(_bits) {
        super();
        this._bits = _bits;
    }
    accept(v, d) {
        return v.visitFixedNat(this, d);
    }
    covariant(x) {
        const max = new bignumber_js_1.default(2).pow(this._bits);
        if (bignumber_js_1.default.isBigNumber(x) && x.isInteger() && !x.isNegative()) {
            return x.lt(max);
        }
        else if (Number.isInteger(x) && x >= 0) {
            const v = new bignumber_js_1.default(x);
            return v.lt(max);
        }
        else {
            return false;
        }
    }
    encodeValue(x) {
        return leb128_2.writeUIntLE(x, this._bits / 8);
    }
    encodeType() {
        const offset = Math.log2(this._bits) - 3;
        return leb128_1.slebEncode(-5 - offset);
    }
    decodeValue(b) {
        const num = leb128_2.readUIntLE(b, this._bits / 8);
        if (this._bits <= 32) {
            return num.toNumber();
        }
        else {
            return num;
        }
    }
    get name() {
        return `nat${this._bits}`;
    }
    valueToString(x) {
        return x.toString();
    }
}
exports.FixedNatClass = FixedNatClass;
/**
 * Represents an IDL Array
 * @param {Type} t
 */
class VecClass extends ConstructType {
    constructor(_type) {
        super();
        this._type = _type;
    }
    accept(v, d) {
        return v.visitVec(this, this._type, d);
    }
    covariant(x) {
        return Array.isArray(x) && x.every(v => this._type.covariant(v));
    }
    encodeValue(x) {
        const len = leb128_1.lebEncode(x.length);
        return buffer_1.Buffer.concat([len, ...x.map(d => this._type.encodeValue(d))]);
    }
    _buildTypeTableImpl(typeTable) {
        this._type.buildTypeTable(typeTable);
        const opCode = leb128_1.slebEncode(-19 /* Vector */);
        const buffer = this._type.encodeType(typeTable);
        typeTable.add(this, buffer_1.Buffer.concat([opCode, buffer]));
    }
    decodeValue(b) {
        const len = leb128_1.lebDecode(b).toNumber();
        const rets = [];
        for (let i = 0; i < len; i++) {
            rets.push(this._type.decodeValue(b));
        }
        return rets;
    }
    get name() {
        return `vec ${this._type.name}`;
    }
    display() {
        return `vec ${this._type.display()}`;
    }
    valueToString(x) {
        const elements = x.map(e => this._type.valueToString(e));
        return 'vec {' + elements.join('; ') + '}';
    }
}
exports.VecClass = VecClass;
/**
 * Represents an IDL Option
 * @param {Type} t
 */
class OptClass extends ConstructType {
    constructor(_type) {
        super();
        this._type = _type;
    }
    accept(v, d) {
        return v.visitOpt(this, this._type, d);
    }
    covariant(x) {
        return Array.isArray(x) && (x.length === 0 || (x.length === 1 && this._type.covariant(x[0])));
    }
    encodeValue(x) {
        if (x.length === 0) {
            return buffer_1.Buffer.from([0]);
        }
        else {
            return buffer_1.Buffer.concat([buffer_1.Buffer.from([1]), this._type.encodeValue(x[0])]);
        }
    }
    _buildTypeTableImpl(typeTable) {
        this._type.buildTypeTable(typeTable);
        const opCode = leb128_1.slebEncode(-18 /* Opt */);
        const buffer = this._type.encodeType(typeTable);
        typeTable.add(this, buffer_1.Buffer.concat([opCode, buffer]));
    }
    decodeValue(b) {
        const len = b.read(1).toString('hex');
        if (len === '00') {
            return [];
        }
        else {
            return [this._type.decodeValue(b)];
        }
    }
    get name() {
        return `opt ${this._type.name}`;
    }
    display() {
        return `opt ${this._type.display()}`;
    }
    valueToString(x) {
        if (x.length === 0) {
            return 'null';
        }
        else {
            return `opt ${this._type.valueToString(x[0])}`;
        }
    }
}
exports.OptClass = OptClass;
/**
 * Represents an IDL Record
 * @param {Object} [fields] - mapping of function name to Type
 */
class RecordClass extends ConstructType {
    constructor(fields = {}) {
        super();
        this._fields = Object.entries(fields).sort((a, b) => hash_1.idlLabelToId(a[0]) - hash_1.idlLabelToId(b[0]));
    }
    accept(v, d) {
        return v.visitRecord(this, this._fields, d);
    }
    covariant(x) {
        return (typeof x === 'object' &&
            this._fields.every(([k, t]) => {
                if (!x.hasOwnProperty(k)) {
                    throw new Error(`Record is missing key "${k}".`);
                }
                return t.covariant(x[k]);
            }));
    }
    encodeValue(x) {
        const values = this._fields.map(([key]) => x[key]);
        const bufs = zipWith(this._fields, values, ([, c], d) => c.encodeValue(d));
        return buffer_1.Buffer.concat(bufs);
    }
    _buildTypeTableImpl(T) {
        this._fields.forEach(([_, value]) => value.buildTypeTable(T));
        const opCode = leb128_1.slebEncode(-20 /* Record */);
        const len = leb128_1.lebEncode(this._fields.length);
        const fields = this._fields.map(([key, value]) => buffer_1.Buffer.concat([leb128_1.lebEncode(hash_1.idlLabelToId(key)), value.encodeType(T)]));
        T.add(this, buffer_1.Buffer.concat([opCode, len, buffer_1.Buffer.concat(fields)]));
    }
    decodeValue(b) {
        const x = {};
        for (const [key, type] of this._fields) {
            x[key] = type.decodeValue(b);
        }
        return x;
    }
    get name() {
        const fields = this._fields.map(([key, value]) => key + ':' + value.name);
        return `record {${fields.join('; ')}}`;
    }
    display() {
        const fields = this._fields.map(([key, value]) => key + ':' + value.display());
        return `record {${fields.join('; ')}}`;
    }
    valueToString(x) {
        const values = this._fields.map(([key]) => x[key]);
        const fields = zipWith(this._fields, values, ([k, c], d) => k + '=' + c.valueToString(d));
        return `record {${fields.join('; ')}}`;
    }
}
exports.RecordClass = RecordClass;
/**
 * Represents Tuple, a syntactic sugar for Record.
 * @param {Type} components
 */
class TupleClass extends RecordClass {
    constructor(_components) {
        const x = {};
        _components.forEach((e, i) => (x['_' + i + '_'] = e));
        super(x);
        this._components = _components;
    }
    covariant(x) {
        // `>=` because tuples can be covariant when encoded.
        return (Array.isArray(x) &&
            x.length >= this._fields.length &&
            this._components.every((t, i) => t.covariant(x[i])));
    }
    encodeValue(x) {
        const bufs = zipWith(this._components, x, (c, d) => c.encodeValue(d));
        return buffer_1.Buffer.concat(bufs);
    }
    decodeValue(b) {
        return this._components.map(c => c.decodeValue(b));
    }
}
/**
 * Represents an IDL Variant
 * @param {Object} [fields] - mapping of function name to Type
 */
class VariantClass extends ConstructType {
    constructor(fields = {}) {
        super();
        this._fields = Object.entries(fields).sort((a, b) => hash_1.idlLabelToId(a[0]) - hash_1.idlLabelToId(b[0]));
    }
    accept(v, d) {
        return v.visitVariant(this, this._fields, d);
    }
    covariant(x) {
        return (typeof x === 'object' &&
            Object.entries(x).length === 1 &&
            this._fields.every(([k, v]) => {
                return !x.hasOwnProperty(k) || v.covariant(x[k]);
            }));
    }
    encodeValue(x) {
        for (let i = 0; i < this._fields.length; i++) {
            const [name, type] = this._fields[i];
            if (x.hasOwnProperty(name)) {
                const idx = leb128_1.lebEncode(i);
                const buf = type.encodeValue(x[name]);
                return buffer_1.Buffer.concat([idx, buf]);
            }
        }
        throw Error('Variant has no data: ' + x);
    }
    _buildTypeTableImpl(typeTable) {
        this._fields.forEach(([, type]) => {
            type.buildTypeTable(typeTable);
        });
        const opCode = leb128_1.slebEncode(-21 /* Variant */);
        const len = leb128_1.lebEncode(this._fields.length);
        const fields = this._fields.map(([key, value]) => buffer_1.Buffer.concat([leb128_1.lebEncode(hash_1.idlLabelToId(key)), value.encodeType(typeTable)]));
        typeTable.add(this, buffer_1.Buffer.concat([opCode, len, ...fields]));
    }
    decodeValue(b) {
        const idx = leb128_1.lebDecode(b).toNumber();
        if (idx >= this._fields.length) {
            throw Error('Invalid variant: ' + idx);
        }
        const value = this._fields[idx][1].decodeValue(b);
        return {
            [this._fields[idx][0]]: value,
        };
    }
    get name() {
        const fields = this._fields.map(([key, type]) => key + ':' + type.name);
        return `variant {${fields.join('; ')}}`;
    }
    display() {
        const fields = this._fields.map(([key, type]) => key + ':' + type.display());
        return `variant {${fields.join('; ')}}`;
    }
    valueToString(x) {
        for (const [name, type] of this._fields) {
            if (x.hasOwnProperty(name)) {
                const value = type.valueToString(x[name]);
                return `variant {${name}=${value}}`;
            }
        }
        throw Error('Variant has no data: ' + x);
    }
}
exports.VariantClass = VariantClass;
/**
 * Represents a reference to an IDL type, used for defining recursive data
 * types.
 */
class RecClass extends ConstructType {
    constructor() {
        super(...arguments);
        this._id = RecClass._counter++;
        this._type = undefined;
    }
    accept(v, d) {
        if (!this._type) {
            throw Error('Recursive type uninitialized.');
        }
        return v.visitRec(this, this._type, d);
    }
    fill(t) {
        this._type = t;
    }
    getType() {
        return this._type;
    }
    covariant(x) {
        return this._type ? this._type.covariant(x) : false;
    }
    encodeValue(x) {
        if (!this._type) {
            throw Error('Recursive type uninitialized.');
        }
        return this._type.encodeValue(x);
    }
    _buildTypeTableImpl(typeTable) {
        if (!this._type) {
            throw Error('Recursive type uninitialized.');
        }
        typeTable.add(this, buffer_1.Buffer.alloc(0));
        this._type.buildTypeTable(typeTable);
        typeTable.merge(this, this._type.name);
    }
    decodeValue(b) {
        if (!this._type) {
            throw Error('Recursive type uninitialized.');
        }
        return this._type.decodeValue(b);
    }
    get name() {
        return `rec_${this._id}`;
    }
    display() {
        if (!this._type) {
            throw Error('Recursive type uninitialized.');
        }
        return `μ${this.name}.${this._type.name}`;
    }
    valueToString(x) {
        if (!this._type) {
            throw Error('Recursive type uninitialized.');
        }
        return this._type.valueToString(x);
    }
}
exports.RecClass = RecClass;
RecClass._counter = 0;
function decodePrincipalId(b) {
    const x = b.read(1).toString('hex');
    if (x !== '01') {
        throw new Error('Cannot decode principal');
    }
    const len = leb128_1.lebDecode(b).toNumber();
    const hex = b
        .read(len)
        .toString('hex')
        .toUpperCase();
    return canisterId_1.CanisterId.fromHex(hex);
}
/**
 * Represents an IDL principal reference
 */
class PrincipalClass extends PrimitiveType {
    accept(v, d) {
        return v.visitPrincipal(this, d);
    }
    covariant(x) {
        return x && x._isCanisterId;
    }
    encodeValue(x) {
        const hex = x.toHex();
        const buf = buffer_1.Buffer.from(hex, 'hex');
        const len = leb128_1.lebEncode(buf.length);
        return buffer_1.Buffer.concat([buffer_1.Buffer.from([1]), len, buf]);
    }
    encodeType() {
        return leb128_1.slebEncode(-24 /* Principal */);
    }
    decodeValue(b) {
        return decodePrincipalId(b);
    }
    get name() {
        return 'principal';
    }
    valueToString(x) {
        return x.toText();
    }
}
exports.PrincipalClass = PrincipalClass;
/**
 * Represents an IDL function reference.
 * @param argTypes Argument types.
 * @param retTypes Return types.
 * @param annotations Function annotations.
 */
class FuncClass extends ConstructType {
    constructor(argTypes, retTypes, annotations = []) {
        super();
        this.argTypes = argTypes;
        this.retTypes = retTypes;
        this.annotations = annotations;
    }
    static argsToString(types, v) {
        if (types.length !== v.length) {
            throw new Error('arity mismatch');
        }
        return '(' + types.map((t, i) => t.valueToString(v[i])).join(', ') + ')';
    }
    accept(v, d) {
        return v.visitFunc(this, d);
    }
    covariant(x) {
        return (Array.isArray(x) && x.length === 2 && x[0] && x[0]._isCanisterId && typeof x[1] === 'string');
    }
    encodeValue(x) {
        const hex = x[0].toHex();
        const buf = buffer_1.Buffer.from(hex, 'hex');
        const len = leb128_1.lebEncode(buf.length);
        const canister = buffer_1.Buffer.concat([buffer_1.Buffer.from([1]), len, buf]);
        const method = buffer_1.Buffer.from(x[1], 'utf8');
        const methodLen = leb128_1.lebEncode(method.length);
        return buffer_1.Buffer.concat([buffer_1.Buffer.from([1]), canister, methodLen, method]);
    }
    _buildTypeTableImpl(T) {
        this.argTypes.forEach(arg => arg.buildTypeTable(T));
        this.retTypes.forEach(arg => arg.buildTypeTable(T));
        const opCode = leb128_1.slebEncode(-22 /* Func */);
        const argLen = leb128_1.lebEncode(this.argTypes.length);
        const args = buffer_1.Buffer.concat(this.argTypes.map(arg => arg.encodeType(T)));
        const retLen = leb128_1.lebEncode(this.retTypes.length);
        const rets = buffer_1.Buffer.concat(this.retTypes.map(arg => arg.encodeType(T)));
        const annLen = leb128_1.lebEncode(this.annotations.length);
        const anns = buffer_1.Buffer.concat(this.annotations.map(a => this.encodeAnnotation(a)));
        T.add(this, buffer_1.Buffer.concat([opCode, argLen, args, retLen, rets, annLen, anns]));
    }
    decodeValue(b) {
        const x = b.read(1).toString('hex');
        if (x !== '01') {
            throw new Error('Cannot decode function reference');
        }
        const canister = decodePrincipalId(b);
        const mLen = leb128_1.lebDecode(b).toNumber();
        const method = b.read(mLen).toString('utf8');
        return [canister, method];
    }
    get name() {
        const args = this.argTypes.map(arg => arg.name).join(', ');
        const rets = this.retTypes.map(arg => arg.name).join(', ');
        const annon = ' ' + this.annotations.join(' ');
        return `(${args}) -> (${rets})${annon}`;
    }
    valueToString(x) {
        return x[0].toText() + '.' + x[1];
    }
    display() {
        const args = this.argTypes.map(arg => arg.display()).join(', ');
        const rets = this.retTypes.map(arg => arg.display()).join(', ');
        const annon = ' ' + this.annotations.join(' ');
        return `(${args}) → (${rets})${annon}`;
    }
    encodeAnnotation(ann) {
        if (ann === 'query') {
            return buffer_1.Buffer.from([1]);
        }
        else if (ann === 'oneway') {
            return buffer_1.Buffer.from([2]);
        }
        else {
            throw new Error('Illeagal function annotation');
        }
    }
}
exports.FuncClass = FuncClass;
class ServiceClass extends ConstructType {
    constructor(fields) {
        super();
        this._fields = Object.entries(fields).sort((a, b) => hash_1.idlLabelToId(a[0]) - hash_1.idlLabelToId(b[0]));
    }
    accept(v, d) {
        return v.visitService(this, d);
    }
    covariant(x) {
        return x && x._isCanisterId;
    }
    encodeValue(x) {
        const hex = x.toHex();
        const buf = buffer_1.Buffer.from(hex, 'hex');
        const len = leb128_1.lebEncode(buf.length);
        return buffer_1.Buffer.concat([buffer_1.Buffer.from([1]), len, buf]);
    }
    _buildTypeTableImpl(T) {
        this._fields.forEach(([_, func]) => func.buildTypeTable(T));
        const opCode = leb128_1.slebEncode(-23 /* Service */);
        const len = leb128_1.lebEncode(this._fields.length);
        const meths = this._fields.map(([label, func]) => {
            const labelBuf = buffer_1.Buffer.from(label, 'utf8');
            const labelLen = leb128_1.lebEncode(labelBuf.length);
            return buffer_1.Buffer.concat([labelLen, labelBuf, func.encodeType(T)]);
        });
        T.add(this, buffer_1.Buffer.concat([opCode, len, buffer_1.Buffer.concat(meths)]));
    }
    decodeValue(b) {
        return decodePrincipalId(b);
    }
    get name() {
        const fields = this._fields.map(([key, value]) => key + ':' + value.name);
        return `service {${fields.join('; ')}}`;
    }
    valueToString(x) {
        return x.toText();
    }
}
exports.ServiceClass = ServiceClass;
/**
 * Encode a array of values
 * @returns {Buffer} serialised value
 */
function encode(argTypes, args) {
    if (args.length < argTypes.length) {
        throw Error('Wrong number of message arguments');
    }
    const typeTable = new TypeTable();
    argTypes.forEach(t => t.buildTypeTable(typeTable));
    const magic = buffer_1.Buffer.from(magicNumber, 'utf8');
    const table = typeTable.encode();
    const len = leb128_1.lebEncode(args.length);
    const typs = buffer_1.Buffer.concat(argTypes.map(t => t.encodeType(typeTable)));
    const vals = buffer_1.Buffer.concat(zipWith(argTypes, args, (t, x) => {
        if (!t.covariant(x)) {
            throw new Error(`Invalid ${t.display()} argument: "${JSON.stringify(x)}"`);
        }
        return t.encodeValue(x);
    }));
    return buffer_1.Buffer.concat([magic, table, len, typs, vals]);
}
exports.encode = encode;
/**
 * Decode a binary value
 * @param retTypes - Types expected in the buffer.
 * @param bytes - hex-encoded string, or buffer.
 * @returns Value deserialised to JS type
 */
function decode(retTypes, bytes) {
    const b = new Pipe(bytes);
    if (bytes.byteLength < magicNumber.length) {
        throw new Error('Message length smaller than magic number');
    }
    const magic = b.read(magicNumber.length).toString();
    if (magic !== magicNumber) {
        throw new Error('Wrong magic number: ' + magic);
    }
    function decodeType(pipe) {
        const len = leb128_1.lebDecode(pipe).toNumber();
        for (let i = 0; i < len; i++) {
            const ty = leb128_1.slebDecode(pipe).toNumber();
            switch (ty) {
                case -18 /* Opt */:
                    leb128_1.slebDecode(pipe);
                    break;
                case -19 /* Vector */:
                    leb128_1.slebDecode(pipe);
                    break;
                case -20 /* Record */: {
                    // record/tuple
                    let objectLength = leb128_1.lebDecode(pipe).toNumber();
                    while (objectLength--) {
                        leb128_1.lebDecode(pipe);
                        leb128_1.slebDecode(pipe);
                    }
                    break;
                }
                case -21 /* Variant */: {
                    // variant
                    let variantLength = leb128_1.lebDecode(pipe).toNumber();
                    while (variantLength--) {
                        leb128_1.lebDecode(pipe);
                        leb128_1.slebDecode(pipe);
                    }
                    break;
                }
                case -22 /* Func */: {
                    for (let k = 0; k < 2; k++) {
                        let funcLength = leb128_1.lebDecode(pipe).toNumber();
                        while (funcLength--) {
                            leb128_1.slebDecode(pipe);
                        }
                    }
                    const annLen = leb128_1.lebDecode(pipe).toNumber();
                    pipe.read(annLen);
                    break;
                }
                case -23 /* Service */: {
                    let servLength = leb128_1.lebDecode(pipe).toNumber();
                    while (servLength--) {
                        const l = leb128_1.lebDecode(pipe).toNumber();
                        pipe.read(l);
                        leb128_1.slebDecode(pipe);
                    }
                    break;
                }
                default:
                    throw new Error('Illegal op_code: ' + ty);
            }
        }
        const length = leb128_1.lebDecode(pipe).toNumber();
        for (let i = 0; i < length; i++) {
            leb128_1.slebDecode(pipe);
        }
    }
    decodeType(b);
    const output = retTypes.map(t => t.decodeValue(b));
    if (b.buffer.length > 0) {
        throw new Error('decode: Left-over bytes');
    }
    return output;
}
exports.decode = decode;
// Export Types instances.
exports.Empty = new EmptyClass();
exports.Bool = new BoolClass();
exports.Null = new NullClass();
exports.Text = new TextClass();
exports.Int = new IntClass();
exports.Nat = new NatClass();
exports.Float64 = new FloatClass();
exports.Int8 = new FixedIntClass(8);
exports.Int16 = new FixedIntClass(16);
exports.Int32 = new FixedIntClass(32);
exports.Int64 = new FixedIntClass(64);
exports.Nat8 = new FixedNatClass(8);
exports.Nat16 = new FixedNatClass(16);
exports.Nat32 = new FixedNatClass(32);
exports.Nat64 = new FixedNatClass(64);
exports.Principal = new PrincipalClass();
function Tuple(...types) {
    return new TupleClass(types);
}
exports.Tuple = Tuple;
function Vec(t) {
    return new VecClass(t);
}
exports.Vec = Vec;
function Opt(t) {
    return new OptClass(t);
}
exports.Opt = Opt;
function Record(t) {
    return new RecordClass(t);
}
exports.Record = Record;
function Variant(fields) {
    return new VariantClass(fields);
}
exports.Variant = Variant;
function Rec() {
    return new RecClass();
}
exports.Rec = Rec;
function Func(args, ret, annotations = []) {
    return new FuncClass(args, ret, annotations);
}
exports.Func = Func;
function Service(t) {
    return new ServiceClass(t);
}
exports.Service = Service;
//# sourceMappingURL=idl.js.map