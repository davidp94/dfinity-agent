import { AuthHttpAgentRequestTransformFn } from './http_agent_types';
import { RequestId } from './request_id';
import { BinaryBlob } from './types';
export declare type SenderPubKey = BinaryBlob & {
    __senderPubKey__: void;
};
export declare type SenderSecretKey = BinaryBlob & {
    __senderSecretKey__: void;
};
export declare type SenderSig = BinaryBlob & {
    __senderSig__: void;
};
export interface KeyPair {
    publicKey: SenderPubKey;
    secretKey: SenderSecretKey;
}
export declare const sign: (secretKey: SenderSecretKey) => (requestId: RequestId) => SenderSig;
export declare function verify(requestId: RequestId, senderSig: SenderSig, senderPubKey: SenderPubKey): boolean;
export declare const createKeyPairFromSeed: (seed: Uint8Array) => KeyPair;
export declare function generateKeyPair(): KeyPair;
export declare function makeKeyPair(publicKey: Uint8Array, secretKey: Uint8Array): KeyPair;
export declare type SigningConstructedFn = (secretKey: SenderSecretKey) => (requestId: RequestId) => SenderSig;
export declare function makeAuthTransform(keyPair: KeyPair, senderSigFn?: SigningConstructedFn): AuthHttpAgentRequestTransformFn;
