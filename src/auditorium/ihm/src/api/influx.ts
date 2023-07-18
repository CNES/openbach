import moment from 'moment';
import {doFetch, asyncThunk} from './base';

import type {IScenarioInstance, IChronografStatistic} from '../utils/interfaces';


interface InfluxNames {
    [jobName: string]: string[];
}


interface InfluxNamesAndSuffixes {
    statistics: string[];
    suffixes: string[];
}


interface ChronografQuery {
    instance: IScenarioInstance;
    statistics: IChronografStatistic[];
    grouped: boolean;
}


interface ChronografQueryResult {
    type: string;
    source: string;
    query: string;
    text: string;
}


interface ChronografCellResult {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    queries: ChronografQueryResult[];
}


interface ChronografDashboardResult {
    id: number;
    name: string;
    cells: ChronografCellResult[];
}


export const getStatisticsNames = asyncThunk<InfluxNames, {project: string;}>(
    'influx/getStatisticsNames',
    async ({project}, {dispatch}) => {
        return await doFetch<InfluxNames> (
            "/openbach/statistic/" + project,
            dispatch,
        );
    },
);


export const getStatisticsNamesAndSuffixes = asyncThunk<InfluxNamesAndSuffixes, {jobId: number;}>(
    'influx/getStatisticsNamesAndSuffixes',
    async ({jobId}, {dispatch}) => {
        return await doFetch<InfluxNamesAndSuffixes> (
            "/openbach/statistic/" + jobId,
            dispatch,
        );
    },
);


interface ChronografIntermediate extends Omit<IChronografStatistic, "statName"> {
    targets: string[];
}


export const createChronografDashboard = asyncThunk<ChronografDashboardResult, ChronografQuery>(
    'influx/createChronografDashboard',
    async ({instance, statistics, grouped}, {dispatch}) => {
        let targets: string[] = [];
        const graphs: ChronografIntermediate[] = [];
        statistics.slice().sort((a: IChronografStatistic, b: IChronografStatistic) => {
            if (a.jobId === b.jobId) {
                if (a.unit === b.unit) {
                    return 0;
                }
                return a.unit < b.unit ? -1 : 1;
            }
            return a.jobId - b.jobId;
        }).forEach((s: IChronografStatistic, index: number, array: IChronografStatistic[]) => {
            const {jobAgent, jobName, jobId, statName, unit} = s;
            if (!grouped || index === 0 || array[index - 1].jobId !== jobId || array[index - 1].unit !== unit) {
                targets = [];
                graphs.push({jobName, jobAgent, jobId, targets, unit});
            }
            targets.push(statName);
        });

        const dashboard = {
            cells: graphs.map((graph: ChronografIntermediate, index: number) => ({
                h: 4,
                name: `${graph.jobName} (#${graph.jobId})`,
                queries: graph.targets.map((statName: string) => ({
                    query: [
                        `SELECT "${statName}" FROM "openbach"."openbach"."${graph.jobName}"`,
                        `WHERE time > ${moment(instance.start_date).valueOf()}ms`,
                        `AND time < ${instance.stop_date ? moment(instance.stop_date).add(1, "s").valueOf() + "ms" : "now"}`,
                        `AND "@job_instance_id"='${graph.jobId}' GROUP BY "@suffix" FILL(null)`,
                    ].join(" "),
                    source: "",
                    text: `${statName} (${graph.unit})`,
                    type: "influxql",
                })),
                w: 12,
                x: 0,
                y: 4 * index,
            })),
            name: `Scenario instance #${instance.owner_scenario_instance_id}`,
        };
        
        return await doFetch<ChronografDashboardResult> (
            "/chronograf/api/dashboards",
            dispatch,
            "POST",
            dashboard,
        );
    },
);
