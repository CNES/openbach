import React from 'react';

import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';

import Dialog from '../common/ActionDialog';

import {launchScenario} from '../../api/scenarios';
import {useDispatch} from '../../redux';


const ScenarioLaunchDialog: React.FC<Props> = (props) => {
    const {project, scenario, arguments: args, onClose} = props;
    const dispatch = useDispatch();
    const [parameters, storeParameters] = React.useState<{[name: string]: string;}>(Object.fromEntries(args.map((name: string) => [name, ""])));

    const handleChange = React.useCallback((key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        storeParameters((p) => ({...p, [key]: event.target.value}));
    }, []);

    const handleLaunch = React.useCallback((event: React.FormEvent) => {
        dispatch(launchScenario({project, scenario, args: parameters}));
        onClose();
    }, [project, scenario, parameters, onClose, dispatch]);

    return (
        <Dialog
            open
            title={`Launch scenario ${scenario}`}
            cancel={{label: "Cancel", action: onClose}}
            actions={[{label: "Launch", action: "submit"}]}
            onSubmit={handleLaunch}
        >
            <DialogContent>
                {args.length > 0 && <DialogContentText>
                    Please fill in the arguments of the
                    scenario before proceeding:
                </DialogContentText>}
                {args.map((name: string) => (
                    <TextField
                        key={name}
                        required
                        margin="dense"
                        variant="standard"
                        label={name}
                        value={parameters[name]}
                        onChange={handleChange(name)}
                        fullWidth
                    />
                ))}
                <DialogContentText mt={args.length ? 3 : 0}>
                    Launch the Scenario!
                </DialogContentText>
            </DialogContent>
        </Dialog>
    );
};


interface Props {
    project: string;
    scenario: string;
    arguments: string[];
    onClose: () => void;
}


export default ScenarioLaunchDialog;
