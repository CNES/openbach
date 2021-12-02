import * as React from "react";
import {connect} from "react-redux";

import {hideNetworkForProject} from "../../../actions/project";
import {INetwork} from "../../../interfaces/project.interface";

import EntityCardActionButton from "./EntityCardActionButton";
import EntityCardTemplate from "./EntityCardTemplate";
import NetworkName from "./NetworkName";


const image = require("../../../assets/images/cloud.svg");


class NetworkCard extends React.Component<IProps & IDispatchProps, {}> {
    constructor(props) {
        super(props);
        this.handleHideNetwork = this.handleHideNetwork.bind(this);
    }

    public render() {
        const {name, address} = this.props.network;

        const actions = [(
            <EntityCardActionButton
                key="hide"
                label="Hide Network"
                onClick={this.handleHideNetwork}
            />
        )];

        return (
            <EntityCardTemplate
                title={name}
                subtitle={address}
                media={image}
                actions={actions}
            >
                <p>Network {address}</p>
                <NetworkName network={this.props.network} onChange={this.props.onChange} />
            </EntityCardTemplate>
        );
    }

    private handleHideNetwork() {
        this.props.onChange();
        this.props.hideNetwork(this.props.network.address);
    }
};


interface IProps {
    network: INetwork;
    onChange: () => void;
};


interface IDispatchProps {
    hideNetwork: (name: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    hideNetwork: (name: string) => dispatch(hideNetworkForProject(name)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(NetworkCard);
