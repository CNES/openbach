import {FieldArrayMetaProps, FieldsProps} from "@types/redux-form";


/**
 * Fixing @types definition that are missing the
 * removeAll() method.
 */
export interface IFieldsProps<T> extends FieldsProps<T> {
    removeAll(): void;
}


/**
 * Exporting WrappedFieldArrayProps as our
 * own type providing the missing method.
 */
export interface IFieldArrayProps<T> {
    fields: IFieldsProps<T>;
    meta: FieldArrayMetaProps;
}
