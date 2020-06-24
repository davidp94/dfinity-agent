"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-bitwise
// Note: this file uses buffer-pipe, which on Node only, uses the Node Buffer
//       implementation, which isn't compatible with the NPM buffer package
//       which we use everywhere else. This means that we have to transform
//       one into the other, hence why every function that returns a Buffer
//       actually return `new Buffer(pipe.buffer)`.
// TODO: The best solution would be to have our own buffer type around
//       Uint8Array which is standard.
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const Pipe = require("buffer-pipe");
const buffer_1 = require("buffer/");
function lebEncode(value) {
    if (typeof value === 'number') {
        value = new bignumber_js_1.default(value);
    }
    value = value.integerValue();
    if (value.lt(0)) {
        throw new Error('Cannot leb encode negative values.');
    }
    const pipe = new Pipe();
    while (true) {
        const i = value.mod(0x80).toNumber();
        value = value.idiv(0x80);
        if (value.eq(0)) {
            pipe.write([i]);
            break;
        }
        else {
            pipe.write([i | 0x80]);
        }
    }
    return new buffer_1.Buffer(pipe.buffer);
}
exports.lebEncode = lebEncode;
function lebDecode(pipe) {
    let shift = 0;
    let value = new bignumber_js_1.default(0);
    let byte;
    do {
        byte = pipe.read(1)[0];
        value = value.plus(new bignumber_js_1.default(byte & 0x7f).multipliedBy(new bignumber_js_1.default(2).pow(shift)));
        shift += 7;
    } while (byte >= 0x80);
    return value;
}
exports.lebDecode = lebDecode;
function slebEncode(value) {
    if (typeof value === 'number') {
        value = new bignumber_js_1.default(value);
    }
    value = value.integerValue();
    const isNeg = value.lt(0);
    if (isNeg) {
        value = value.abs().minus(1);
    }
    const pipe = new Pipe();
    while (true) {
        const i = getLowerBytes(value);
        value = value.idiv(0x80);
        if ((isNeg && value.eq(0) && (i & 0x40) !== 0) || (!isNeg && value.eq(0) && (i & 0x40) === 0)) {
            pipe.write([i]);
            break;
        }
        else {
            pipe.write([i | 0x80]);
        }
    }
    function getLowerBytes(num) {
        const bytes = num.mod(0x80).toNumber();
        if (isNeg) {
            // We swap the bits here again, and remove 1 to do two's complement.
            return 0x80 - bytes - 1;
        }
        else {
            return bytes;
        }
    }
    return new buffer_1.Buffer(pipe.buffer);
}
exports.slebEncode = slebEncode;
function slebDecode(pipe) {
    // Get the size of the buffer, then cut a buffer of that size.
    const pipeView = new Uint8Array(pipe.buffer);
    let len = 0;
    for (; len < pipeView.byteLength; len++) {
        if (pipeView[len] < 0x80) {
            // If it's a positive number, we reuse lebDecode.
            if ((pipeView[len] & 0x40) === 0) {
                return lebDecode(pipe);
            }
            break;
        }
    }
    const bytes = new Uint8Array(pipe.read(len + 1));
    let value = new bignumber_js_1.default(0);
    for (let i = bytes.byteLength - 1; i >= 0; i--) {
        value = value.times(0x80).plus(0x80 - (bytes[i] & 0x7f) - 1);
    }
    return value.negated().minus(1);
}
exports.slebDecode = slebDecode;
function writeUIntLE(value, byteLength) {
    if ((value instanceof bignumber_js_1.default && value.isNegative()) || value < 0) {
        throw new Error('Cannot write negative values.');
    }
    return writeIntLE(value, byteLength);
}
exports.writeUIntLE = writeUIntLE;
function writeIntLE(value, byteLength) {
    if (typeof value === 'number') {
        value = new bignumber_js_1.default(value);
    }
    value = value.integerValue();
    const pipe = new Pipe();
    let i = 0;
    let mul = new bignumber_js_1.default(256);
    let sub = 0;
    let byte = value.mod(mul).toNumber();
    pipe.write([byte]);
    while (++i < byteLength) {
        if (value.lt(0) && sub === 0 && byte !== 0) {
            sub = 1;
        }
        byte = value
            .idiv(mul)
            .minus(sub)
            .mod(256)
            .toNumber();
        pipe.write([byte]);
        mul = mul.times(256);
    }
    return new buffer_1.Buffer(pipe.buffer);
}
exports.writeIntLE = writeIntLE;
function readUIntLE(pipe, byteLength) {
    let val = new bignumber_js_1.default(pipe.read(1)[0]);
    let mul = new bignumber_js_1.default(1);
    let i = 0;
    while (++i < byteLength) {
        mul = mul.times(256);
        const byte = pipe.read(1)[0];
        val = val.plus(mul.times(byte));
    }
    return val;
}
exports.readUIntLE = readUIntLE;
function readIntLE(pipe, byteLength) {
    let val = readUIntLE(pipe, byteLength);
    const mul = new bignumber_js_1.default(2).pow(8 * (byteLength - 1) + 7);
    if (val.gte(mul)) {
        val = val.minus(mul.times(2));
    }
    return val;
}
exports.readIntLE = readIntLE;
//# sourceMappingURL=leb128.js.map