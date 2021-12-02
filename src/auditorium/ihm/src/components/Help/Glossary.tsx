import * as React from "react";
import {connect} from "react-redux";

import {Table, TableBody, TableHeaderColumn, TableRow, TableRowColumn} from "material-ui/Table";

import {setTitle} from "../../actions/global";

import PaddedContainer from "../common/PaddedContainer";
import TitledPaper from "../common/TitledPaper";


const glossary = [{
    description: "A recipient which collects the data sent by an agent",
    name: "collector",
}, {
    description: "An agent installed on a physical entity",
    name: "agent",
}, {
    description: "An entity, linked or not to an agent",
    name: "entity",
}, {
    description: "A project, where entities are linked to agent in order to create/use scenarios",
    name: "project",
}, {
    description: "An action in a scenario, ie: the job implementation",
    name: "scenarioAction",
}, {
    description: "A number of individual tasks (one or more) with a common purpose and to be executed in a sole Agent. \n" +
    "A job might be able to launch/configure other software tools (e.g. ping/iperf) and OS tools (e.g. iptables), configure OS parameters, " +
    "collect information/stats from tools/OS, etc.\n\n(TERM_01)\n\n" +
    "A classification of ScenarioAction types depending on their purpose is defined in this document.",
    name: "job",
}, {
    description: "An execution of a job configured with a set of parameters",
    name: "job instance",
}, {
    description: "Function defined and executed by the Controller for performing tasks related to: \n" +
    "install agents/Jobs, configure and schedule ScenarioAction/scenario instances, " +
    "perform information/status requests regarding Agents/Jobs/Scenarios and their instances, etc.",
    name: "openbach-function",
}, {
    description: "Set of openbach-functions that allow to perform different tasks might be executed in different Agents to accomplish an action",
    name: "scenario",
}, {
    description: "An execution of a scenario with a set of parameters.\n" +
    "A scenario must include a “reference starting time”. " +
    "The scheduling times of each of the functions to be executed with in it shall be defined as an increment (∆) " +
    "of the “reference starting time” of the scenario.",
    name: "scenario instance",
}].sort((element1, element2) => element1.name.localeCompare(element2.name));


class Glossary extends React.Component<IDispatchProps, {}> {
    public componentDidMount() {
        this.props.setTitle("OpenBach Glossary");
    }

    public render() {
        const tableRows = glossary.map((entry, index) => {
            return (
                <TableRow key={index}>
                    <TableRowColumn>{entry.name}</TableRowColumn>
                    <TableRowColumn style={{whiteSpace: "pre"}}>{entry.description}</TableRowColumn>
                </TableRow>
            );
        });

        return (
            <PaddedContainer>
                <TitledPaper title="Glossary">
                    <Table
                        style={{margin: "auto", tableLayout: "auto"}}
                        selectable={false}
                    >
                        <TableBody displayRowCheckbox={false}>
                            <TableRow>
                                <TableHeaderColumn tooltip="The name">Term</TableHeaderColumn>
                                <TableHeaderColumn tooltip="The description">Definition</TableHeaderColumn>
                            </TableRow>
                            {tableRows}
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


export default connect<{}, IDispatchProps, {}>(null, mapDispatchToProps)(Glossary);
