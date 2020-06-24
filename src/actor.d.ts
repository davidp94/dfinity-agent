import { CanisterId } from './canisterId';
import { HttpAgent } from './http_agent';
import * as IDL from './idl';
import { BinaryBlob } from './types';
/**
 * An actor interface. An actor is an object containing only functions that will
 * return a promise. These functions are derived from the IDL definition.
 */
export declare type Actor = Record<string, (...args: unknown[]) => Promise<unknown>> & {
    __actorInterface(): Record<string, IDL.FuncClass>;
    __canisterId(): string;
    __getAsset(path: string): Promise<Uint8Array>;
    __install(fields: {
        module: BinaryBlob;
        arg?: BinaryBlob;
    }, options?: {
        maxAttempts?: number;
        throttleDurationInMSecs?: number;
    }): Promise<void>;
};
export interface ActorConfig {
    canisterId: string | CanisterId;
    httpAgent?: HttpAgent;
    maxAttempts?: number;
    throttleDurationInMSecs?: number;
}
export declare type ActorConstructor = (config: ActorConfig) => Actor;
export declare function makeActorFactory(actorInterfaceFactory: (_: {
    IDL: typeof IDL;
}) => IDL.ServiceClass): ActorConstructor;
