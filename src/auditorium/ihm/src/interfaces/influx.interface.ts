export interface IJobsDisplay {
    agent: string;
    id: number;
    name: string;
};


export interface IInfluxNames {
    [ jobName: string ]: string[];
};


export interface IInfluxNamesAndSuffixes {
    statistics: string[];
    suffixes: string[];
};


export interface IInfluxStatistics {
    time: number[];
    [ statisticName: string ]: number[];
};


export interface IInfluxHistogram {
    buckets: number[];
    counts: number[];
};


export interface IInfluxComparative {
    mean: number;
    variance: number;
};


export interface IGrafanaStatistic {
    jobAgent: string;
    jobName: string;
    jobId: number;
    statName: string;
    unit: string;
};


export interface IGrafanaDashboardResult {
    slug: string;
    status: string;
    version: number;
    message?: string;
};


export interface IChronografQueryResult {
    type: string;
    source: string;
    query: string;
    text: string;
};


export interface IChronografCellResult {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    queries: IChronografQueryResult[];
};


export interface IChronografDashboardResult {
    id: number;
    name: string;
    cells: IChronografCellResult[];
};
