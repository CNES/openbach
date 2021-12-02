import * as React from "react";
import {Creatable as ReactSelect, Option as ReactSelectOption} from "react-select";

import RaisedButton from "material-ui/RaisedButton";


export default class ProjectMiscellaneousSelect extends React.Component<IProps, IState> {
    private static _propsToOptions(props: string[]): ReactSelectOption[] {
        return props.map((prop: string) => ({label: prop, value: prop}));
    }

    constructor(props) {
        super(props);
        this.state = {
            options: ProjectMiscellaneousSelect._propsToOptions(props.options),
            selected: ProjectMiscellaneousSelect._propsToOptions(props.initial),
        };
        this.onSelectionChange = this.onSelectionChange.bind(this);
        this.onValidateAction = this.onValidateAction.bind(this);
    }

    public render() {
        return (
            <div style={{display: "flex", alignItems: "center"}}>
                <p>{this.props.title}</p>
                <div style={{flexGrow: 1, margin: "0 5px"}}><ReactSelect
                    multi={true}
                    name="share-project-name"
                    value={this.state.selected}
                    options={this.state.options}
                    onChange={this.onSelectionChange}
                /></div>
                <RaisedButton
                    label={this.props.label}
                    disabled={!this.props.canDoAction}
                    secondary={true}
                    onClick={this.onValidateAction}
                />
            </div>
        );
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.initial && nextProps.initial !== this.props.initial) {
            this.setState({
                options: ProjectMiscellaneousSelect._propsToOptions(nextProps.options),
                selected: ProjectMiscellaneousSelect._propsToOptions(nextProps.initial),
            });
        } else if (nextProps.options && nextProps.options !== this.props.options) {
            this.setState({
                options: ProjectMiscellaneousSelect._propsToOptions(nextProps.options),
            });
        }
    }

    private onSelectionChange(selected: ReactSelectOption[]) {
        this.setState({ selected });
    }

    private onValidateAction() {
        const values = this.state.selected.map((option: ReactSelectOption) => option.label);
        this.props.onClick(values);
    }
};


interface IState {
    options: ReactSelectOption[];
    selected: ReactSelectOption[];
};


interface IProps {
    title: string;
    label: string;
    initial: string[];
    options: string[];
    canDoAction: boolean;
    onClick: (values: string[]) => void;
};
