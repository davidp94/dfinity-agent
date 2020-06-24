"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
function makeNonceTransform(nonceFn = types_1.makeNonce) {
    return async (request) => {
        request.body.nonce = nonceFn();
    };
}
exports.makeNonceTransform = makeNonceTransform;
//# sourceMappingURL=http_agent_transforms.js.map