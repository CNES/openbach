import React from 'react';

import Button from '@mui/material/Button';

import DownloadIcon from './DownloadIcon';

import {downloadURL} from '../../api/base';
import type {Theme} from '@mui/material/styles';
import type {SxProps} from '@mui/system';


const DownloadButton: React.FC<Props> = (props) => {
    const {route, filename, label, disabled, sx} = props;

    const handleClick = React.useCallback(() => {
        downloadURL(route, filename);
    }, [route, filename])

    return (
        <Button
            variant="contained"
            color="secondary"
            disabled={disabled}
            onClick={handleClick}
            startIcon={<DownloadIcon />}
            sx={sx}
        >
            Download {label}
        </Button>
    );
};


interface Props {
    route: string;
    filename: string;
    label?: string;
    disabled?: boolean;
    sx?: SxProps<Theme>;
}


export default DownloadButton;
