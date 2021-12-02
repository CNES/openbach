import * as React from "react";
import {browserHistory} from "react-router";

import FlatButton from "material-ui/FlatButton";


const mainLogoSize = 56;

const modes = {
    fill: "cover",
    fit: "contain",
};


export default class MainLogo extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.goToOrigin = this.goToOrigin.bind(this);
    }

    public render() {
        const {mode, src, style} = this.props;

        const defaults = {
            height: mainLogoSize,
            width: mainLogoSize,
        };

        const important = {
            backgroundImage: `url("${src}")`,
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            backgroundSize: modes[mode] || "contain",
        };

        return <FlatButton label=" " onTouchTap={this.goToOrigin} style={{...defaults, ...style, ...important}} />;
    }

    private goToOrigin() {
        browserHistory.push("/");
    }
};


interface IProps {
    src: string;
    mode?: string;
    style?: React.CSSProperties;
};
