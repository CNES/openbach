import * as React from "react";


export default class PaddedContainer extends React.Component<IProps, {}> {
    public render() {
        const padded = {paddingLeft: "5%", paddingRight: "5%", ...this.props.style};
        return <div style={padded}>{this.props.children}</div>;
    }
};


interface IProps {
    style?: React.CSSProperties;
};
