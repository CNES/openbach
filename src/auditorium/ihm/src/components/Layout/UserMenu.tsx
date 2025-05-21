import React from 'react';

import MenuItem from '@mui/material/MenuItem';

import MenuButton from '../common/MenuButton';
import TextLink from '../common/TextLink';

import {useSelector, useDispatch} from '../../redux';
import {openLoginDialog} from '../../redux/login';
import {doLogout} from '../../api/login';


const CreateDialog = React.lazy(() => import('../Users/CreateUserDialog'));


const UserMenu: React.FC<Props> = (props) => {
    const [create, setCreate] = React.useState<boolean>(false);
    const connectedUser = useSelector((state) => state.login.username);
    const activeUser = useSelector((state) => state.login.is_user);
    const adminUser = useSelector((state) => state.login.is_admin);
    const dispatch = useDispatch();

    const handleLogout = React.useCallback(() => {
        dispatch(doLogout());
    }, [dispatch]);

    const handleLogin = React.useCallback(() => {
        dispatch(openLoginDialog());
    }, [dispatch]);

    const openCreateDialog = React.useCallback(() => {
        setCreate(true);
    }, []);

    const closeCreateDialog = React.useCallback(() => {
        setCreate(false);
    }, []);

    const menu = !connectedUser ? [
        <MenuItem key="login" onClick={handleLogin}>Authenticate</MenuItem>,
        <MenuItem key="create" onClick={openCreateDialog}>Create User</MenuItem>,
    ] : !activeUser ? [
        <MenuItem key="settings"><TextLink to="/app/settings">User Settings</TextLink></MenuItem>,
        <MenuItem key="logout" onClick={handleLogout}>Disconnect</MenuItem>,
    ] : !adminUser ? [
        <MenuItem key="agents"><TextLink to="/app/admin/agents">Agents</TextLink></MenuItem>,
        <MenuItem key="jobs"><TextLink to="/app/admin/jobs">Jobs</TextLink></MenuItem>,
        <MenuItem key="settings"><TextLink to="/app/settings">User Settings</TextLink></MenuItem>,
        <MenuItem key="logout" onClick={handleLogout}>Disconnect</MenuItem>,
    ] : [
        <MenuItem key="agents"><TextLink to="/app/admin/agents">Agents</TextLink></MenuItem>,
        <MenuItem key="jobs"><TextLink to="/app/admin/jobs">Jobs</TextLink></MenuItem>,
        <MenuItem key="manage"><TextLink to="/app/admin/users">Manage Users</TextLink></MenuItem>,
        <MenuItem key="settings"><TextLink to="/app/settings">User Settings</TextLink></MenuItem>,
        <MenuItem key="logout" onClick={handleLogout}>Disconnect</MenuItem>,
    ];

    return (
        <React.Fragment>
            <MenuButton title={connectedUser ? connectedUser : "Anonymous"}  useColor>
                {menu}
            </MenuButton>
            {create && <React.Suspense><CreateDialog open={true} onClose={closeCreateDialog} /></React.Suspense>}
        </React.Fragment>
    );
};


interface Props {
}


export default UserMenu;
