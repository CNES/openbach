import * as React from "react";

import Paper from "material-ui/Paper";


export default class TitledPaper extends React.Component<IProps, {}> {
    public render() {
        const level = !this.props.level || this.props.level < 1 ? 1 : this.props.level;

        return (
            <Paper zDepth={0} style={{paddingTop: (10 / level) + "px", ...this.props.style}}>
                {this.getTitle(level)}
                {this.props.children}
            </Paper>
        );
    }

    private getTitle(level: number) {
        switch (level) {
            case 1:
                return <h1 style={{marginLeft: "8px"}}>{this.props.title}</h1>;
            case 2:
                return <h2 style={{marginLeft: "8px"}}>{this.props.title}</h2>;
            case 3:
                return <h3 style={{marginLeft: "8px"}}>{this.props.title}</h3>;
            case 4:
                return <h4 style={{marginLeft: "8px"}}>{this.props.title}</h4>;
            case 5:
                return <h5 style={{marginLeft: "8px"}}>{this.props.title}</h5>;
            default:
                return <h6 style={{marginLeft: "8px"}}>{this.props.title}</h6>;
        }
    }
};


interface IProps {
    title: string;
    level?: number;
    style?: React.CSSProperties;
};
