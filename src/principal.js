"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const sha256_1 = require("./utils/sha256");
const SELF_AUTHENTICATING_SUFFIX = 2;
class Principal {
    constructor(_blob) {
        this._blob = _blob;
        this._isPrincipal = true;
    }
    static async selfAuthenticating(publicKey) {
        const sha = await sha256_1.sha256(publicKey);
        return new Principal(types_1.blobFromUint8Array(new Uint8Array([...sha, 2])));
    }
    toBlob() {
        return this._blob;
    }
}
exports.Principal = Principal;
//# sourceMappingURL=principal.js.map