import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';

import UserManager from './UserManager';

import {useSelector, useDispatch} from '../../redux';
import {setTitle} from '../../redux/message';
import {getUsers, deleteUsers, updateUsers} from '../../api/login';
import type {IProfilePermissions} from '../../utils/interfaces';


const Manage: React.FC<Props> = (props) => {
    const [usersToDelete, storeUsersToDelete] = React.useState<string[]>([]);
    const [usersToModify, storeUsersToModify] = React.useState<IProfilePermissions[]>([]);
    const users = useSelector((state) => state.users.users);
    const dispatch = useDispatch();

    const toggleDelete = React.useCallback((username: string) => () => {
        storeUsersToDelete((users: string[]) => {
            const user = users.indexOf(username);
            if (user < 0) {
                return [...users, username];
            } else {
                return users.slice(0, user).concat(users.slice(user + 1));
            }
        });
    }, []);

    const modifyUser = React.useCallback((username: string) => (active: boolean, admin: boolean) => {
        storeUsersToModify((users: IProfilePermissions[]) => {
            let found = false;
            const newUsers = users.map((u: IProfilePermissions) => {
                if (u.login === username) {
                    found = true;
                    return {login: username, active, admin}
                } else {
                    return u;
                }
            });
            if (!found) {
                newUsers.push({ login: username, active, admin });
            }
            return newUsers;
        });
    }, []);

    const handleDelete = React.useCallback(() => {
        dispatch(deleteUsers({usernames: usersToDelete}));
        storeUsersToDelete([]);
        storeUsersToModify([]);
    }, [dispatch, usersToDelete]);

    const handleModify = React.useCallback(() => {
        dispatch(updateUsers({permissions: usersToModify}));
        storeUsersToDelete([]);
        storeUsersToModify([]);
    }, [dispatch, usersToModify]);

    React.useEffect(() => {
        dispatch(setTitle("OpenBach Administration"));
        const promise = dispatch(getUsers());
        return () => {promise.abort();};
    }, [dispatch]);

    const permissions = users.map((user) => <UserManager key={user.username} user={user} onToggleDelete={toggleDelete(user.username)} onUserChange={modifyUser(user.username)} />);

    return (
        <React.Fragment>
            <List>{permissions}</List>
            <Box m={5} textAlign="right">
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleDelete}
                    disabled={!usersToDelete.length}
                    sx={{m: 5}}
                >
                    Delete Selected Users
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleModify}
                    disabled={!usersToModify.length}
                    sx={{m: 5}}
                >
                    Apply Modifications
                </Button>
            </Box>
        </React.Fragment>
    );
};


interface Props {
}


export default Manage;
