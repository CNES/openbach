import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import FileUpload from '../common/FileUploadButton';

import {addJob} from '../../api/jobs';
import {useDispatch} from '../../redux';


const JobCreator: React.FC<Props> = (props) => {
    const dispatch = useDispatch();
    const {control, handleSubmit, register, reset, formState: {isValid}} = useForm<FormData>({mode: 'onBlur'});

    const onSubmit = React.useCallback(({job, file}: FormData) => {
        dispatch(addJob({job, file: file[0]}));
        reset();
    }, [dispatch, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
                name="job"
                control={control}
                rules={{required: true}}
                defaultValue=""
                render={({field: {onChange, onBlur, value, ref}}) => (
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        variant="standard"
                        label="New Job Name"
                        onChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        inputRef={ref}
                        fullWidth
                    />
                )}
            />
            <FileUpload
                required
                label="Definition's file"
                accept=".tar.gz,.tgz"
                name="file"
                register={register}
                options={{required: true}}
            />
            <Box textAlign="end">
                <Button type="submit" variant="contained" color="secondary" disabled={!isValid}>
                    Add Job
                </Button>
            </Box>
        </form>
    );
};


interface Props {
}


interface FormData {
    job: string;
    file: FileList;
}


export default JobCreator;
