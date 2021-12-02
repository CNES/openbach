import * as moment from "moment";
import "whatwg-fetch";

import {
    IGrafanaDashboardResult,
    IGrafanaStatistic,
    IInfluxComparative,
    IInfluxHistogram,
    IInfluxNames,
    IInfluxNamesAndSuffixes,
    IInfluxStatistics,
} from "../interfaces/influx.interface";
import {IScenarioInstance} from "../interfaces/scenarioInstance.interface";
import {checkStatus, doApiCall} from "./common";


export function getStatisticsNames(projectName: string): Promise<IInfluxNames> {
    return doApiCall("/statistic/" + projectName)
        .then((response: Response) => response.json<IInfluxNames>());
};


export function getStatisticsNamesAndSuffixes(jobID: number): Promise<IInfluxNamesAndSuffixes> {
    return doApiCall("/statistic/" + jobID)
        .then((response: Response) => response.json<IInfluxNamesAndSuffixes>());
};


export function getStatisticsOrigin(jobID: number): Promise<Date> {
    return doApiCall("/statistic/" + jobID + "/?origin")
        .then((response: Response) => response.json<number>())
        .then((response: number) => new Date(response))
        .catch(() => new Date());
};


const buildStatisticsRoute = (jobID: number, statName: string, suffix: string): string => {
    const route = `/statistic/${jobID}?name=${statName}`;
    if (!suffix) {
        return route;
    }
    return `${route}&suffix=${suffix}`;
};


export function getStatistics(jobID: number, statName: string, suffix: string, origin?: number): Promise<IInfluxStatistics> {
    let route = buildStatisticsRoute(jobID, statName, suffix);
    if (origin || origin === 0) {
        route += "&origin=" + origin;
    }
    return doApiCall(route).then((response: Response) => response.json<IInfluxStatistics>());
};


export function getStatisticsHistogram(jobID: number, statName: string, suffix: string, buckets: number): Promise<IInfluxHistogram> {
    const route = buildStatisticsRoute(jobID, statName, suffix) + "&histogram=" + buckets;
    return doApiCall(route).then((response: Response) => response.json<IInfluxHistogram>());
};


export function getStatisticsComparative(jobID: number, statName: string, suffix: string): Promise<IInfluxComparative> {
    const route = buildStatisticsRoute(jobID, statName, suffix) + "&comparative";
    return doApiCall(route).then((response: Response) => response.json<IInfluxComparative>());
};


interface IGraphIntermediate {
    agent: string;
    name: string;
    jobId: number;
    unit: string;
    targets: string[];
};


export function postGrafanaDashboard(instance: IScenarioInstance, statistics: IGrafanaStatistic[], grouped: boolean): Promise<IGrafanaDashboardResult> {
    const graphs: IGraphIntermediate[] = [];
    let targets = null;
    statistics.sort((a: IGrafanaStatistic, b: IGrafanaStatistic): number => {
        if (a.jobId === b.jobId) {
            if (a.unit === b.unit) {
                return 0;
            }
            return a.unit < b.unit ? -1 : 1;
        }
        return a.jobId - b.jobId;
    }).forEach((statistic: IGrafanaStatistic, index: number, array: IGrafanaStatistic[]) => {
        const {jobAgent, jobName, jobId, statName, unit} = statistic;
        if (!grouped || index === 0 || array[index - 1].jobId !== jobId || array[index - 1].unit !== unit) {
            targets = [];
            graphs.push({
                agent: jobAgent,
                name: jobName,
                jobId,
                targets,
                unit,
            });
        }
        targets.push(statName);
    });

    const dashboard = {
        annotations: {
          list: [],
        },
        editable: true,
        hideControls: false,
        id: null,
        links: [],
        panels: graphs.map((graph: IGraphIntermediate, index: number) => ({
            aliasColors: {},
            bars: false,
            datasource: "openbach",
            editable: true,
            error: false,
            fill: 1,
            gridPos: {
                h: 9,
                w: 24,
                x: 0,
                y: 9 * index,
            },
            id: index,
            legend: {
                alignAsTable: true,
                avg: true,
                current: false,
                hideEmpty: false,
                hideZero: false,
                max: true,
                min: true,
                rightSide: false,
                show: true,
                total: true,
                values: true,
            },
            lines: true,
            linewidth: 2,
            links: [],
            nullPointMode: "connected",
            percentage: false,
            pointradius: 5,
            points: false,
            renderer: "flot",
            seriesOverrides: [],
            span: 12,
            stack: false,
            steppedLine: false,
            targets: [{
                alias: "$col",
                dsType: "influxdb",
                groupBy: [],
                hide: false,
                measurement: graph.name,
                policy: "default",
                refId: "A",
                resultFormat: "time_series",
                select: graph.targets.map((fieldName: string) => ([{
                    params: [fieldName],
                    type: "field",
                }])),
                tags: [{
                    key: "@owner_scenario_instance_id",
                    operator: "=",
                    value: instance.owner_scenario_instance_id.toString(),
                }, {
                    key: "@job_instance_id",
                    operator: "=",
                    value: graph.jobId.toString(),
                }],
            }],
            timeFrom: null,
            timeShift: null,
            title: `${graph.name} (id ${graph.jobId} on ${graph.agent})`,
            tooltip: {
                msResolution: true,
                shared: true,
                value_type: "cumulative",
            },
            transparent: true,
            type: "graph",
            xaxis: { show: true },
            yaxes: [{
                format: "short",
                label: graph.unit,
                logBase: 1,
                max: null,
                min: null,
                show: true,
            }, {
                format: "short",
                label: null,
                logBase: 1,
                max: null,
                min: null,
                show: true,
            }],
        })),
        refresh: false,
        schemaVersion: 12,
        sharedCrosshair: false,
        style: "dark",
        tags: [],
        templating: {
            list: [],
        },
        time: {
            from: moment(instance.start_date).format("YYYY-MM-DD HH:mm:ss"),
            to: instance.stop_date ? moment(instance.stop_date).add(1, "s").format("YYYY-MM-DD HH:mm:ss") : "now",
        },
        timepicker: {
            refresh_intervals: ["5s", "15s", "30s", "1m", "5m", "15m", "30m", "1h", "6h", "12h", "1d"],
            time_options: [],
        },
        timezone: "browser",
        title: `Scenario ${instance.scenario_name} (instance #${instance.scenario_instance_id})`,
        version: 0,
    };

    const params: RequestInit = {
        body: JSON.stringify({dashboard, overwrite: true}),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method: "POST",
    };
    return fetch("/grafana/api/dashboards/db", params)
        .then(checkStatus)
        .then((response: Response) => new Promise<IGrafanaDashboardResult>((resolve) => resolve(response.json<IGrafanaDashboardResult>())));
};
