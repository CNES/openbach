import * as React from "react";

import IconButton from "material-ui/IconButton";
import MenuItem from "material-ui/MenuItem";
import {grey500} from "material-ui/styles/colors";

import {IJobArgument} from "../../../interfaces/job.interface";
import {TStartJobParameterValue} from "../../../interfaces/project.interface";
import {IOpenbachFunctionForm} from "../../../interfaces/scenarioForm.interface";
import {InfoIcon, muiTheme} from "../../../utils/theme";
import {IFieldArrayProps} from "../../../utils/types";
import {
    CheckboxFormField,
    FormField,
    OpenbachFunctionIdFormInput,
    ReduxFormMultiSelectField,
    SelectFormField,
    TextFormField,
} from "../../common/Form";


interface IStyles {
    checkboxes: React.CSSProperties;
    hint: React.CSSProperties;
    multiSelect: React.CSSProperties;
    multiSelectWrapper: React.CSSProperties;
    optional: React.CSSProperties;
    textThatLookLikeLabel: React.CSSProperties;
};


const styles: IStyles = {
    checkboxes: {
        display: "inline-block",
        marginRight: "15px",
        width: "auto",
    },
    hint: {
        margin: "-12px",
        position: "absolute",
        right: "0px",
        top: "0px",
        zIndex: 3,
    },
    multiSelect: {
        flexGrow: 100,
    },
    multiSelectWrapper: {
        alignItems: "center",
        display: "flex",
    },
    optional: {
        color: grey500,
    },
    textThatLookLikeLabel: {
        color: muiTheme.textField.floatingLabelColor,
        marginRight: "8px",
    },
};


export default class RepeatableJobParameters extends React.Component<IProps & IFieldArrayProps<TStartJobParameterValue[]>, IState> {
    constructor(props) {
        super(props);
        this.state = { highestRowIndex: props.jobArgument.repeatable ? props.repeated : 0 };
    }

    public componentDidUpdate() {
        if (!this.props.jobArgument.repeatable) {
            return;
        }

        const {fields} = this.props;
        for (let i = 0; i < fields.length; ++i) {
            const values = fields.get(i);
            const filedFields = values.reduce((total: number, value: TStartJobParameterValue) => value ? total + 1 : total, 0);
            if (!filedFields) {
                fields.remove(i);
                this.setState({highestRowIndex: this.state.highestRowIndex - 1});
                return;
            }
        }

        if (this.state.highestRowIndex < fields.length) {
            this.setState({highestRowIndex: fields.length});
        }
    }

    public render() {
        const {jobArgument, otherFunctions} = this.props;
        if (jobArgument.type === "None") {
            return this.renderCheckboxes();
        } else if (jobArgument.type === "job" || jobArgument.type === "scenario") {
            const kind = `start_${jobArgument.type}_instance`;
            const choices = otherFunctions
                .filter((openbachFunction: IOpenbachFunctionForm) => openbachFunction.kind === kind)
                .map((openbachFunction: IOpenbachFunctionForm) => ({value: openbachFunction.id, label: openbachFunction.label}));
            return this.renderMultiSelect(choices);
        } else {
            const counts = this.getArgumentsCount();
            if (jobArgument.choices && jobArgument.choices.length) {
                return this.renderSelect(counts[0], counts[1]);
            } else {
                return this.renderText(counts[0], counts[1]);
            }
        }
    }

    private renderCheckboxes() {
        const {jobArgument, formName} = this.props;

        const boxes = Array(this.state.highestRowIndex + 1);
        for (let index = 0; index < boxes.length; ++index) {
            boxes[index] = <FormField
                key={index}
                name={`${formName}[${index}][0]`}
                text={jobArgument.name}
                component={CheckboxFormField}
                hintText={jobArgument.description}
                style={styles.checkboxes}
            />;
        }

        return (
            <div style={this.props.style}>
                {boxes}
                <IconButton
                    disabled={true}
                    touch={true}
                    tooltipPosition="top-left"
                    tooltip={jobArgument.description}
                    style={styles.hint}
                >
                    <InfoIcon />
                </IconButton>
            </div>
        );
    }

    private renderSelect(lower: number, upper: number) {
        const {jobArgument, formName} = this.props;

        const choices = jobArgument.choices.map((choice: string) =>
            <MenuItem
                key={choice}
                value={choice}
                primaryText={choice}
            />,
        );
        choices.unshift(<MenuItem key={null} value={null} primaryText="" />);

        const rows = Array(this.state.highestRowIndex + 1);
        for (let index = 0; index < rows.length; ++index) {
            const row = Array(upper);
            for (let i = 0; i < row.length; ++i) {
                row[i] = <FormField
                    key={i}
                    name={`${formName}[${index}][${i}]`}
                    text={jobArgument.name}
                    component={SelectFormField}
                    fullWidth={upper < 2}
                    hintText={jobArgument.description}
                    style={{marginLeft: (i ? 10 : 0) + "px"}}
                    customStyle={i >= lower ? styles.optional : undefined}
                    children={choices}
                />;
            }
            rows[index] = <div key={index} style={this.props.style}>{row}</div>;
        }
        return <div>{rows}</div>;
    }

    private renderText(lower: number, upper: number) {
        const {jobArgument, formName} = this.props;
        const fieldType = jobArgument.password ? "password" : undefined;

        const rows = Array(this.state.highestRowIndex + 1);
        for (let index = 0; index < rows.length; ++index) {
            const row = Array(upper);
            for (let i = 0; i < row.length; ++i) {
                row[i] = <FormField
                    key={i}
                    name={`${formName}[${index}][${i}]`}
                    text={jobArgument.name}
                    component={TextFormField}
                    fullWidth={upper < 2}
                    hintText={jobArgument.description}
                    style={{marginLeft: (i ? 10 : 0) + "px"}}
                    customStyle={i >= lower ? styles.optional : undefined}
                    type={fieldType}
                />;
            }
            rows[index] = <div key={index} style={this.props.style}>{row}</div>;
        }
        return <div>{rows}</div>;
    }

    private renderMultiSelect(options: Array<{value: number, label: string}>) {
        const {jobArgument, formName} = this.props;

        const rows = Array(this.state.highestRowIndex + 1);
        for (let index = 0; index < rows.length; ++index) {
            rows[index] = (
                <div key={index} style={{...styles.multiSelectWrapper, ...this.props.style}}>
                    <div style={styles.textThatLookLikeLabel}>{jobArgument.name}:</div>
                    <div style={styles.multiSelect}><ReduxFormMultiSelectField
                        name={`${formName}[${index}]`}
                        component={OpenbachFunctionIdFormInput}
                        multi={true}
                        autosize={true}
                        clearable={false}
                        options={options}
                    /></div>
                </div>
            );
        }
        return <div>{rows}</div>;
    }

    private getArgumentsCount(): number[] {
        const {jobArgument} = this.props;
        const count = Number(jobArgument.count);
        let count_lower = count;
        let count_upper = count;
        if (isNaN(count)) {
            if (jobArgument.count === "*") {
                count_upper = 10;  // NaN;
            } else if (jobArgument.count === "+") {
                count_lower = 1;
                count_upper = 10;  // NaN;
            } else {
                const counts = jobArgument.count.split("-");
                count_lower = Number(counts[0]);
                count_upper = Number(counts[1]);
            }
        }
        return [count_lower, count_upper];
    }
};


interface IProps {
    jobArgument: IJobArgument;
    otherFunctions: IOpenbachFunctionForm[];
    repeated: number;
    formName: string;
    style: React.CSSProperties;
}


interface IState {
    highestRowIndex: number;
}
