import React from 'react';

import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';

import ContentClear from '@mui/icons-material/Clear';

import EntityAdd from './EntityAdd';
import EntityCard from './EntityCard';
import NetworkCard from './NetworkCard';

import type {IEntity, INetwork} from '../../utils/interfaces';


const EntityManager: React.FC<Props> = (props) => {
    const {project, selectedEntity, selectedNetwork, onUnselect} = props;

    const card = selectedEntity ? (
        <EntityCard
            entity={selectedEntity}
            project={project}
            onRemove={onUnselect}
        />
    ) : selectedNetwork ? (
        <NetworkCard
            network={selectedNetwork}
            onChange={onUnselect}
        />
    ) : (
        <EntityAdd project={project} />
    );

    return (
        <Box display="inline-block" width="30%" position="relative">
            {(selectedEntity != null || selectedNetwork != null) && <Fab
                color="primary"
                size="medium"
                onClick={onUnselect}
                sx={{position: "absolute", top: "-16px", right: "-16px"}}
            >
                <ContentClear />
            </Fab>}
            {card}
        </Box>
    );
};


interface Props {
    project: string;
    entities: IEntity[];
    selectedEntity?: IEntity;
    selectedNetwork?: INetwork;
    onUnselect: () => void;
}


export default EntityManager;
