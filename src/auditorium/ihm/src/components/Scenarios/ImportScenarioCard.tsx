import React from 'react';
import {useParams, useNavigate} from 'react-router';
import {useForm} from 'react-hook-form';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';

import UploadButton from '../common/FileUploadButton';

import {importScenario} from '../../api/scenarios';
import {useDispatch} from '../../redux';


const ImportScenarioCard: React.FC<Props> = (props) => {
    const {projectId: project} = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {handleSubmit, register, reset, formState: {isValid}} = useForm<FormData>({mode: 'onBlur'});

    const onSubmit = React.useCallback(({scenario}: FormData) => {
        if (project) {
            dispatch(importScenario({project, scenario: scenario[0]}))
                .unwrap()
                .then(({name}) => {navigate(`/app/project/${project}/scenario/${name}`);});
            reset();
        }
    }, [project, dispatch, reset, navigate]);

    return (
        <Card sx={{flexGrow: 1}}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent>
                    <h1>Import Scenario</h1>
                    <UploadButton
                        label="Scenario's File"
                        accept=".json"
                        required
                        name="scenario"
                        register={register}
                        options={{required: true}}
                    />
                </CardContent>
                <CardActions>
                    <Button color="secondary" variant="contained" type="submit" disabled={!isValid}>
                        Import Scenario
                    </Button>
                </CardActions>
            </form>
        </Card>
    );
};


interface Props {
}


interface FormData {
    scenario: FileList;
}


export default ImportScenarioCard;
