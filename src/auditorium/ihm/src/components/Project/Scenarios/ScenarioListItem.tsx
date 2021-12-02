import * as React from "react";

import IconButton from "material-ui/IconButton";
import {ListItem} from "material-ui/List";

import {IScenario} from "../../../interfaces/project.interface";
import {getGenericDeleteIcon, getLaunchScenarioIcon} from "../../../utils/theme";

import ScenarioDeleteDialog from "./ScenarioDeleteDialog";
import ScenarioLaunchDialog from "./ScenarioLaunchDialog";


export default class ScenarioListItem extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = { launchOpen: false, deleteOpen: false };
        this.goToUrl = this.goToUrl.bind(this);
        this.handleOpenLaunchDialog = this.handleOpenLaunchDialog.bind(this);
        this.handleCloseLaunchDialog = this.handleCloseLaunchDialog.bind(this);
        this.handleOpenDeleteDialog = this.handleOpenDeleteDialog.bind(this);
        this.handleCloseDeleteDialog = this.handleCloseDeleteDialog.bind(this);
    }

    public render() {
        const {scenario} = this.props;
        const scenarioArguments = [];
        for (const arg in scenario.arguments) {
            if (scenario.arguments.hasOwnProperty(arg)) {
                scenarioArguments.push({ name: arg, description: scenario.arguments[arg] });
            }
        }

        /* We need to define the button here so that
        material-ui doesn't apply weird styles
        (namely position absolute and display block)
        to the wrapper. */
        const launchButton = (
            <IconButton
                touch={true}
                tooltip="Launch Scenario"
                tooltipPosition="top-right"
                style={{padding: "0px"}}
                onTouchTap={this.handleOpenLaunchDialog}
            >
                {getLaunchScenarioIcon()}
                <ScenarioLaunchDialog
                    open={this.state.launchOpen}
                    onRequestClose={this.handleCloseLaunchDialog}
                    scenario={scenario.name}
                    scenarioArguments={scenarioArguments}
                />
            </IconButton>
        );

        /* We need to define the button here so that
        material-ui doesn't apply weird styles
        (namely position absolute and display block)
        to the wrapper. */
        const deleteButton = (
            <IconButton
                touch={true}
                tooltip="Delete Scenario"
                tooltipPosition="top-left"
                onTouchTap={this.handleOpenDeleteDialog}
            >
                {getGenericDeleteIcon()}
                <ScenarioDeleteDialog
                    open={this.state.deleteOpen}
                    onRequestClose={this.handleCloseDeleteDialog}
                    scenario={scenario.name}
                />
            </IconButton>
        );

        return (
            <ListItem
                primaryText={scenario.name}
                secondaryText={this.pluralize(scenario.openbach_functions.length, "openbach function")}
                leftIcon={launchButton}
                rightIconButton={deleteButton}
                onTouchTap={this.goToUrl}
            />
        );
    }

    private pluralize(count: number, text: string) {
        const ending = count > 1 ? "s" : "";
        return count + " " + text + ending;
    }

    private goToUrl() {
        this.props.onScenarioClick(this.props.scenario.name);
    }

    private handleOpenLaunchDialog(event) {
        event.stopPropagation();
        this.setState({
            deleteOpen: false,
            launchOpen: true,
        });
    }

    private handleCloseLaunchDialog() {
        this.setState({
            deleteOpen: false,
            launchOpen: false,
        });
    }

    private handleOpenDeleteDialog() {
        this.setState({
            deleteOpen: true,
            launchOpen: false,
        });
    }

    private handleCloseDeleteDialog() {
        this.setState({
            deleteOpen: false,
            launchOpen: false,
        });
    }
};


interface IProps {
    scenario: IScenario;
    onScenarioClick: (scenarioName: string) => void;
};


interface IState {
    deleteOpen: boolean;
    launchOpen: boolean;
};
