"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
// This file is based on:
// tslint:disable-next-line: max-line-length
// https://github.com/dfinity-lab/dfinity/blob/9bca65f8edd65701ea6bdb00e0752f9186bbc893/docs/spec/public/index.adoc#cbor-encoding-of-requests-and-responses
const borc_1 = __importDefault(require("borc"));
const buffer_1 = require("buffer/");
const cbor = __importStar(require("simple-cbor"));
const simple_cbor_1 = require("simple-cbor");
const canisterId_1 = require("./canisterId");
// We are using hansl/simple-cbor for CBOR serialization, to avoid issues with
// encoding the uint64 values that the HTTP handler of the client expects for
// canister IDs. However, simple-cbor does not yet provide deserialization so
// we are using `BigNumber` and `Buffer` types instead of `BigInt` and
// `Uint8Array` (respectively) so that we can use the dignifiedquire/borc CBOR
// decoder.
class PrincipalEncoder {
    get name() {
        return 'CanisterId';
    }
    get priority() {
        return 0;
    }
    match(value) {
        return value && value._isPrincipal === true;
    }
    encode(v) {
        return cbor.value.bytes(v.toBlob());
    }
}
class CanisterIdEncoder {
    get name() {
        return 'CanisterId';
    }
    get priority() {
        return 0;
    }
    match(value) {
        return value && value._isCanisterId === true;
    }
    encode(v) {
        const h = v.toHex().match(/.{1,2}/g);
        if (!h) {
            throw new Error('Provided Canister id is not a array of bytes');
        }
        return cbor.value.bytes(new Uint8Array(h.map(a => parseInt(a, 16))));
    }
}
class BufferEncoder {
    get name() {
        return 'Buffer';
    }
    get priority() {
        return 1;
    }
    match(value) {
        return buffer_1.Buffer.isBuffer(value);
    }
    encode(v) {
        return cbor.value.bytes(new Uint8Array(v));
    }
}
const serializer = simple_cbor_1.SelfDescribeCborSerializer.withDefaultEncoders(true);
serializer.addEncoder(new PrincipalEncoder());
serializer.addEncoder(new CanisterIdEncoder());
serializer.addEncoder(new BufferEncoder());
var CborTag;
(function (CborTag) {
    CborTag[CborTag["Uint64LittleEndian"] = 71] = "Uint64LittleEndian";
    CborTag[CborTag["Semantic"] = 55799] = "Semantic";
})(CborTag = exports.CborTag || (exports.CborTag = {}));
exports.encode = (value) => {
    return buffer_1.Buffer.from(serializer.serialize(value));
};
function decode(input) {
    const decoder = new borc_1.default.Decoder({
        size: input.byteLength,
        tags: {
            [CborTag.Semantic]: (value) => value,
        },
    });
    const result = decoder.decodeFirst(input);
    if (result.hasOwnProperty('canister_id')) {
        result.canister_id = canisterId_1.CanisterId.fromText(result.canister_id.toString(16));
    }
    return result;
}
exports.decode = decode;
//# sourceMappingURL=cbor.js.map