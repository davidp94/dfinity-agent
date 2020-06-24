"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer/");
const leb128_1 = require("./utils/leb128");
function blobFromUint8Array(arr) {
    return buffer_1.Buffer.from(arr);
}
exports.blobFromUint8Array = blobFromUint8Array;
function blobFromHex(hex) {
    return buffer_1.Buffer.from(hex, 'hex');
}
exports.blobFromHex = blobFromHex;
function blobToHex(blob) {
    return blob.toString('hex');
}
exports.blobToHex = blobToHex;
function makeNonce() {
    return leb128_1.lebEncode(+(+Date.now() + ('' + Math.random()).slice(2, 7)));
}
exports.makeNonce = makeNonce;
//# sourceMappingURL=types.js.map