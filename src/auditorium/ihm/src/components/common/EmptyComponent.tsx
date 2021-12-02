import * as React from "react";


export default class Empty extends React.Component<{}, {}> {
    public render() {
        return <div>{this.props.children}</div>;
    }
};
