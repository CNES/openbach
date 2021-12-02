import * as React from "react";
import {connect} from "react-redux";

import Snackbar from "material-ui/Snackbar";


class MainSnackbar extends React.Component<IStoreProps, IState> {
    constructor(props) {
        super(props);
        this.state = {message: "", open: false};
        this.handleRequestClose = this.handleRequestClose.bind(this);
    }

    public componentWillReceiveProps(nextProps: IStoreProps) {
        const {content} = nextProps.message;
        if (content !== this.state.message) {
            this.setState({message: content, open: true});
        }
    }

    public render() {
        return (
            <Snackbar
                open={this.state.open}
                message={this.state.message}
                autoHideDuration={25000}
                onRequestClose={this.handleRequestClose}
            />
        );
    }

    private handleRequestClose() {
        this.setState({message: "", open: false});
    }
};


interface IStoreProps {
    message: {content: string, date: Date};
};


interface IState {
    open: boolean;
    message: string;
};


const mapStoreToProps = (store): IStoreProps => ({
    message: store.snack,
});


export default connect<IStoreProps, {}, {}>(mapStoreToProps)(MainSnackbar);
