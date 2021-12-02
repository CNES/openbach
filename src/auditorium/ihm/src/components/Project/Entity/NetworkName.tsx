import * as React from "react";
import {connect} from "react-redux";

import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";

import {changeNetworkName} from "../../../actions/project";
import {ILoginCredentials} from "../../../interfaces/login.interface";
import {INetwork} from "../../../interfaces/project.interface";


class NetworkName extends React.Component<IProps & IStoreProps & IDispatchProps, IState> {
    constructor(props) {
        super(props);
        this.state = { name: props.network.name };
        this.doNameChange = this.doNameChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
    }

    public render() {
        const {name} = this.state;
        const {login, network} = this.props;

        return (
            <div>
                <TextField
                    floatingLabelText="Name"
                    hintText="The new name for this network"
                    value={name}
                    disabled={!login.is_user}
                    onChange={this.handleNameChange}
                    fullWidth={true}
                />
                <RaisedButton
                    label="Change Name"
                    onClick={this.doNameChange}
                    secondary={true}
                    disabled={!name || network.name === name}
                />
            </div>
        );
    }

    public componentWillReceiveProps(nextProps: IProps & IStoreProps & IDispatchProps) {
        const {name} = nextProps.network;
        if (this.props.network.name !== name) {
            this.setState({ name });
        }
    }

    private doNameChange() {
        this.props.changeName(this.props.network.address, this.state.name);
        this.props.onChange();
    }

    private handleNameChange(event, name: string) {
        this.setState({ name });
    }
};


interface IState {
    name: string;
};


interface IProps {
    network: INetwork;
    onChange: () => void;
};


interface IStoreProps {
    login: ILoginCredentials;
};


const mapStoreToProps = (store): IStoreProps => ({
    login: store.login,
});


interface IDispatchProps {
    changeName: (address: string, name: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    changeName: (address: string, name: string) => dispatch(changeNetworkName(address, name)),
});


export default connect<IStoreProps, IDispatchProps, IProps>(mapStoreToProps, mapDispatchToProps)(NetworkName);
