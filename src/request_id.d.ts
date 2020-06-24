import { BinaryBlob } from './types';
export declare type RequestId = BinaryBlob & {
    __requestId__: void;
};
export declare function toHex(requestId: RequestId): string;
export declare function hash(data: BinaryBlob): Promise<BinaryBlob>;
export declare const requestIdOf: (request: Record<string, any>) => Promise<RequestId>;
