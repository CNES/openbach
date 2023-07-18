import React from 'react';

import Tooltip from '@mui/material/Tooltip';

import Edit from '@mui/icons-material/ModeEdit';


const EditIcon: React.FC<Props> = (props) => {
    const {title = "Edit"} = props;

    return (
        <Tooltip title={title} placement="top-start">
            <Edit sx={{color: "#2A72A9"}} />
        </Tooltip>
    );
};


interface Props {
    title?: string;
}


export default EditIcon;
