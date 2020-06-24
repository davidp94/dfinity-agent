import { CanisterId } from './canisterId';
import { RejectCode } from './reject_code';
import { RequestId } from './request_id';
import { BinaryBlob } from './types';
export declare const enum Endpoint {
    Read = "read",
    Submit = "submit"
}
export declare type HttpAgentRequest = HttpAgentReadRequest | HttpAgentSubmitRequest;
export interface HttpAgentBaseRequest {
    readonly endpoint: Endpoint;
    request: RequestInit;
}
export interface HttpAgentSubmitRequest extends HttpAgentBaseRequest {
    readonly endpoint: Endpoint.Submit;
    body: SubmitRequest;
}
export interface HttpAgentReadRequest extends HttpAgentBaseRequest {
    readonly endpoint: Endpoint.Read;
    body: ReadRequest;
}
export declare type SignedHttpAgentRequest = SignedHttpAgentReadRequest | SignedHttpAgentSubmitRequest;
export interface SignedHttpAgentSubmitRequest extends HttpAgentBaseRequest {
    readonly endpoint: Endpoint.Submit;
    body: Signed<SubmitRequest>;
}
export interface SignedHttpAgentReadRequest extends HttpAgentBaseRequest {
    readonly endpoint: Endpoint.Read;
    body: Signed<ReadRequest>;
}
export interface Signed<T> {
    content: T;
    sender_pubkey: BinaryBlob;
    sender_sig: BinaryBlob;
}
export interface HttpAgentRequestTransformFn {
    (args: HttpAgentRequest): Promise<HttpAgentRequest | undefined | void>;
    priority?: number;
}
export declare type AuthHttpAgentRequestTransformFn = (args: HttpAgentRequest) => Promise<SignedHttpAgentRequest>;
export interface QueryFields {
    methodName: string;
    arg: BinaryBlob;
}
export interface ResponseStatusFields {
    requestId: RequestId;
}
export interface CallRequest extends Record<string, any> {
    request_type: SubmitRequestType.Call;
    canister_id: CanisterId;
    method_name: string;
    arg: BinaryBlob;
    sender: BinaryBlob;
}
export interface InstallCodeRequest extends Record<string, any> {
    request_type: SubmitRequestType.InstallCode;
    canister_id: CanisterId;
    module: BinaryBlob;
    arg?: BinaryBlob;
    sender: BinaryBlob;
}
export declare enum SubmitRequestType {
    Call = "call",
    InstallCode = "install_code"
}
export declare type SubmitRequest = CallRequest | InstallCodeRequest;
export interface SubmitResponse {
    requestId: RequestId;
    response: Response;
}
export declare type QueryResponse = QueryResponseReplied | QueryResponseRejected;
export interface QueryResponseBase {
    status: QueryResponseStatus;
}
export interface QueryResponseReplied extends QueryResponseBase {
    status: QueryResponseStatus.Replied;
    reply: {
        arg: BinaryBlob;
    };
}
export interface QueryResponseRejected extends QueryResponseBase {
    status: QueryResponseStatus.Rejected;
    reject_code: RejectCode;
    reject_message: string;
}
export declare const enum QueryResponseStatus {
    Replied = "replied",
    Rejected = "rejected"
}
export declare const enum ReadRequestType {
    Query = "query",
    RequestStatus = "request_status"
}
export interface QueryRequest extends Record<string, any> {
    request_type: ReadRequestType.Query;
    canister_id: CanisterId;
    method_name: string;
    arg: BinaryBlob;
    sender: BinaryBlob;
}
export interface RequestStatusRequest extends Record<string, any> {
    request_type: ReadRequestType.RequestStatus;
    request_id: RequestId;
    sender: BinaryBlob;
}
export declare type RequestStatusResponse = RequestStatusResponsePending | RequestStatusResponseReplied | RequestStatusResponseRejected | RequestStatusResponseUnknown;
export interface RequestStatusResponsePending {
    status: RequestStatusResponseStatus.Pending;
}
export interface RequestStatusResponseReplied {
    status: RequestStatusResponseStatus.Replied;
    reply: {
        arg?: BinaryBlob;
    };
}
export interface RequestStatusResponseRejected {
    status: RequestStatusResponseStatus.Rejected;
    reject_code: RejectCode;
    reject_message: string;
}
export interface RequestStatusResponseUnknown {
    status: RequestStatusResponseStatus.Unknown;
}
export declare enum RequestStatusResponseStatus {
    Pending = "pending",
    Replied = "replied",
    Rejected = "rejected",
    Unknown = "unknown"
}
export declare type ReadRequest = QueryRequest | RequestStatusRequest;
export declare type ReadResponse = QueryResponse | RequestStatusResponse;
