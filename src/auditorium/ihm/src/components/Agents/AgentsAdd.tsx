import * as React from "react";
import {connect} from "react-redux";

import {addAgent} from "../../actions/agent";

import TitledPaper from "../common/TitledPaper";
import AgentForm from "./AgentForm";


class AgentsAdd extends React.Component<IDispatchProps, {}> {
    public render() {
        return (
            <TitledPaper level={2} title="Add agent">
                <AgentForm
                    onAttach={this.props.attachAgent}
                    onCreate={this.props.createAgent}
                />
            </TitledPaper>
        );
    }
};


interface IDispatchProps {
    attachAgent: () => void;
    createAgent: () => void;
};


const mapDispatchToProps = (dispatch): IDispatchProps => ({
    attachAgent: () => dispatch(addAgent(true)),
    createAgent: () => dispatch(addAgent()),
});


export default connect<{}, IDispatchProps, {}>(null, mapDispatchToProps)(AgentsAdd);
