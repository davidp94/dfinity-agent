"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const borc_1 = __importDefault(require("borc"));
const buffer_1 = require("buffer/");
const types_1 = require("./types");
const leb128_1 = require("./utils/leb128");
function toHex(requestId) {
    return types_1.blobToHex(requestId);
}
exports.toHex = toHex;
async function hash(data) {
    const hashed = await crypto.subtle.digest({
        name: 'SHA-256',
    }, data.buffer);
    return buffer_1.Buffer.from(hashed);
}
exports.hash = hash;
async function hashValue(value) {
    if (value instanceof borc_1.default.Tagged) {
        return hashValue(value.value);
    }
    else if (typeof value === 'string') {
        return hashString(value);
    }
    else if (typeof value === 'number') {
        return hash(leb128_1.lebEncode(value));
    }
    else if (buffer_1.Buffer.isBuffer(value)) {
        return hash(new Uint8Array(value));
    }
    else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        return hash(new Uint8Array(value));
    }
    else if (typeof value === 'object' &&
        value !== null &&
        typeof value.toHash === 'function') {
        return Promise.resolve(value.toHash()).then(x => hashValue(x));
    }
    else if (value instanceof Promise) {
        return value.then(x => hashValue(x));
    }
    else {
        throw new Error(`Attempt to hash a value of unsupported type: ${value}`);
    }
}
const hashString = (value) => {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(value);
    return hash(buffer_1.Buffer.from(encoded));
};
const concat = (bs) => {
    return bs.reduce((state, b) => {
        return new Uint8Array([...state, ...b]);
    }, new Uint8Array());
};
exports.requestIdOf = async (request) => {
    const hashed = Object.entries(request).map(async ([key, value]) => {
        const hashedKey = await hashString(key);
        const hashedValue = await hashValue(value);
        return [hashedKey, hashedValue];
    });
    const traversed = await Promise.all(hashed);
    const sorted = traversed.sort(([k1, v1], [k2, v2]) => {
        return buffer_1.Buffer.compare(buffer_1.Buffer.from(k1), buffer_1.Buffer.from(k2));
    });
    const concatenated = concat(sorted.map(concat));
    const requestId = (await hash(concatenated));
    return requestId;
};
//# sourceMappingURL=request_id.js.map