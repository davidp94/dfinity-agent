"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
async function sha256(data) {
    const digest = await crypto.subtle.digest({ name: 'SHA-256' }, new Uint8Array(data));
    return types_1.blobFromUint8Array(new Uint8Array(digest));
}
exports.sha256 = sha256;
//# sourceMappingURL=sha256.js.map