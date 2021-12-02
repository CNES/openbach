import * as React from "react";

import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from "material-ui/Table";

import {IFilesCount} from "../../../interfaces/scenarioInstance.interface";

import ActionDialog from "../../common/ActionDialog";


export default class ScenarioFilesDialog extends React.Component<IProps, IState> {
    private static buildRowsFromFiles(files: IFilesCount) {
        const rows = [];
        if (files) {
            for (const jobName in files) {
                if (files.hasOwnProperty(jobName)) {
                    const counts = files[jobName];
                    if (counts) {
                        for (const statName in counts) {
                            if (counts.hasOwnProperty(statName)) {
                                const count = counts[statName];
                                rows.push([false, jobName, statName, count]);
                            }
                        }
                    }
                }
            }
        }
        return rows;
    }

    constructor(props) {
        super(props);
        this.state = { rows: ScenarioFilesDialog.buildRowsFromFiles(props.files) };
        this.doDownload = this.doDownload.bind(this);
        this.onSelectRow = this.onSelectRow.bind(this);
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.files !== this.props.files) {
            this.setState({ rows: ScenarioFilesDialog.buildRowsFromFiles(nextProps.files) });
        }
    }

    public render() {
        let allSelected = true;
        const tableRows = this.state.rows.map((row: any[], index: number) => {
            const selected = row[0];
            const jobName = row[1];
            const statName = row[2];
            const count = row[3];

            allSelected = allSelected && selected;
            return (
                <TableRow key={index} selected={selected}>
                    <TableRowColumn>{jobName}</TableRowColumn>
                    <TableRowColumn>{statName}</TableRowColumn>
                    <TableRowColumn>{count}</TableRowColumn>
                </TableRow>
            );
        });

        return (
            <ActionDialog
                title="Select files to download"
                modal={false}
                open={Boolean(this.props.files)}
                auto={true}
                cancel={{label: "Cancel", action: this.props.handleCloseDialog}}
                actions={[{label: "Download Archive", action: this.doDownload}]}
            >
                <p>The following files are associated to this scenario, select
                those you want to download in an archive alongside the CSV data.</p>
                <Table selectable={true} multiSelectable={true} onRowSelection={this.onSelectRow}>
                    <TableHeader enableSelectAll={true}>
                        <TableRow>
                            <TableHeaderColumn>Job Name</TableHeaderColumn>
                            <TableHeaderColumn>File</TableHeaderColumn>
                            <TableHeaderColumn>Amount</TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody deselectOnClickaway={false}>
                        {tableRows}
                    </TableBody>
                </Table>
            </ActionDialog>
        );
    }

    private doDownload() {
        const selectedFiles = [];
        this.state.rows.forEach((row: any[]) => {
            const selected = row[0];
            const jobName = row[1];
            const statName = row[2];
            if (selected) {
                selectedFiles.push(encodeURIComponent(jobName) + "=" + encodeURIComponent(statName));
            }
        });
        this.props.handleDownloadArchive(selectedFiles.join("&"));
    }

    private onSelectRow(selectedRows) {
        if (selectedRows === "all") {
            const rows = this.state.rows.map((row: any[]) => [true, row[1], row[2], row[3]]);
            this.setState({ rows });
        } else if (selectedRows === "none") {
            const rows = this.state.rows.map((row: any[]) => [false, row[1], row[2], row[3]]);
            this.setState({ rows });
        } else {
            const bag = {};
            selectedRows.forEach((index: number) => { bag[index] = true; });
            const rows = this.state.rows.map((row: any[], index: number) => [bag.hasOwnProperty(index), row[1], row[2], row[3]]);
            this.setState({ rows });
        }
    }
};


interface IState {
    rows: any[][];
};


interface IProps {
    files: IFilesCount;
    handleCloseDialog: () => void;
    handleDownloadArchive: (files: string) => void;
};
