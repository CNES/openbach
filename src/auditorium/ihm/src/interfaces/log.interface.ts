export interface ILog {
    id: string;
    timestamp: number;
    severity: string;
    source: string;
    message: string;
    checked: boolean;
}
