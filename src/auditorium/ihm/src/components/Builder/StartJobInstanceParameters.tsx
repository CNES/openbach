import React from 'react';

import StartJobInstanceSubcommand from './StartJobInstanceSubcommand';

import type {IJob, FunctionForm} from '../../utils/interfaces';


const StartJobInstanceParameters: React.FC<Props> = (props) => {
    const {id, index, job, others} = props;

    if (!job) {
        return null;
    }

    if (typeof job === 'string') {
        return <h3>Selected Job {job} not found</h3>;
    }

    const {arguments: args, general: {name}} = job;
    if (!(args?.required?.length || args?.optional?.length || args?.subcommands?.length)) {
        return <h3>No arguments for Job {name}</h3>;
    }

    return (
        <StartJobInstanceSubcommand
            id={id}
            index={index}
            job={name}
            arguments={args}
            groups={[]}
            others={others}
        />
    );
};


interface Props {
    id: string;
    index: number;
    job?: string | IJob;
    others: FunctionForm[];
}


export default StartJobInstanceParameters;
