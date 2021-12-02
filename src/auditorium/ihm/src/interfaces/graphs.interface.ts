export type TGraphType = "Time Series" | "Histogram" | "Cumulative Histogram" | "Comparative Graph";
export type TPlotDialogType = "time_origin" | "histogram";
export const graphTypes: TGraphType[] = [
    "Time Series",
    "Histogram",
    "Cumulative Histogram",
    "Comparative Graph",
];


export interface IGraph {
    type: TGraphType;
    name: string;
    settings: IGraphSettings;
    plots: Map<string, IPlot>;
    xUnits: string;
    yUnits: string;
};


export interface IGraphSettings {
    height: number;
    width?: number;
    legendX: number;
    legendY: number;
    low?: number;
    high?: number;
    graphType: string;
    scale: string;
    exp: boolean;
};


export interface IPlot {
    jobInstanceID: number;
    statistic: string;
    suffix: string;
    timeOrigin?: number;
    bucketsCount?: number;
};
