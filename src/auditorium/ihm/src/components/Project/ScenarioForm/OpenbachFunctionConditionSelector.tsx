import * as React from "react";

import MenuItem from "material-ui/MenuItem";
import TextField from "material-ui/TextField";

import {
    IOneConditionCondition,
    ITwoConditionsCondition,
    ITwoOperandsCondition,
    TOpenbachFunctionCondition,
    TOpenbachFunctionOperand,
} from "../../../interfaces/project.interface";
import {FormField, SelectFormField, TextFormField} from "../../common/Form";


interface IStyles {
  condition: React.CSSProperties;
  container: React.CSSProperties;
  ul: React.CSSProperties;
  li: React.CSSProperties;
  upTop: React.CSSProperties;
};

const styles: IStyles = {
    condition: {
        display: "inline",
    },
    container: {
        margin: "0px 5%",
        overflow: "auto",
        width: "90%",
    },
    li: {
        display: "inline-block",
        margin: "8px",
        textAlign: "center",
    },
    ul: {
        listStyle: "none",
        whiteSpace: "nowrap",
    },
    upTop: {
        verticalAlign: "top",
    },
};


export default class OpenbachFunctionConditionSelector extends React.Component<IProps, {}> {
    public render() {
        const {condition, fieldName} = this.props;
        return (
            <div style={styles.container}>
                <ul style={styles.ul}>
                    {this.selectConditionRenderer(condition, fieldName, "root")}
                </ul>
            </div>
        );
    }

    private selectConditionRenderer(condition: TOpenbachFunctionCondition, name: string, key: string) {
        if (!condition) {
            return this.emptyCondition(name, key);
        }

        switch (condition.type) {
            case "=":
            case "==":
            case "<=":
            case "<":
            case ">=":
            case ">":
            case "!=":
                return this.twoOperands(condition as ITwoOperandsCondition, name, key);
            case "not":
                return this.oneCondition(condition as IOneConditionCondition, name, key);
            case "and":
            case "or":
            case "xor":
                return this.twoConditions(condition as ITwoConditionsCondition, name, key);
            default:
                return this.emptyCondition(name, key);
        }
    }

    private emptyCondition(name: string, key: string) {
        return (
            <li key={key} style={styles.li}>
                <TextField disabled={true} name={`${name}.empty_left`} />
                {this.conditionSelector(name)}
                <TextField disabled={true} name={`${name}.empty_right`} />
            </li>
        );
    }

    private twoConditions(condition: ITwoConditionsCondition, name: string, key: string) {
        const inner_left = this.selectConditionRenderer(
            condition.left_condition,
            `${name}.left_condition`,
            "two_conditions_left_condition");

        const inner_right = this.selectConditionRenderer(
            condition.right_condition,
            `${name}.right_condition`,
            "two_conditions_right_condition");

        return (
            <li key={key} style={styles.li}>
                ({inner_left})
                {this.conditionSelector(name)}
                ({inner_right})
            </li>
        );
    }

    private oneCondition(condition: IOneConditionCondition, name: string, key: string) {
        const inner = this.selectConditionRenderer(
            condition.condition,
            `${name}.condition`,
            "one_condition_condition");

        return (
            <li key={key} style={styles.li}>
                {this.conditionSelector(name)}
                ({inner})
            </li>
        );
    }

    private twoOperands(condition: ITwoOperandsCondition, name: string, key: string) {
        const inner_left = this.selectOperandRenderer(
            condition.left_operand,
            `${name}.left_operand`,
            "two_operands_left_operand");

        const inner_right = this.selectOperandRenderer(
            condition.right_operand,
            `${name}.right_operand`,
            "two_operands_right_operand");

        return (
            <li key={key} style={styles.li}>
                {inner_left}
                {this.conditionSelector(name)}
                {inner_right}
            </li>
        );
    }

    private conditionSelector(name: string) {
        const typesMenuItems = ["=", "==", "<=", "<", ">=", ">", "!=", "and", "or", "xor", "not"].map(
            (op: string) => (
                <MenuItem key={op} value={op} primaryText={op} />
        ));

        return (
            <FormField
                name={`${name}.type`}
                text="Type"
                component={SelectFormField}
                children={typesMenuItems}
            />
        );
    }

    private selectOperandRenderer(condition: TOpenbachFunctionOperand, name: string, key: string) {
        if (!condition) {
            return this.emptyOperand(name, key);
        }

        switch (condition.type) {
            case "database":
                return this.databaseOperand(name, key);
            case "value":
                return this.valueOperand(name, key);
            case "statistic":
                return this.statisticOperand(name, key);
            default:
                return this.emptyOperand(name, key);
        }
    }

    private emptyOperand(name: string, key: string) {
        return (
            <li key={key} style={styles.li}>
                <div style={styles.upTop}>
                    {this.operandSelector(name)}
                </div>
            </li>
        );
    }

    private databaseOperand(name: string, key: string) {
        return (
            <li key={key} style={styles.li}>
                <div style={styles.upTop}>
                    <div>{this.operandSelector(name)}</div>
                    <div><FormField name={`${name}.name`} text="Name" component={TextFormField} /></div>
                    <div><FormField name={`${name}.key`} text="Key" component={TextFormField} /></div>
                    <div><FormField name={`${name}.attribute`} text="Attribute" component={TextFormField} /></div>
                </div>
            </li>
        );
    }

    private valueOperand(name: string, key: string) {
        return (
            <li key={key} style={styles.li}>
                <div style={styles.upTop}>
                    <div>{this.operandSelector(name)}</div>
                    <div><FormField name={`${name}.value`} text="Value" component={TextFormField} /></div>
                </div>
            </li>
        );
    }

    private statisticOperand(name: string, key: string) {
        return (
            <li key={key} style={styles.li}>
                <div style={styles.upTop}>
                    <div>{this.operandSelector(name)}</div>
                    <div><FormField name={`${name}.measurement`} text="Measurement" component={TextFormField} /></div>
                    <div><FormField name={`${name}.field`} text="Field" component={TextFormField} /></div>
                </div>
            </li>
        );
    }

    private operandSelector(name: string) {
        const typesMenuItems = ["database", "value", "statistic"].map(
            (op: string) => (
                <MenuItem key={op} value={op} primaryText={op} />
        ));

        return (
            <FormField
                name={`${name}.type`}
                text="Type"
                component={SelectFormField}
                children={typesMenuItems}
            />
        );
    }
};


interface IProps {
    fieldName: string;
    condition: TOpenbachFunctionCondition;
};
