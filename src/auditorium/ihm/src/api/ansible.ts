import {asyncThunk, doFetch} from './base';
import {listener} from '../redux';
import {setMessage} from '../redux/message';
import {registerPendingAction, removePendingAction, registerFailed, clearFailed} from '../redux/ansible';

import {getAgents, addAgent, removeAgent, updateAgent, reserveProject} from './agents';
import {addEntity, removeEntity, updateEntityAgent} from './entities';
import {installOnAgents, uninstallOnAgents} from './jobs';
import {addProject, updateProject, refreshTopology} from './projects';

import type {IProject, INetwork, IAgent} from '../utils/interfaces';
import type {NewAgent} from './agents';


export const storeVaultPassword = asyncThunk<void, {password: string;}>(
    'ansible/storeVaultPassword',
    async ({password}, {dispatch, getState}) => {
        const {failedActions, pendingActions} = getState().ansible;
        const ignored: string[] = [];

        // Send password in an innocuous request
        // so it is stored in the backend session
        try {
            await doFetch<{}>(
                '/openbach/version',
                dispatch,
                "POST",
                {vault_password: password},
            );
        } catch (err) {
            dispatch(setMessage("Failed setting Vault password in session: " + err));
            return;
        }

        failedActions.forEach((id: string) => {
            const action = pendingActions[id];
            if (!action) {
                return;
            }

            switch (action.type) {
                case "agents/getAgents":
                    dispatch(getAgents(action.arg as {services: boolean;}));
                    break;
                case "agents/addAgent":
                    dispatch(addAgent(action.arg as NewAgent));
                    break;
                case "agents/removeAgent":
                    dispatch(removeAgent(action.arg as {address: string; detach: boolean;}));
                    break;
                case "agents/updateAgent":
                    dispatch(updateAgent(action.arg as {address: string; agent: {name: string; agent_ip: string; collector_ip: string;};}));
                    break;
                case "agents/reserveProject":
                    dispatch(reserveProject(action.arg as {address: string; projectName: string;}));
                    break;
                case "entities/addEntity":
                    dispatch(addEntity(action.arg as {project: string; name: string; description?: string; agent?: IAgent;}));
                    break;
                case "entities/removeEntity":
                    dispatch(removeEntity(action.arg as {project: string; name: string;}));
                    break;
                case "entities/updateEntityAgent":
                    dispatch(updateEntityAgent(action.arg as {project: string; name: string; description?: string; agent?: IAgent; networks?: INetwork[];}));
                    break;
                case "jobs/installOnAgents":
                    dispatch(installOnAgents(action.arg as {jobNames: string[]; agents: string[];}));
                    break;
                case "jobs/uninstallOnAgents":
                    dispatch(uninstallOnAgents(action.arg as {jobNames: string[]; agents: string[];}));
                    break;
                case "projects/addProject":
                    dispatch(addProject(action.arg as {name: string; description: string; isPublic: boolean;}));
                    break;
                case "projects/updateProject":
                    dispatch(updateProject(action.arg as {name: string; project: IProject;}));
                    break;
                case "projects/refreshTopology":
                    dispatch(refreshTopology(action.arg as {project: string; newName: INetwork | undefined;}));
                    break;
                default:
                    // purposefully ignoring importProject and addJob in
                    // order to force user to select their File again.
                    ignored.push(action.type);
            }
        });

        const attempts = failedActions.length;
        if (!attempts) {
            dispatch(setMessage("Registered Vault password for future calls"));
        } else if (ignored.length > 0) {
            dispatch(setMessage("Retried " + attempts
                                + " calls with Vault password but " + ignored.join(', ')
                                + " are not supported; you may want to redo the action yourself"));
        } else {
            dispatch(setMessage("Automatically retried " + attempts + " calls with Vault password"));
        }
        dispatch(clearFailed());
    },
);


const ignore = [
    'global',
    'message',
    'login',
    'ansible',
];


listener.startListening({
    predicate: (action, current, previous) => {
        const {type} = action;
        if (!type || typeof type !== 'string') {
            return false;
        }

        const [slice, , thunkState] = type.split('/');
        const reject = !thunkState || ignore.includes(slice);
        return !reject;
    },
    effect: (action, {dispatch}) => {
        const {type, meta: {requestId: id, arg}, error} = action;
        const [slice, name, thunkState] = type.split('/');
        const actionType = slice + "/" + name;

        switch (thunkState) {
            case "pending":
                dispatch(registerPendingAction({id, type: actionType, arg}));
                break;
            case "fulfilled":
                dispatch(removePendingAction(id));
                break;
            case "rejected":
                if (error && error.name === 'AnsibleError') {
                    dispatch(registerFailed(id));
                } else {
                    dispatch(removePendingAction(id));
                }
                break;
        }
    },
});
