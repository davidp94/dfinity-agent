import BigNumber from 'bignumber.js';
import Pipe = require('buffer-pipe');
import { Buffer } from 'buffer/';
export declare function lebEncode(value: number | BigNumber): Buffer;
export declare function lebDecode(pipe: Pipe): BigNumber;
export declare function slebEncode(value: BigNumber | number): Buffer;
export declare function slebDecode(pipe: Pipe): BigNumber;
export declare function writeUIntLE(value: BigNumber | number, byteLength: number): Buffer;
export declare function writeIntLE(value: BigNumber | number, byteLength: number): Buffer;
export declare function readUIntLE(pipe: Pipe, byteLength: number): BigNumber;
export declare function readIntLE(pipe: Pipe, byteLength: number): BigNumber;
