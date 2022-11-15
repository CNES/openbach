import * as React from "react";
import {connect} from "react-redux";

import {Table, TableBody, TableHeaderColumn, TableRow, TableRowColumn} from "material-ui/Table";

import {setTitle} from "../../actions/global";
import {TJobInstanceStatus, TOpenbachFunctionInstanceStatus, TScenarioInstanceStatus} from "../../interfaces/scenarioInstance.interface";
import {
    getIconForFunctionStatus,
    getIconForJobStatus,
    getIconForScenarioStatus,
    OpenbachFunctionIcon,
    ScenarioArgumentIcon,
    StartJobInstanceIcon,
    StartScenarioInstanceIcon,
} from "../../utils/theme";
import PaddedContainer from "../common/PaddedContainer";
import TitledPaper from "../common/TitledPaper";


const openbachFunctionIcons = [{
    description: "Job Instance Icon",
    icon: <StartJobInstanceIcon />,
}, {
    description: "Scenario Instance Icon",
    icon: <StartScenarioInstanceIcon />,
}, {
    description: "Openbach Function Icon",
    icon: <OpenbachFunctionIcon />,
}, {
    description: "Scenario Argument Icon",
    icon: <ScenarioArgumentIcon />,
}];


interface IOpenbachFunctionHelp {
    description: string;
    name: TOpenbachFunctionInstanceStatus | "Unknown";
}
const openbachFunctionStatus: IOpenbachFunctionHelp[] = [{
    description: "Scheduled",
    name: "Scheduled",
}, {
    description: "Running",
    name: "Running",
}, {
    description: "Finished",
    name: "Finished",
}, {
    description: "Stopped",
    name: "Stopped",
}, {
    description: "Error",
    name: "Error",
}, {
    description: "Function experienced error but has been retried",
    name: "Retried",
}, {
    description: "Unknown",
    name: "Unknown",
}];


interface IJobInstanceHelp {
    description: string;
    name: TJobInstanceStatus | "Unknown";
}
const jobInstanceStatus: IJobInstanceHelp[] = [{
    description: "Not Scheduled",
    name: "Not Scheduled",
}, {
    description: "Scheduled",
    name: "Scheduled",
}, {
    description: "Running",
    name: "Running",
}, {
    description: "Not Running",
    name: "Not Running",
}, {
    description: "Error",
    name: "Error",
}, {
    description: "Stopped",
    name: "Stopped",
}, {
    description: "Agent Unreachable",
    name: "Agent Unreachable",
}, {
    description: "Unknown",
    name: "Unknown",
}];


interface IScenarioInstanceHelp {
    description: string;
    name: TScenarioInstanceStatus | "Unknown";
}
const scenarioInstanceStatus = [{
    description: "Running",
    name: "Running",
}, {
    description: "Scheduling",
    name: "Scheduling",
}, {
    description: "Finished OK",
    name: "Finished Ok",
}, {
    description: "Finished KO",
    name: "Finished Ko",
}, {
    description: "Stopped",
    name: "Stopped",
}, {
    description: "An Agent became Unreachable",
    name: "Agents Unreachable",
}, {
    description: "Unknown",
    name: "Unknown",
}];


class ScenarioIcons extends React.Component<IDispatchProps, {}> {
    public componentDidMount() {
        this.props.setTitle("List of Scenario Icons");
    }

    public render() {
        const openbachFunctionIconsRows = openbachFunctionIcons.map((entry, index) => {
            return (
                <TableRow key={index}>
                    <TableRowColumn>{entry.icon}</TableRowColumn>
                    <TableRowColumn style={{whiteSpace: "pre"}}>{entry.description}</TableRowColumn>
                </TableRow>
            );
        });

        const openbachFunctionStatusRows = openbachFunctionStatus.map((entry: IOpenbachFunctionHelp, index) => {
            return (
                <TableRow key={index}>
                    <TableRowColumn>{getIconForFunctionStatus(entry.name)}</TableRowColumn>
                    <TableRowColumn style={{whiteSpace: "pre"}}>{entry.description}</TableRowColumn>
                </TableRow>
            );
        });

        const jobInstanceStatusRows = jobInstanceStatus.map((entry: IJobInstanceHelp, index) => {
            return (
                <TableRow key={index}>
                    <TableRowColumn>{getIconForJobStatus(entry.name)}</TableRowColumn>
                    <TableRowColumn style={{whiteSpace: "pre"}}>{entry.description}</TableRowColumn>
                </TableRow>
            );
        });

        const scenarioInstanceStatusRows = scenarioInstanceStatus.map((entry: IScenarioInstanceHelp, index) => {
            return (
                <TableRow key={index}>
                    <TableRowColumn>{getIconForScenarioStatus(entry.name)}</TableRowColumn>
                    <TableRowColumn style={{whiteSpace: "pre"}}>{entry.description}</TableRowColumn>
                </TableRow>
            );
        });

        return (
            <PaddedContainer>
                <TitledPaper title="Icons for Openbach Functions">
                    <Table
                        style={{margin: "auto", tableLayout: "auto"}}
                        selectable={false}
                    >
                        <TableBody displayRowCheckbox={false}>
                            <TableRow>
                                <TableHeaderColumn tooltip="The icon">Icon</TableHeaderColumn>
                                <TableHeaderColumn tooltip="The description">Description</TableHeaderColumn>
                            </TableRow>
                            {openbachFunctionIconsRows}
                        </TableBody>
                    </Table>
                </TitledPaper>
                <TitledPaper title="Icons for Openbach Functions Statuses">
                    <Table
                        style={{margin: "auto", tableLayout: "auto"}}
                        selectable={false}
                    >
                        <TableBody displayRowCheckbox={false}>
                            <TableRow>
                                <TableHeaderColumn tooltip="The icon">Icon</TableHeaderColumn>
                                <TableHeaderColumn tooltip="The description">Description</TableHeaderColumn>
                            </TableRow>
                            {openbachFunctionStatusRows}
                        </TableBody>
                    </Table>
                </TitledPaper>
                <TitledPaper title="Icons for Job Instances Statuses">
                    <Table
                        style={{margin: "auto", tableLayout: "auto"}}
                        selectable={false}
                    >
                        <TableBody displayRowCheckbox={false}>
                            <TableRow>
                                <TableHeaderColumn tooltip="The icon">Icon</TableHeaderColumn>
                                <TableHeaderColumn tooltip="The description">Description</TableHeaderColumn>
                            </TableRow>
                            {jobInstanceStatusRows}
                        </TableBody>
                    </Table>
                </TitledPaper>
                <TitledPaper title="Icons for Scenario Instances Statuses">
                    <Table
                        style={{margin: "auto", tableLayout: "auto"}}
                        selectable={false}
                    >
                        <TableBody displayRowCheckbox={false}>
                            <TableRow>
                                <TableHeaderColumn tooltip="The icon">Icon</TableHeaderColumn>
                                <TableHeaderColumn tooltip="The description">Description</TableHeaderColumn>
                            </TableRow>
                            {scenarioInstanceStatusRows}
                        </TableBody>
                    </Table>
                </TitledPaper>
            </PaddedContainer>
        );
    }
};


interface IDispatchProps {
    setTitle: (title: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    setTitle: (title: string): void => dispatch(setTitle(title)),
});


export default connect<{}, IDispatchProps, {}>(null, mapDispatchToProps)(ScenarioIcons);
