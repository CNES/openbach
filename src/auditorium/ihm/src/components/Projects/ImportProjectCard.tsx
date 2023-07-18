import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import UploadButton from '../common/FileUploadButton';

import {importProject} from '../../api/projects';
import {useDispatch} from '../../redux';


const ImportProjectCard: React.FC<Props> = (props) => {
    const dispatch = useDispatch();
    const {control, handleSubmit, register, reset, formState: {isValid}} = useForm<FormData>({mode: 'onBlur'});

    const onSubmit = React.useCallback(({project, ignoreTopology}: FormData) => {
        dispatch(importProject({project: project[0], ignoreTopology}));
        reset();
    }, [dispatch, reset]);

    return (
        <Card sx={{flexGrow: 1}}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent>
                    <h1>Import Project</h1>
                    <UploadButton
                        label="Project's File"
                        accept=".json"
                        required
                        name="project"
                        register={register}
                        options={{required: true}}
                    />
                    <FormGroup sx={{mt: 2}}>
                        <FormControlLabel
                            control={<Controller
                                name="ignoreTopology"
                                control={control}
                                rules={{required: false}}
                                defaultValue={false}
                                render={({field: {onChange, onBlur, value, ref}}) => (
                                    <Checkbox
                                        checked={value}
                                        onChange={onChange}
                                        onBlur={onBlur}
                                        inputRef={ref}
                                    />
                                )}
                            />}
                            label="Ignore Network Topology"
                        />
                    </FormGroup>
                </CardContent>
                <CardActions>
                    <Button color="secondary" variant="contained" type="submit" disabled={!isValid}>
                        Import Project
                    </Button>
                </CardActions>
            </form>
        </Card>
    );
};


interface Props {
}


interface FormData {
    project: FileList;
    ignoreTopology: boolean;
}


export default ImportProjectCard;
