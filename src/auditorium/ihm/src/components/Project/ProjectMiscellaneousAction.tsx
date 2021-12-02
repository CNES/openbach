import * as React from "react";
import {connect} from "react-redux";

import RaisedButton from "material-ui/RaisedButton";

import {getAgents} from "../../actions/agent";
import {ILoginCredentials} from "../../interfaces/login.interface";


export const miscellaneousActionStyle: React.CSSProperties = {
    margin: "0 15px 10px",
};


export class ProjectMiscellaneousAction extends React.Component<IProps, {}> {
    public render() {
        return (
            <RaisedButton
                label={this.props.label}
                disabled={!this.props.canDoAction}
                secondary={true}
                onClick={this.props.onClick}
                style={miscellaneousActionStyle}
            />
        );
    }
};


interface IProps {
    label: string;
    canDoAction: boolean;
    onClick: () => void;
};


export default ProjectMiscellaneousAction;
