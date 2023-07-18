import React from 'react';

import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import type {ICredentials} from '../../utils/interfaces';


const UserManager: React.FC<Props> = (props) => {
    const {user, onToggleDelete, onUserChange} = props;
    const {username, is_user, is_admin} = user;
    const [pendingDelete, storePendingDelete] = React.useState<boolean>(false);
    const [activeUser, storeActiveUser] = React.useState<boolean>(is_user);
    const [adminUser, storeAdminUser] = React.useState<boolean>(is_admin);

    const togglePendingDelete = React.useCallback(() => {
        onToggleDelete();
        storePendingDelete((pending: boolean) => !pending);
    }, [onToggleDelete]);

    const handlePendingDeleteChanged = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        onToggleDelete();
        storePendingDelete(event.target.checked);
    }, [onToggleDelete]);

    const handleActiveUserChanged = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const active = event.target.checked;
        onUserChange(active, adminUser);
        storeActiveUser(active);
    }, [onUserChange, adminUser]);

    const handleAdminUserChanged = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const admin = event.target.checked;
        const active = admin || activeUser;
        onUserChange(active, admin);
        storeActiveUser(active);
        storeAdminUser(admin);
    }, [onUserChange, activeUser]);

    const labelId = `checkbox-list-label-${username}`;

    return (
        <ListItem
            secondaryAction={
                <FormGroup sx={{display: "flex", flexDirection: "row"}}>
                    <FormControlLabel
                        disabled={adminUser}
                        control={<Checkbox disableRipple checked={activeUser} onChange={handleActiveUserChanged} />}
                        label="Active"
                        sx={{mr: 10}}
                    />
                    <FormControlLabel
                        control={<Checkbox disableRipple checked={adminUser} onChange={handleAdminUserChanged} />}
                        label="Admin"
                        sx={{mr: 10}}
                    />
                </FormGroup>
            }
        >
            <ListItemButton role={undefined} onClick={togglePendingDelete}>
                <ListItemIcon>
                    <Checkbox
                        edge="start"
                        checked={pendingDelete}
                        disableRipple
                        inputProps={{'aria-labelledby': labelId}}
                        onChange={handlePendingDeleteChanged}
                    />
                </ListItemIcon>
                <ListItemText id={labelId} primary={username} />
            </ListItemButton>
        </ListItem>
    );
};


interface Props {
    user: ICredentials;
    onToggleDelete: () => void;
    onUserChange: (active: boolean, admin: boolean) => void;
}


export default UserManager;
