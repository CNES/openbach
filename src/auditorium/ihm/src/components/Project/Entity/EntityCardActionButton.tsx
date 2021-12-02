import * as React from "react";
import {connect} from "react-redux";

import RaisedButton from "material-ui/RaisedButton";


export default class EntityCardActionButton extends React.Component<IProps, {}> {
    public render() {
        return (
            <div style={{textAlign: "center", marginTop: "16px"}}>
                <RaisedButton
                    label={this.props.label}
                    onClick={this.props.onClick}
                    secondary={true}
                    disabled={this.props.disabled}
                />
            </div>
        );
    }
};


interface IProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
};
