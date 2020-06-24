"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crc_1 = require("crc");
const types_1 = require("./types");
function getCrc(hex) {
    return crc_1.crc8(Buffer.from(hex, 'hex'))
        .toString(16)
        .toUpperCase()
        .padStart(2, '0');
}
// Canister IDs are represented as an array of bytes in the HTTP handler of the client.
class CanisterId {
    constructor(_idHex) {
        this._idHex = _idHex;
        this._isCanisterId = true;
    }
    static fromText(text) {
        if (text.startsWith('ic:')) {
            const hex = text.slice(3);
            if (hex.length >= 2 && hex.length % 2 === 0 && /^[0-9A-F]+$/.test(hex)) {
                const id = hex.slice(0, -2);
                const checksum = hex.slice(-2);
                if (checksum !== getCrc(id)) {
                    throw new Error('Illegal CanisterId: ' + text);
                }
                return this.fromHex(id);
            }
            else {
                throw new Error('Cannot parse CanisterId: ' + text);
            }
        }
        else {
            throw new Error('CanisterId is not a "ic:" url: ' + text);
        }
    }
    static fromHex(hex) {
        return new this(hex);
    }
    toHash() {
        return types_1.blobFromHex(this._idHex);
    }
    toHex() {
        return this._idHex;
    }
    toText() {
        const crc = getCrc(this._idHex);
        return 'ic:' + this.toHex() + crc;
    }
}
exports.CanisterId = CanisterId;
//# sourceMappingURL=canisterId.js.map