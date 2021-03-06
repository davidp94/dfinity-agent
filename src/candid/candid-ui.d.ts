import * as IDL from '../idl';
import * as UI from './candid-core';
declare type InputBox = UI.InputBox;
export declare const inputBox: (t: IDL.Type<any>, config: Partial<UI.UIConfig>) => UI.InputBox;
export declare const recordForm: (fields: [string, IDL.Type<any>][], config: Partial<UI.FormConfig>) => UI.RecordForm;
export declare const variantForm: (fields: [string, IDL.Type<any>][], config: Partial<UI.FormConfig>) => UI.VariantForm;
export declare const optForm: (ty: IDL.Type<any>, config: Partial<UI.FormConfig>) => UI.OptionForm;
export declare const vecForm: (ty: IDL.Type<any>, config: Partial<UI.FormConfig>) => UI.VecForm;
export declare class Render extends IDL.Visitor<null, InputBox> {
    visitType<T>(t: IDL.Type<T>, d: null): InputBox;
    visitNull(t: IDL.NullClass, d: null): InputBox;
    visitRecord(t: IDL.RecordClass, fields: Array<[string, IDL.Type]>, d: null): InputBox;
    visitVariant(t: IDL.VariantClass, fields: Array<[string, IDL.Type]>, d: null): InputBox;
    visitOpt<T>(t: IDL.OptClass<T>, ty: IDL.Type<T>, d: null): InputBox;
    visitVec<T>(t: IDL.VecClass<T>, ty: IDL.Type<T>, d: null): InputBox;
    visitRec<T>(t: IDL.RecClass<T>, ty: IDL.ConstructType<T>, d: null): InputBox;
}
export declare function renderInput(t: IDL.Type): InputBox;
export declare function renderValue(t: IDL.Type, input: InputBox, value: any): void;
export {};
