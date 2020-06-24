export declare class CanisterId {
    private _idHex;
    static fromText(text: string): CanisterId;
    static fromHex(hex: string): CanisterId;
    readonly _isCanisterId = true;
    protected constructor(_idHex: string);
    toHash(): import("./types").BinaryBlob;
    toHex(): string;
    toText(): string;
}
