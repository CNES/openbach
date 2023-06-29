import {doFetch, asyncThunk} from './base';

import {setVersion} from '../redux/message';


declare type RawLog = [string, number, string, string, string];


interface OpenbachVersion {
    openbach_version: string;
}


export const getLogs = asyncThunk<RawLog[], {delay: number}>(
    'global/getLogs',
    async ({delay}, {dispatch}) => {
        return await doFetch<RawLog[]>(
            `/logs/?level=4&delay=${delay}`,
            dispatch,
        );
    },
);


export const getVersion = asyncThunk<void>(
    'global/getVersion',
    async (_, {dispatch}) => {
        const {openbach_version} = await doFetch<OpenbachVersion>(
            '/version',
            dispatch,
        );
        dispatch(setVersion("OpenBach Version: " + openbach_version));
    },
);
