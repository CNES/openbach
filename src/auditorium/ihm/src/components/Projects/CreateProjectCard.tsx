import React from 'react';
import {useForm, Controller} from 'react-hook-form';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';

import {addProject} from '../../api/projects';
import {useDispatch} from '../../redux';


const CreateProjectCard: React.FC<Props> = (props) => {
    const dispatch = useDispatch();
    const {control, handleSubmit, reset, formState: {isValid}} = useForm<FormData>({mode: 'onBlur'});

    const onSubmit = React.useCallback((data: FormData) => {
        dispatch(addProject(data));
        reset();
    }, [dispatch, reset]);

    return (
        <Card sx={{flexGrow: 1}}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent>
                    <h1>Create Project</h1>
                    <Controller
                        name="name"
                        control={control}
                        rules={{required: true}}
                        defaultValue=""
                        render={({field: {onChange, onBlur, value, ref}}) => (
                            <TextField
                                required
                                margin="dense"
                                variant="standard"
                                label="Project Name"
                                onChange={onChange}
                                onBlur={onBlur}
                                value={value}
                                inputRef={ref}
                                fullWidth
                            />
                        )}
                    />
                    <Controller
                        name="description"
                        control={control}
                        rules={{required: false}}
                        defaultValue=""
                        render={({field: {onChange, onBlur, value, ref}}) => (
                            <TextField
                                margin="dense"
                                variant="standard"
                                label="Project Description"
                                onChange={onChange}
                                onBlur={onBlur}
                                value={value}
                                inputRef={ref}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        )}
                    />
                    <FormGroup sx={{mt: 3}}>
                        <FormControlLabel
                            label="Keep Project Public"
                            control={<Controller
                                name="isPublic"
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
                        />
                    </FormGroup>
                </CardContent>
                <CardActions>
                    <Button color="secondary" variant="contained" type="submit" disabled={!isValid}>
                        New Project
                    </Button>
                </CardActions>
            </form>
        </Card>
    );
};


interface Props {
}


interface FormData {
    name: string;
    description: string;
    isPublic: boolean;
}


export default CreateProjectCard;
