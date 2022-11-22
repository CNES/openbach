import * as React from "react";

import IconButton from "material-ui/IconButton";
import {List, ListItem} from "material-ui/List";
import TextField from "material-ui/TextField";

import {IOpenbachFunctionForm} from "../../../interfaces/scenarioForm.interface";
import {ContentAddIcon, DeleteIcon} from "../../../utils/theme";
import {IFieldArrayProps, IFieldsProps} from "../../../utils/types";

import OpenbachFunction from "./OpenbachFunction";


interface IStyle {
    container: React.CSSProperties;
    defaultContainer: React.CSSProperties;
    newSection: React.CSSProperties;
    removeSection: React.CSSProperties;
    removeSectionIcon: React.CSSProperties;
};


const styles: IStyle = {
    container: {
        borderBottom: "1px silver solid",
        position: "relative",
    },
    defaultContainer: {
        position: "relative",
    },
    newSection: {
        left: -36,
        position: "absolute",
        top: 12,
    },
    removeSection: {
        bottom: 0,
        height: 16,
        margin: 0,
        padding: 0,
        position: "absolute",
        right: 0,
        width: 16,
    },
    removeSectionIcon: {
        height: 16,
        margin: 0,
        padding: 0,
        width: 16,
    },
};


export default class OpenbachFunctions extends React.Component<IProps & IFieldArrayProps<IOpenbachFunctionForm>, {}> {
    constructor(props) {
        super(props);
        this.addOpenBachFunction = this.addOpenBachFunction.bind(this);
    }

    public render() {
        const openbachFunctions = this.props.fields.map((fieldName: string, index: number, fields: IFieldsProps<IOpenbachFunctionForm>) => (
            <OpenbachFunction
                key={`${fieldName}_${index}`}
                formIndex={index}
                formName={this.props.formName}
                remove={this.removeOpenBachFunction.bind(this, index)}
            />
        ));

        return (
            <List>
                {openbachFunctions}
                <ListItem
                    primaryText="Add new OpenBACH function"
                    leftIcon={<ContentAddIcon />}
                    onTouchTap={this.addOpenBachFunction}
                />
            </List>
        );
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.formName !== this.props.formName) {
            this.props.fields.removeAll();
        }
    }

    private addOpenBachFunction() {
        const newGuid = parseInt("xxxxxxx".replace(/[x]/g, (c) => {
            // tslint:disable:no-bitwise
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }), 16);
        this.props.fields.push({
            id: newGuid,
            kind: undefined,
            label: undefined,
            on_fail: undefined,
            parameters: {},
            wait: undefined,
        });
    }

    private removeOpenBachFunction(index: number) {
        const removedId = this.props.fields.get(index).id;
        const excludeRemoved = (id: number) => id !== removedId;
        this.props.fields.forEach((fieldName: string, i: number, fields: IFieldsProps<IOpenbachFunctionForm>) => {
            if (i !== index) {
                const openbachFunction = fields.get(i);
                const {wait, jobs, conditionTrue, conditionFalse} = openbachFunction;
                if (wait) {
                    const {running_ids, ended_ids, launched_ids, finished_ids} = wait;
                    if (running_ids) {
                        openbachFunction.wait.running_ids = running_ids.filter(excludeRemoved);
                    }
                    if (ended_ids) {
                        openbachFunction.wait.ended_ids = ended_ids.filter(excludeRemoved);
                    }
                    if (launched_ids) {
                        openbachFunction.wait.launched_ids = launched_ids.filter(excludeRemoved);
                    }
                    if (finished_ids) {
                        openbachFunction.wait.finished_ids = finished_ids.filter(excludeRemoved);
                    }
                }
                if (jobs) {
                    openbachFunction.jobs = jobs.filter(excludeRemoved);
                }
                if (conditionTrue) {
                    openbachFunction.conditionTrue = conditionTrue.filter(excludeRemoved);
                }
                if (conditionFalse) {
                    openbachFunction.conditionFalse = conditionFalse.filter(excludeRemoved);
                }
            }
        });
        this.props.fields.remove(index);
    }
};


interface IProps {
    formName: string;
};
