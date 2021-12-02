import * as React from "react";

import TextField from "material-ui/TextField";


export default class ScenarioLaunchArgument extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.doChange = this.doChange.bind(this);
    }

    public render() {
        const {name, value, hint} = this.props;

        return (
            <div>
                <TextField
                    floatingLabelText={name}
                    hintText={hint}
                    value={value}
                    onChange={this.doChange}
                    fullWidth={true}
                />
            </div>
        );
    }

    private doChange(event, newValue: string) {
        this.props.onChange(newValue);
    }
};


interface IProps {
    name: string;
    value: string;
    hint: string;
    onChange: (value: string) => void;
};
