import { HttpAgentRequestTransformFn } from './http_agent_types';
import { Nonce } from './types';
export declare function makeNonceTransform(nonceFn?: () => Nonce): HttpAgentRequestTransformFn;
