import * as React from "react";

import RaisedButton from "material-ui/RaisedButton";

import {openURL} from "../../api/common";


export default class Component extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.doDownload = this.doDownload.bind(this);
    }

    public render() {
        const title = this.props.type ? "Download " + this.props.type : "Download";

        return (
            <RaisedButton
                label={title}
                style={this.props.style}
                secondary={true}
                onTouchTap={this.doDownload}
                disabled={this.props.disabled}
            />
        );
    }

    private doDownload(event) {
        event.stopPropagation();
        openURL("/openbach" + this.props.route, this.props.filename);
    }
};


interface IProps {
    route: string;
    filename: string;
    type?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
};
