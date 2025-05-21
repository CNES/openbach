import React from 'react';

import Snackbar from '@mui/material/Snackbar';

import {useSelector, useDispatch} from '../../redux';
import {clearMessage} from '../../redux/message';


const StatusMessage: React.FC<Props> = (props) => {
    const message = useSelector((state) => state.global.message);
    const dispatch = useDispatch();

    const clearStatus = React.useCallback(() => dispatch(clearMessage()), [dispatch]);

    return (
        <Snackbar
            open={Boolean(message)}
            message={message}
            autoHideDuration={3000}
            onClose={clearStatus}
        />
    );
};


interface Props {
}


export default StatusMessage;
