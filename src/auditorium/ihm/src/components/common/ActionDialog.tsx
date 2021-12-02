import * as React from "react";

import Dialog from "material-ui/Dialog";
import RaisedButton from "material-ui/RaisedButton";


const style: React.CSSProperties = {
    margin: "8px",
};


export default class ActionDialog extends React.Component<IProps, {}> {
    public render() {
        const actions = this.props.actions.map((action: IActionForDialog, idx: number) => (
            <RaisedButton
                key={idx}
                label={action.label}
                secondary={true}
                onTouchTap={action.action}
                style={style}
            />
        ));
        actions.push((
            <RaisedButton
                key={actions.length}
                label={this.props.cancel.label}
                primary={true}
                keyboardFocused={true}
                onTouchTap={this.props.cancel.action}
                style={style}
            />
        ));

        return (
            <Dialog
                open={this.props.open}
                onRequestClose={this.props.cancel.action}
                title={this.props.title}
                modal={this.props.modal}
                actions={actions}
                autoScrollBodyContent={this.props.auto}
            >
                {this.props.children}
            </Dialog>
        );
    }
};


export interface IActionForDialog {
    label: string;
    action: () => void;
};


interface IProps {
    title: string;
    open: boolean;
    modal: boolean;
    cancel: IActionForDialog;
    actions: IActionForDialog[];
    auto?: boolean;
};
