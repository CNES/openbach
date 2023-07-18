import React from 'react';

import Paper from '@mui/material/Paper';

import LoginDialog from '../Users/LoginDialog';
import StatusMessage from './StatusMessage';
import Toolbar from './Toolbar';
import VaultDialog from './VaultDialog';

import {useSelector} from '../../redux';


const HomePage: React.FC<React.PropsWithChildren<Props>> = (props) => {
    const connectedUser = useSelector((state) => state.login.username);

    return (
        <React.Fragment>
            <Paper key={connectedUser} sx={{minHeight: "100%", pl: "5%", pr: "5%"}}>
                <Toolbar />
                {props.children}
            </Paper>
            <StatusMessage />
            <LoginDialog />
            <VaultDialog />
        </React.Fragment>
    );
};


interface Props {
}


export default HomePage;
