import * as actor from './actor';
import { CanisterId } from './canisterId';
import { AuthHttpAgentRequestTransformFn, HttpAgentRequest, HttpAgentRequestTransformFn, QueryFields, QueryResponse, ReadRequest, ReadResponse, RequestStatusResponse, ResponseStatusFields, SignedHttpAgentRequest, SubmitRequest, SubmitResponse } from './http_agent_types';
import { Principal } from './principal';
import { BinaryBlob } from './types';
export interface HttpAgentOptions {
    parent?: HttpAgent;
    fetch?: typeof fetch;
    host?: string;
    principal?: Principal | Promise<Principal>;
}
export declare class HttpAgent {
    private readonly _pipeline;
    private _authTransform;
    private readonly _fetch;
    private readonly _host;
    private readonly _principal;
    constructor(options?: HttpAgentOptions);
    addTransform(fn: HttpAgentRequestTransformFn, priority?: number): void;
    setAuthTransform(fn: AuthHttpAgentRequestTransformFn): void;
    submit(submit: SubmitRequest): Promise<SubmitResponse>;
    read(request: ReadRequest): Promise<ReadResponse>;
    call(canisterId: CanisterId | string, fields: {
        methodName: string;
        arg: BinaryBlob;
    }, principal?: Principal | Promise<Principal>): Promise<SubmitResponse>;
    install(canisterId: CanisterId | string, fields: {
        module: BinaryBlob;
        arg?: BinaryBlob;
    }, principal?: Principal): Promise<SubmitResponse>;
    query(canisterId: CanisterId | string, fields: QueryFields, principal?: Principal): Promise<QueryResponse>;
    retrieveAsset(canisterId: CanisterId | string, path: string): Promise<Uint8Array>;
    requestStatus(fields: ResponseStatusFields, principal?: Principal): Promise<RequestStatusResponse>;
    get makeActorFactory(): typeof actor.makeActorFactory;
    protected _transform(request: HttpAgentRequest): Promise<HttpAgentRequest | SignedHttpAgentRequest>;
}
