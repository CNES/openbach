import React from 'react';
import {useParams, useNavigate} from 'react-router';
import {useForm, Controller} from 'react-hook-form';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';

import {addScenario} from '../../api/scenarios';
import {useDispatch} from '../../redux';


const CreateScenarioCard: React.FC<Props> = (props) => {
    const {projectId: project} = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {control, handleSubmit, reset, formState: {isValid}} = useForm<FormData>({mode: 'onBlur'});

    const onSubmit = React.useCallback(({scenario}: FormData) => {
        if (project) {
            dispatch(addScenario({project, scenario}))
                .unwrap()
                .then(() => {navigate(`/app/project/${project}/scenario/${scenario}`);});
            reset();
        }
    }, [project, dispatch, navigate, reset]);

    return (
        <Card sx={{flexGrow: 1}}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent>
                    <h1>Create Scenario</h1>
                    <Controller
                        name="scenario"
                        control={control}
                        rules={{required: true}}
                        defaultValue=""
                        render={({field: {onChange, onBlur, value, ref}}) => (
                            <TextField
                                required
                                margin="dense"
                                variant="standard"
                                label="Scenario Name"
                                onChange={onChange}
                                onBlur={onBlur}
                                value={value}
                                inputRef={ref}
                                fullWidth
                            />
                        )}
                    />
                </CardContent>
                <CardActions>
                    <Button color="secondary" variant="contained" type="submit" disabled={!isValid}>
                        New Scenario
                    </Button>
                </CardActions>
            </form>
        </Card>
    );
};


interface Props {
}


interface FormData {
    scenario: string;
}


export default CreateScenarioCard;
