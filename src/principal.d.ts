import { SenderPubKey } from './auth';
import { BinaryBlob } from './types';
export declare class Principal {
    private _blob;
    static selfAuthenticating(publicKey: SenderPubKey): Promise<Principal>;
    readonly _isPrincipal = true;
    protected constructor(_blob: BinaryBlob);
    toBlob(): BinaryBlob;
}
