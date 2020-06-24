"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer/");
const tweetnacl_1 = require("tweetnacl");
const request_id_1 = require("./request_id");
exports.sign = (secretKey) => (requestId) => {
    const signature = tweetnacl_1.sign.detached(requestId, secretKey);
    return buffer_1.Buffer.from(signature);
};
function verify(requestId, senderSig, senderPubKey) {
    return tweetnacl_1.sign.detached.verify(requestId, senderSig, senderPubKey);
}
exports.verify = verify;
exports.createKeyPairFromSeed = (seed) => {
    const { publicKey, secretKey } = tweetnacl_1.sign.keyPair.fromSeed(seed);
    return {
        publicKey: buffer_1.Buffer.from(publicKey),
        secretKey: buffer_1.Buffer.from(secretKey),
    };
};
// TODO/Note/XXX(eftychis): Unused for the first pass. This provides
// us with key generation for the client.
function generateKeyPair() {
    const { publicKey, secretKey } = tweetnacl_1.sign.keyPair();
    return makeKeyPair(publicKey, secretKey);
}
exports.generateKeyPair = generateKeyPair;
function makeKeyPair(publicKey, secretKey) {
    return {
        publicKey: buffer_1.Buffer.from(publicKey),
        secretKey: buffer_1.Buffer.from(secretKey),
    };
}
exports.makeKeyPair = makeKeyPair;
function makeAuthTransform(keyPair, senderSigFn = exports.sign) {
    const { publicKey, secretKey } = keyPair;
    const signFn = senderSigFn(secretKey);
    const fn = async (r) => {
        const { body } = r, fields = __rest(r, ["body"]);
        const requestId = await request_id_1.requestIdOf(body);
        return Object.assign(Object.assign({}, fields), { body: {
                content: body,
                sender_pubkey: publicKey,
                sender_sig: signFn(requestId),
            } });
    };
    return fn;
}
exports.makeAuthTransform = makeAuthTransform;
//# sourceMappingURL=auth.js.map