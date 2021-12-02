import * as React from "react";

import Checkbox from "material-ui/Checkbox";
import {ListItem} from "material-ui/List";
import TextField from "material-ui/TextField";


export default class UnitsSelector extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = { checked: false, value: "" };
        this.doChange = this.doChange.bind(this);
        this.handleTextFieldChange = this.handleTextFieldChange.bind(this);
    }

    public render() {
        const unitForm = (
            <TextField
                style={{ marginTop: "-24px" }}
                floatingLabelText="Units"
                onChange={this.handleTextFieldChange}
                value={this.state.value}
            />
        );

        return (
            <ListItem
                leftCheckbox={<Checkbox style={{marginLeft: "16px"}} onCheck={this.doChange}/>}
                primaryText={this.props.name}
                rightIconButton={unitForm}
            />
        );
    }

    private doChange(event, isChecked: boolean) {
        const value = this.state.value;
        this.setState({ checked: isChecked, value });
        this.props.onChange(isChecked ? value : null);
    }

    private handleTextFieldChange(event, newText: string) {
        const checked = this.state.checked;
        if (checked) {
            this.props.onChange(newText);
        }
        this.setState({ checked, value: newText });
    }
};


interface IState {
    checked: boolean;
    value: string;
};


interface IProps {
    name: string;
    onChange: (payload: string) => void;
};
