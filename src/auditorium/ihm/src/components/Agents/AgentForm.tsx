import * as React from "react";
import {FormProps, reduxForm} from "redux-form";

import MenuItem from "material-ui/MenuItem";
import RaisedButton from "material-ui/RaisedButton";

import {getCollectors} from "../../api/agent";
import {ICollector} from "../../interfaces/agent.interface";

import {FormField, SelectFormField, TextFormField} from "../common/Form";


class AgentForm extends React.Component<IProps & FormProps<IFields, {}, {}>, IState> {
    constructor(props) {
        super(props);
        this.state = { collectors: [] };
        this.doAttach = this.doAttach.bind(this);
        this.doCreate = this.doCreate.bind(this);
    }

    public render() {
        const {collectors} = this.state;
        if (!collectors || collectors.length === 0) {
            return (
                <div>
                    <p>
                        No collector found, cannot add an agent
                        without a collector, contact your administrator
                    </p>
                </div>
            );
        }

        const collectorsOption = collectors.map((collector: ICollector) => (
            <MenuItem key={collector.address} value={collector.address} primaryText={collector.address}/>
        ));

        const {handleSubmit} = this.props;
        return (
            <form onSubmit={handleSubmit(this.doCreate)}>
                <fieldset>
                    <legend>Connect with</legend>
                    <div><FormField name="username" component={TextFormField} fullWidth={true} text="Username"/></div>
                    <div><FormField name="password" component={TextFormField} fullWidth={true} text="Password" type="password"/></div>
                </fieldset>
                <fieldset>
                    <legend>Create Agent</legend>
                    <div><FormField name="name" component={TextFormField} fullWidth={true} text="Name"/></div>
                    <div><FormField name="ipAddress" component={TextFormField} fullWidth={true} text="IP Address"/></div>
                    <div><FormField name="collector" component={SelectFormField} fullWidth={true} text="Collector">
                        {collectorsOption}
                    </FormField></div>
                </fieldset>
                <div>
                    <RaisedButton
                        disabled={this.props.invalid}
                        label="Add New Agent"
                        secondary={true}
                        onClick={handleSubmit(this.doCreate)}
                        style={{margin: "5px"}}
                    />
                    <RaisedButton
                        disabled={this.props.invalid}
                        label="Attach Existing Agent"
                        secondary={true}
                        onClick={handleSubmit(this.doAttach)}
                        style={{margin: "5px"}}
                    />
                </div>
            </form>
        );
    }

    public componentDidMount() {
        getCollectors().then((collectors: ICollector[]) => {
            this.setState({ collectors });
        });
    }

    private doAttach() {
        this.props.onAttach();
        this.props.reset();
    }

    private doCreate() {
        this.props.onCreate();
        this.props.reset();
    }
};


interface IProps {
    onAttach: () => void;
    onCreate: () => void;
};


interface IState {
    collectors: ICollector[];
};


interface IFields {
    name?: string;
    ipAddress?: string;
    username?: string;
    password?: string;
    collector?: string;
};


function validate(values): IFields {
    const errors: IFields = {};
    [
        "name", "ipAddress",
        "username", "password",
        "collector",
    ].forEach((key: string) => {
        if (!values[key]) {
            errors[key] = "Required";
        }
    });

    return errors;
};


export default reduxForm({ form: "agent", validate })(AgentForm);
