import * as React from "react";
import {connect} from "react-redux";

import {removeScenario} from "../../../actions/scenario";

import ActionDialog from "../../common/ActionDialog";


class ScenarioDeleteDialog extends React.Component<IProps & IDispatchProps, {}> {
    constructor(props) {
        super(props);
        this.doDeleteScenario = this.doDeleteScenario.bind(this);
    }

    public render() {
        return (
            <ActionDialog
                title="Really delete this scenario?"
                modal={true}
                open={this.props.open}
                cancel={{label: "Cancel", action: this.props.onRequestClose}}
                actions={[{label: "Delete", action: this.doDeleteScenario}]}
            >
                <p>The scenario {this.props.scenario} will be deleted.
                This action is unrecoverable. Do you want to continue?</p>
            </ActionDialog>
        );
    }

    private doDeleteScenario() {
        const {deleteScenario, onRequestClose, scenario} = this.props;
        deleteScenario(scenario);
        onRequestClose();
    }
};


interface IProps {
    onRequestClose: () => void;
    open: boolean;
    scenario: string;
};


interface IDispatchProps {
    deleteScenario: (name: string) => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    deleteScenario: (name: string) => dispatch(removeScenario(name)),
});


export default connect<{}, IDispatchProps, IProps>(null, mapDispatchToProps)(ScenarioDeleteDialog);
