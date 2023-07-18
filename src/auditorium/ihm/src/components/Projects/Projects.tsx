import React from 'react';

import Box from '@mui/material/Box';

import CreateProject from './CreateProjectCard';
import ImportProject from './ImportProjectCard';
import ProjectsList from './ProjectsList';

import {getProjects} from '../../api/projects';
import {useDispatch} from '../../redux';
import {setTitle} from '../../redux/message';


const Projects: React.FC<Props> = (props) => {
    const dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(setTitle("Projects List"));
        const promise = dispatch(getProjects());
        return () => {promise.abort();};
    }, [dispatch]);

    return (
        <React.Fragment>
            <ProjectsList />
            <Box
                display="flex"
                alignItems="flex-start"
                gap="10%"
                pl="10%"
                pr="10%"
                pt={5}
                width="100%"
                boxSizing="border-box"
            >
                <CreateProject />
                <ImportProject />
            </Box>
        </React.Fragment>
    );
};


interface Props {
}


export default Projects;
