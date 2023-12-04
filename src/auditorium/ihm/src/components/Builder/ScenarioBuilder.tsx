import React from 'react';
import {useForm, Controller, FormProvider} from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

import DownloadButton from '../common/DownloadButton';
import JsonEditor from '../common/JsonEditor';
import ScenarioArguments from './ScenarioArguments';
import ScenarioConstants from './ScenarioConstants';
import ScenarioFunctions from './ScenarioFunctions';
import ScenarioLaunchDialog from '../Scenarios/ScenarioLaunchDialog';

import {favoriteScenario, updateScenario, saveScenario} from '../../api/scenarios';
import {useDispatch, useSelector} from '../../redux';
import type {IScenario, Form} from '../../utils/interfaces';


const ScenarioBuilder: React.FC<Props> = (props) => {
    const {project, scenario: name} = props;
    const favorites = useSelector((state) => state.login.favorites);
    const scenario = useSelector((state) => state.form[name]);
    const dispatch = useDispatch();
    const methods = useForm<Form>({mode: 'onBlur'});
    const {handleSubmit, reset, formState: {isValid, isDirty}} = methods;
    const [launch, storeLaunch] = React.useState<boolean>(false);

    const favorite = React.useMemo(() => {
        return Boolean(favorites[project]?.includes(name));
    }, [project, name, favorites]);

    const handleOpen = React.useCallback(() => {
        storeLaunch(true);
    }, []);

    const handleClose = React.useCallback(() => {
        storeLaunch(false);
    }, []);

    const handleFavoriteChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const favorite = event.target.checked;
        dispatch(favoriteScenario({project, scenario: name, favorite}));
        
    }, [project, name, dispatch]);

    const handleScenarioUpdate = React.useCallback((json: string) => {
        const updated = JSON.parse(json) as IScenario;
        dispatch(updateScenario({project, scenario: updated}));
    }, [project, dispatch]);

    const onSubmit = React.useCallback((data: Form) => {
        dispatch(saveScenario({project, name, form: data}));
    }, [project, name, dispatch]);

    React.useEffect(() => {
        if (scenario) {
            reset(scenario.form);
        }
    }, [scenario, reset]);

    if (!scenario) {
        return (
            <Box display="flex" alignItems="center" flexDirection="column">
                <CircularProgress />
                <p>Loading jobs, please wait!</p>
            </Box>
        );
    }

    const {form: {arguments: args}} = scenario;

    return (
        <React.Fragment>
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box m="0px 8px">
                        <Controller
                            name="description"
                            rules={{required: false}}
                            defaultValue=""
                            render={({field: {onChange, onBlur, value, ref}}) => (
                                <TextField
                                    margin="dense"
                                    variant="standard"
                                    label="Description"
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                    inputRef={ref}
                                    fullWidth
                                    multiline
                                />
                            )}
                        />
                        <Box display="flex" gap="8px" m="30px 0" justifyContent="center">
                            <FormGroup>
                                <FormControlLabel
                                    control={<Switch
                                        checked={favorite}
                                        onChange={handleFavoriteChange}
                                    />}
                                    label="Favorite"
                                />
                            </FormGroup>
                            <JsonEditor
                                label="Scenario"
                                initial={scenario.initial}
                                onUpdate={handleScenarioUpdate}
                            />
                            <DownloadButton
                                route={`/openbach/project/${project}/scenario/${name}`}
                                filename={`${name}.json`}
                                label="Scenario"
                                disabled={isDirty}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                disabled={!isValid || !isDirty}
                            >
                                Save
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                disabled={isDirty}
                                onClick={handleOpen}
                            >
                                Launch
                            </Button>
                        </Box>
                    </Box>
                    <List>
                        <ScenarioArguments />
                        <ScenarioConstants />
                        <ScenarioFunctions scenario={name} />
                    </List>
                    <Box marginTop="5px" textAlign="center">
                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            disabled={!isValid || !isDirty}
                        >
                            Save
                        </Button>
                    </Box>
                </form>
            </FormProvider>
            {launch && <ScenarioLaunchDialog
                project={project}
                scenario={name}
                arguments={args.map((arg) => arg.name)}
                onClose={handleClose}
            />}
        </React.Fragment>
    );
};


interface Props {
    project: string;
    scenario: string;
}


export default ScenarioBuilder;
