"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./actor"));
var auth_1 = require("./auth");
exports.generateKeyPair = auth_1.generateKeyPair;
exports.makeAuthTransform = auth_1.makeAuthTransform;
exports.makeKeyPair = auth_1.makeKeyPair;
__export(require("./canisterId"));
__export(require("./http_agent"));
__export(require("./http_agent_transforms"));
__export(require("./http_agent_types"));
__export(require("./principal"));
__export(require("./types"));
const IDL = __importStar(require("./idl"));
exports.IDL = IDL;
// TODO The following modules will be a separate library for Candid
const UICore = __importStar(require("./candid/candid-core"));
exports.UICore = UICore;
const UI = __importStar(require("./candid/candid-ui"));
exports.UI = UI;
//# sourceMappingURL=index.js.map