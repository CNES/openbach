import * as React from "react";
import {connect} from "react-redux";

import {startScenarioInstance} from "../../../actions/scenario";
import {IOpenbachArgumentForm, IOpenbachConstantForm} from "../../../interfaces/scenarioForm.interface";

import ActionDialog from "../../common/ActionDialog";
import ScenarioLaunchArgument from "./ScenarioLaunchArgument";


class ScenarioLaunchDialog extends React.Component<IProps & IDispatchProps, IState> {
    private static propsToState(props: IProps): IOpenbachConstantForm[] {
        return props.scenarioArguments.map((arg: IOpenbachArgumentForm) => ({
            name: arg.name,
            value: "",
        }));
    }

    constructor(props) {
        super(props);
        this.state = { arguments: ScenarioLaunchDialog.propsToState(props) };
        this.doLaunchScenario = this.doLaunchScenario.bind(this);
    }

    public render() {
        const {scenarioArguments} = this.props;
        const args = this.state.arguments.map((arg: IOpenbachConstantForm, idx: number) => (
            <ScenarioLaunchArgument
                key={arg.name}
                name={arg.name}
                value={arg.value}
                hint={scenarioArguments[idx].description}
                onChange={this.modifyArgument.bind(this, arg.name)}
            />
        ));

        return (
            <ActionDialog
                title={`Launch scenario ${this.props.scenario}?`}
                modal={false}
                auto={true}
                open={this.props.open}
                cancel={{label: "Cancel", action: this.props.onRequestClose}}
                actions={[{label: "Launch", action: this.doLaunchScenario}]}
            >
                {args && args.length ? <p>Please fill in required arguments</p> : <p>Launch it</p>}
                {args}
            </ActionDialog>
        );
    }

    public componentWillReceiveProps(nextProps: IProps & IDispatchProps) {
        if (nextProps.scenarioArguments !== this.props.scenarioArguments) {
            this.setState({ arguments: ScenarioLaunchDialog.propsToState(nextProps) });
        }
    }

    private doLaunchScenario() {
        const {launchScenario, onRequestClose, scenario} = this.props;
        const args = {};
        this.state.arguments.forEach((arg: IOpenbachConstantForm) => {
            if (arg.value) {
                args[arg.name] = arg.value;
            }
        });
        launchScenario(scenario, new Date(), args);
        onRequestClose();
    }

    private modifyArgument(name: string, value: string) {
        const args: IOpenbachConstantForm[] = this.state.arguments.map(
            (arg: IOpenbachConstantForm) => arg.name === name ? { name, value } : arg,
        );
        this.setState({ arguments: args });
    }
};


interface IState {
    arguments: IOpenbachConstantForm[];
};


interface IProps {
    open: boolean;
    onRequestClose: () => void;
    scenario: string;
    scenarioArguments: IOpenbachArgumentForm[];
};


interface IDispatchProps {
    launchScenario: (scenario: string, date: Date, args: any) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    launchScenario: (scenario: string, date: Date, args: any) => dispatch(startScenarioInstance(scenario, date, args)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(ScenarioLaunchDialog);
