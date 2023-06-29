import React from 'react';
import {Link} from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import BaseToolbar from '@mui/material/Toolbar';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import {styled} from '@mui/material/styles';

import LogsBadge from './LogsBadge';
import UserMenu from './UserMenu';
import MenuButton from '../common/MenuButton';
import TextLink from '../common/TextLink';

import {useDispatch, useSelector} from '../../redux';
import {getVersion} from '../../api/global';


const ToolbarFiller = styled('div')(({ theme }) => ({
    ...theme.mixins.toolbar,
    marginBottom: theme.spacing(2)
}));


const logo = process.env.PUBLIC_URL + "/openbach.png"
const wikiURL = "https://github.com/CNES/openbach";


const Toolbar: React.FC<Props> = (props) => {
    const openbachVersion = useSelector((state) => state.global.version);
    const pageTitle = useSelector((state) => state.global.title);
    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(getVersion());
    }, [dispatch]);

    return (
        <React.Fragment>
            <AppBar color="default">
                <BaseToolbar disableGutters sx={{pl: "5%", pr: "5%"}}>
                    <Button component={Link} to="/app" sx={{height: 56, width: 56}}>
                        <Box component="img" height="100%" width="100%" src={logo} />
                    </Button>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        {pageTitle}
                    </Typography>
                    <Button component={Link} to="/kibana" target="_blank">
                        Logs
                    </Button>
                    <Box ml={2} mr={2}>
                        <Button component={Link} to="/chronograf/" target="_blank">
                            Statistics
                        </Button>
                    </Box>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <Box ml={2} mr={2}>
                        <MenuButton title="Help">
                            <MenuItem>
                                <TextLink to={wikiURL} target="_blank">Wiki</TextLink>
                            </MenuItem>
                            <MenuItem>
                                <TextLink to="/app/glossary">Glossary</TextLink>
                            </MenuItem>
                            <MenuItem>
                                <TextLink to="/app/icons">Scenario Instance Icons</TextLink>
                            </MenuItem>
                            <Divider />
                            <MenuItem disabled>{openbachVersion}</MenuItem>
                        </MenuButton>
                    </Box>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <Box mr={2} ml={2}>
                        <LogsBadge />
                    </Box>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <Box ml={2} mr={2}>
                        <UserMenu />
                    </Box>
                </BaseToolbar>
            </AppBar>
            <ToolbarFiller />
        </React.Fragment>
    );
};


interface Props {
}


export default Toolbar;
