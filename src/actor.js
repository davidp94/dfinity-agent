"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer/");
const canisterId_1 = require("./canisterId");
const http_agent_types_1 = require("./http_agent_types");
const IDL = __importStar(require("./idl"));
const request_id_1 = require("./request_id");
function getDefaultHttpAgent() {
    return typeof window === 'undefined'
        ? typeof global === 'undefined'
            ? typeof self === 'undefined'
                ? undefined
                : self.icHttpAgent
            : global.icHttpAgent
        : window.icHttpAgent;
}
// IDL functions can have multiple return values, so decoding always
// produces an array. Ensure that functions with single or zero return
// values behave as expected.
function decodeReturnValue(types, msg) {
    const returnValues = IDL.decode(types, buffer_1.Buffer.from(msg));
    switch (returnValues.length) {
        case 0:
            return undefined;
        case 1:
            return returnValues[0];
        default:
            return returnValues;
    }
}
const REQUEST_STATUS_RETRY_WAIT_DURATION_IN_MSECS = 500;
const DEFAULT_ACTOR_CONFIG = {
    maxAttempts: 30,
    throttleDurationInMSecs: REQUEST_STATUS_RETRY_WAIT_DURATION_IN_MSECS,
};
// Make an actor from an actor interface.
//
// Allows for one HTTP agent for the lifetime of the actor:
//
// ```
// const actor = makeActor(actorInterface)(httpAgent);
// const reply = await actor.greet();
// ```
//
// or using a different HTTP agent for the same actor if necessary:
//
// ```
// const actor = makeActor(actorInterface);
// const reply1 = await actor(httpAgent1).greet();
// const reply2 = await actor(httpAgent2).greet();
// ```
function makeActorFactory(actorInterfaceFactory) {
    const actorInterface = actorInterfaceFactory({ IDL });
    async function requestStatusAndLoop(httpAgent, requestId, returnType, attempts, maxAttempts, throttle) {
        const status = await httpAgent.requestStatus({ requestId });
        switch (status.status) {
            case http_agent_types_1.RequestStatusResponseStatus.Replied: {
                if (status.reply.arg !== undefined) {
                    return decodeReturnValue(returnType, status.reply.arg);
                }
                else if (returnType.length === 0) {
                    return undefined;
                }
                else {
                    throw new Error(`Call was returned undefined, but type [${returnType.join(',')}].`);
                }
            }
            case http_agent_types_1.RequestStatusResponseStatus.Unknown:
            case http_agent_types_1.RequestStatusResponseStatus.Pending:
                if (--attempts === 0) {
                    throw new Error(`Failed to retrieve a reply for request after ${maxAttempts} attempts:\n` +
                        `  Request ID: ${request_id_1.toHex(requestId)}\n` +
                        `  Request status: ${status.status}\n`);
                }
                // Wait a little, then retry.
                return new Promise(resolve => setTimeout(resolve, throttle)).then(() => requestStatusAndLoop(httpAgent, requestId, returnType, attempts, maxAttempts, throttle));
            case http_agent_types_1.RequestStatusResponseStatus.Rejected:
                throw new Error(`Call was rejected:\n` +
                    `  Request ID: ${request_id_1.toHex(requestId)}\n` +
                    `  Reject code: ${status.reject_code}\n` +
                    `  Reject text: ${status.reject_message}\n`);
        }
    }
    return (config) => {
        const { canisterId, maxAttempts, throttleDurationInMSecs, httpAgent } = Object.assign(Object.assign({}, DEFAULT_ACTOR_CONFIG), config);
        const cid = typeof canisterId === 'string' ? canisterId_1.CanisterId.fromText(canisterId) : canisterId;
        const actor = {
            __actorInterface() {
                return actorInterface._fields.reduce((obj, entry) => (Object.assign(Object.assign({}, obj), { [entry[0]]: entry[1] })), {});
            },
            __canisterId() {
                return cid.toHex();
            },
            async __getAsset(path) {
                const agent = httpAgent || getDefaultHttpAgent();
                if (!agent) {
                    throw new Error('Cannot make call. httpAgent is undefined.');
                }
                return agent.retrieveAsset(canisterId, path);
            },
            async __install(fields, options = {}) {
                var _a, _b;
                const agent = httpAgent || getDefaultHttpAgent();
                if (!agent) {
                    throw new Error('Cannot make call. httpAgent is undefined.');
                }
                // Resolve the options that can be used globally or locally.
                const effectiveMaxAttempts = ((_a = options.maxAttempts) === null || _a === void 0 ? void 0 : _a.valueOf()) || 0;
                const effectiveThrottle = ((_b = options.throttleDurationInMSecs) === null || _b === void 0 ? void 0 : _b.valueOf()) || 0;
                const { requestId, response } = await agent.install(canisterId, fields);
                if (!response.ok) {
                    throw new Error([
                        'Install failed:',
                        `  Canister ID: ${cid.toHex()}`,
                        `  Request ID: ${request_id_1.toHex(requestId)}`,
                        `  HTTP status code: ${response.status}`,
                        `  HTTP status text: ${response.statusText}`,
                    ].join('\n'));
                }
                return requestStatusAndLoop(agent, requestId, [], effectiveMaxAttempts, effectiveMaxAttempts, effectiveThrottle);
            },
        };
        for (const [methodName, func] of actorInterface._fields) {
            actor[methodName] = async (...args) => {
                const agent = httpAgent || getDefaultHttpAgent();
                if (!agent) {
                    throw new Error('Cannot make call. httpAgent is undefined.');
                }
                const arg = IDL.encode(func.argTypes, args);
                if (func.annotations.includes('query')) {
                    const result = await agent.query(cid, { methodName, arg });
                    switch (result.status) {
                        case "rejected" /* Rejected */:
                            throw new Error(`Query failed:\n` +
                                `  Status: ${result.status}\n` +
                                `  Message: ${result.reject_message}\n`);
                        case "replied" /* Replied */:
                            return decodeReturnValue(func.retTypes, result.reply.arg);
                    }
                }
                else {
                    const { requestId, response } = await agent.call(cid, { methodName, arg });
                    if (!response.ok) {
                        throw new Error([
                            'Call failed:',
                            `  Method: ${methodName}(${args})`,
                            `  Canister ID: ${cid.toHex()}`,
                            `  Request ID: ${request_id_1.toHex(requestId)}`,
                            `  HTTP status code: ${response.status}`,
                            `  HTTP status text: ${response.statusText}`,
                        ].join('\n'));
                    }
                    return requestStatusAndLoop(agent, requestId, func.retTypes, maxAttempts, maxAttempts, throttleDurationInMSecs);
                }
            };
        }
        return actor;
    };
}
exports.makeActorFactory = makeActorFactory;
//# sourceMappingURL=actor.js.map