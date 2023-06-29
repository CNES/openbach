import React from 'react';

import Tooltip from '@mui/material/Tooltip';

import FileDownload from '@mui/icons-material/FileDownload';


const DownloadIcon: React.FC<Props> = (props) => {
    const {title = "Download"} = props;

    return (
        <Tooltip title={title} placement="top-start">
            <FileDownload sx={{color: "#2A72A9"}} />
        </Tooltip>
    );
};


interface Props {
    title?: string;
}


export default DownloadIcon;
