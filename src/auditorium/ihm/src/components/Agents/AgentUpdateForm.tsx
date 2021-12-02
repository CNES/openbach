import * as React from "react";
import {FormProps, reduxForm} from "redux-form";

import MenuItem from "material-ui/MenuItem";

import {getCollectors} from "../../api/agent";
import {ICollector} from "../../interfaces/agent.interface";

import ActionDialog from "../common/ActionDialog";
import {FormField, SelectFormField, TextFormField} from "../common/Form";


class AgentUpdateForm extends React.Component<IProps & FormProps<IFields, {}, {}>, IState> {
    constructor(props) {
        super(props);
        this.state = { collectors: [] };
    }

    public render() {
        const {collector} = this.props.initialValues;
        const {collectors} = this.state;
        const addresses = (collectors || []).map((c: ICollector) => c.address);
        if (collector && !addresses.includes(collector)) {
            addresses.push(collector);
        }
        const collectorsOption = addresses.map((address: string) => (
            <MenuItem key={address} value={address} primaryText={address}/>
        ));

        const {handleSubmit, open, onClose, onSubmit} = this.props;
        return (
            <ActionDialog
                title="Update an Agent"
                modal={false}
                open={open}
                cancel={{label: "Cancel", action: onClose}}
                actions={[{label: "Update", action: handleSubmit(onSubmit) as (() => void)}]}
            >
                <form onSubmit={handleSubmit}>
                    <div><FormField name="name" component={TextFormField} fullWidth={true} text="Name"/></div>
                    <div><FormField name="address" component={TextFormField} fullWidth={true} text="IP Address"/></div>
                    <div><FormField name="collector" component={SelectFormField} fullWidth={true} text="Collector">
                        {collectorsOption}
                    </FormField></div>
                </form>
            </ActionDialog>
        );
    }

    public componentDidMount() {
        getCollectors().then((collectors: ICollector[]) => {
            this.setState({ collectors });
        });
    }
};


interface IProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
};


interface IState {
    collectors: ICollector[];
};


interface IFields {
    name?: string;
    address?: string;
    collector?: string;
};


function validate(values): IFields {
    const errors: IFields = {};
    ["name", "address", "collector"].forEach((key: string) => {
        if (!values[key]) {
            errors[key] = "Required";
        }
    });

    return errors;
};


export default reduxForm({ form: "agentUpdate", validate })(AgentUpdateForm);
