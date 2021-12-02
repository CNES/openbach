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


const openbachFunctionStatus = [{
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
    description: "Unknown",
    name: "Unknown",
}];

const jobInstanceStatus = [{
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
    name: "Agents Unreachable",
}, {
    description: "Unknown",
    name: "Unknown",
}];


const scenarioInstanceStatus = [{
    description: "Running",
    name: "Running",
}, {
    description: "Scheduling",
    name: "Scheduling",
}, {
    description: "Finished OK",
    name: "Finished OK",
}, {
    description: "Finished KO",
    name: "Finished KO",
}, {
    description: "Stopped",
    name: "Stopped",
}, {
    description: "Stopped, out of controll",
    name: "Stopped, out of controll",
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

        const openbachFunctionStatusRows = openbachFunctionStatus.map((entry, index) => {
            return (
                <TableRow key={index}>
                    <TableRowColumn>{getIconForFunctionStatus(entry.name as TOpenbachFunctionInstanceStatus)}</TableRowColumn>
                    <TableRowColumn style={{whiteSpace: "pre"}}>{entry.description}</TableRowColumn>
                </TableRow>
            );
        });

        const jobInstanceStatusRows = jobInstanceStatus.map((entry, index) => {
            return (
                <TableRow key={index}>
                    <TableRowColumn>{getIconForJobStatus(entry.name as TJobInstanceStatus)}</TableRowColumn>
                    <TableRowColumn style={{whiteSpace: "pre"}}>{entry.description}</TableRowColumn>
                </TableRow>
            );
        });

        const scenarioInstanceStatusRows = scenarioInstanceStatus.map((entry, index) => {
            return (
                <TableRow key={index}>
                    <TableRowColumn>{getIconForScenarioStatus(entry.name as TScenarioInstanceStatus)}</TableRowColumn>
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
