import React from 'react';

import List from '@mui/material/List';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import JobsStatusesQuery from './JobsStatusesQuery';
import Dialog from '../common/ActionDialog';

import {useSelector} from '../../redux';


const JobsStatusesInfos: React.FC<Props> = (props) => {
    const queries = useSelector((state) => state.project.jobActions);
    const [title, storeTitle] = React.useState<string>("");
    const [content, storeContent] = React.useState<string>("");

    const handleOpen = React.useCallback((title: string, content: string) => {
        storeTitle(title);
        storeContent(content);
    }, []);

    const handleClose = React.useCallback(() => {
        storeTitle("");
        storeContent("");
    }, []);

    return (
        <React.Fragment>
            <List>
                {queries.map((query) => (
                    <JobsStatusesQuery
                        key={`${query.job}-on-${query.agent}`}
                        job={query.job}
                        agent={query.agent}
                        action={query.action}
                        status={query.result && query.result[query.action]}
                        onClick={handleOpen}
                    />
                ))}
            </List>
            <Dialog
                title={title}
                open={!(!title && !content)}
                cancel={{label: "OK", action: handleClose}}
                actions={[]}
            >
                <DialogContent>
                    <DialogContentText>
                        {content}
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
};


interface Props {
}


export default JobsStatusesInfos;
