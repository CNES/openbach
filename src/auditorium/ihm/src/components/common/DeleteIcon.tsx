import React from 'react';

import Tooltip from '@mui/material/Tooltip';

import {red} from '@mui/material/colors';
import Delete from '@mui/icons-material/Delete';


const DeleteIcon: React.FC<Props> = (props) => {
    const {title = "Delete"} = props;

    return (
        <Tooltip title={title} placement="top-start">
            <Delete sx={{color: red[500]}} />
        </Tooltip>
    );
};


interface Props {
    title?: string;
}


export default DeleteIcon;
