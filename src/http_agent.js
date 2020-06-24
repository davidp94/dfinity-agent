"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const base64_js_1 = require("base64-js");
const buffer_1 = require("buffer/");
const actor = __importStar(require("./actor"));
const canisterId_1 = require("./canisterId");
const cbor = __importStar(require("./cbor"));
const http_agent_types_1 = require("./http_agent_types");
const IDL = __importStar(require("./idl"));
const request_id_1 = require("./request_id");
const types_1 = require("./types");
const API_VERSION = 'v1';
function getDefaultFetch() {
    return typeof window === 'undefined'
        ? typeof global === 'undefined'
            ? typeof self === 'undefined'
                ? undefined
                : self.fetch.bind(self)
            : global.fetch.bind(global)
        : window.fetch.bind(window);
}
// A HTTP agent allows users to interact with a client of the internet computer
// using the available methods. It exposes an API that closely follows the
// public view of the internet computer, and is not intended to be exposed
// directly to the majority of users due to its low-level interface.
//
// There is a pipeline to apply transformations to the request before sending
// it to the client. This is to decouple signature, nonce generation and
// other computations so that this class can stay as simple as possible while
// allowing extensions.
class HttpAgent {
    constructor(options = {}) {
        this._pipeline = [];
        this._authTransform = null;
        this._host = '';
        this._principal = null;
        if (options.parent) {
            this._pipeline = [...options.parent._pipeline];
            this._authTransform = options.parent._authTransform;
            this._principal = options.parent._principal;
        }
        this._fetch = options.fetch || getDefaultFetch() || fetch.bind(global);
        if (options.host) {
            if (!options.host.match(/^[a-z]+:/) && typeof window !== 'undefined') {
                this._host = window.location.protocol + '//' + options.host;
            }
            else {
                this._host = options.host;
            }
        }
        if (options.principal) {
            this._principal = Promise.resolve(options.principal);
        }
    }
    addTransform(fn, priority = fn.priority || 0) {
        // Keep the pipeline sorted at all time, by priority.
        const i = this._pipeline.findIndex(x => (x.priority || 0) < priority);
        this._pipeline.splice(i >= 0 ? i : this._pipeline.length, 0, Object.assign(fn, { priority }));
    }
    setAuthTransform(fn) {
        this._authTransform = fn;
    }
    async submit(submit) {
        const transformedRequest = (await this._transform({
            request: {
                body: null,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/cbor',
                },
            },
            endpoint: "submit" /* Submit */,
            body: submit,
        }));
        const body = cbor.encode(transformedRequest.body);
        // Run both in parallel. The fetch is quite expensive, so we have plenty of time to
        // calculate the requestId locally.
        const [response, requestId] = await Promise.all([
            this._fetch(`${this._host}/api/${API_VERSION}/${"submit" /* Submit */}`, Object.assign(Object.assign({}, transformedRequest.request), { body })),
            request_id_1.requestIdOf(submit),
        ]);
        return { requestId, response };
    }
    async read(request) {
        const transformedRequest = (await this._transform({
            request: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/cbor',
                },
            },
            endpoint: "read" /* Read */,
            body: request,
        }));
        const body = cbor.encode(transformedRequest.body);
        const response = await this._fetch(`${this._host}/api/${API_VERSION}/${"read" /* Read */}`, Object.assign(Object.assign({}, transformedRequest.request), { body }));
        return cbor.decode(buffer_1.Buffer.from(await response.arrayBuffer()));
    }
    async call(canisterId, fields, principal) {
        let p = this._principal || principal;
        if (!p) {
            throw new Error('No principal specified.');
        }
        p = await Promise.resolve(p);
        return this.submit({
            request_type: http_agent_types_1.SubmitRequestType.Call,
            canister_id: typeof canisterId === 'string' ? canisterId_1.CanisterId.fromText(canisterId) : canisterId,
            method_name: fields.methodName,
            arg: fields.arg,
            sender: p.toBlob(),
        });
    }
    async install(canisterId, fields, principal) {
        let p = this._principal || principal;
        if (!p) {
            throw new Error('No principal specified.');
        }
        p = await Promise.resolve(p);
        return this.submit({
            request_type: http_agent_types_1.SubmitRequestType.InstallCode,
            canister_id: typeof canisterId === 'string' ? canisterId_1.CanisterId.fromText(canisterId) : canisterId,
            module: fields.module,
            arg: fields.arg || types_1.blobFromHex(''),
            sender: p.toBlob(),
        });
    }
    async query(canisterId, fields, principal) {
        let p = this._principal || principal;
        if (!p) {
            throw new Error('No principal specified.');
        }
        p = await Promise.resolve(p);
        return this.read({
            request_type: "query" /* Query */,
            canister_id: typeof canisterId === 'string' ? canisterId_1.CanisterId.fromText(canisterId) : canisterId,
            method_name: fields.methodName,
            arg: fields.arg,
            sender: p.toBlob(),
        });
    }
    retrieveAsset(canisterId, path) {
        const arg = IDL.encode([IDL.Text], [path]);
        return this.query(canisterId, { methodName: '__dfx_asset_path', arg }).then(response => {
            switch (response.status) {
                case "rejected" /* Rejected */:
                    throw new Error(`An error happened while retrieving asset "${path}":\n` +
                        `  Status: ${response.status}\n` +
                        `  Message: ${response.reject_message}\n`);
                case "replied" /* Replied */:
                    const [content] = IDL.decode([IDL.Text], response.reply.arg);
                    return base64_js_1.toByteArray('' + content);
            }
        });
    }
    async requestStatus(fields, principal) {
        let p = this._principal || principal;
        if (!p) {
            throw new Error('No principal specified.');
        }
        p = await Promise.resolve(p);
        return this.read({
            request_type: "request_status" /* RequestStatus */,
            request_id: fields.requestId,
            sender: p.toBlob(),
        });
    }
    get makeActorFactory() {
        return actor.makeActorFactory;
    }
    _transform(request) {
        let p = Promise.resolve(request);
        for (const fn of this._pipeline) {
            p = p.then(r => fn(r).then(r2 => r2 || r));
        }
        if (this._authTransform != null) {
            return p.then(this._authTransform);
        }
        else {
            return p;
        }
    }
}
exports.HttpAgent = HttpAgent;
//# sourceMappingURL=http_agent.js.map