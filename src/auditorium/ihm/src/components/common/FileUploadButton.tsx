import React from 'react';

import Button from '@mui/material/Button';

import UploadFile from '@mui/icons-material/UploadFile';
import SelectedFile from '@mui/icons-material/InsertDriveFileOutlined';

import type {Theme} from '@mui/material/styles';
import type {SxProps} from '@mui/system';
import type {UseFormRegister, RegisterOptions, FieldValues, FieldPath} from 'react-hook-form';


const FileUploadButton = <
    FormData extends FieldValues = FieldValues,
    Name extends FieldPath<FormData> = FieldPath<FormData>
>(props: Props<FormData, Name>): React.ReactElement => {
    const {accept, color, label, variant, required, sx, name, register, options} = props;
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const {ref, ...registered} = register(name, options);

    const values = inputRef.current?.files;
    const value = values && values.length ? values[0] : undefined;
    const display = value ? value.name : label;

    return (
        <Button
            component="label"
            variant={variant}
            color={value ? "inherit" : color}
            startIcon={value ? <SelectedFile /> : <UploadFile />}
            sx={sx}
        >
            {display}{required && " *"}
            <input
                hidden
                required={required}
                type="file"
                accept={accept}
                {...registered}
                ref={(e) => {ref(e); inputRef.current = e;}}
            />
        </Button>
    );
};


interface Props<
    FormData extends FieldValues = FieldValues,
    Name extends FieldPath<FormData> = FieldPath<FormData>
> {
    accept?: string;
    label: string;
    color?: "primary" | "secondary";
    variant?: "contained" | "outlined" | "text";
    required?: boolean;
    sx?: SxProps<Theme>;
    name: Name;
    register: UseFormRegister<FormData>;
    options?: RegisterOptions<FormData, Name>;
}


export default FileUploadButton;
