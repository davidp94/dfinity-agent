import { Buffer } from 'buffer/';
export interface JsonArray extends Array<JsonValue> {
}
export interface JsonObject extends Record<string, JsonValue> {
}
export declare type JsonValue = boolean | string | number | JsonArray | JsonObject;
export declare type BinaryBlob = Buffer & {
    __BLOB: never;
};
export declare function blobFromUint8Array(arr: Uint8Array): BinaryBlob;
export declare function blobFromHex(hex: string): BinaryBlob;
export declare function blobToHex(blob: BinaryBlob): string;
export declare type Nonce = BinaryBlob & {
    __nonce__: void;
};
export declare function makeNonce(): Nonce;
