import * as React from "react";

import IconButton from "material-ui/IconButton";
import {List, ListItem} from "material-ui/List";

import {ContentAddIcon, DeleteIcon} from "../../../utils/theme";
import {IFieldArrayProps} from "../../../utils/types";

import {FormField, TextFormField} from "../../common/Form";


export default class ScenarioArguments extends React.Component<IProps & IFieldArrayProps<IFieldProps>, {}> {
    constructor(props) {
        super(props);
        this.addArgument = this.addArgument.bind(this);
    }

    public render() {
        const {firstFieldName, secondFieldName} = this.props;
        const fieldSubname = secondFieldName.toLowerCase();

        const scenarioArguments = this.props.fields.map((fieldName: string, index: number, fields) => {
            const deleteButton = (
                <IconButton
                    touch={true}
                    tooltip="Remove this argument"
                    tooltipPosition="top-right"
                    onTouchTap={this.removeArgument.bind(this, index)}
                    style={{padding: "0px"}}
                >
                    <DeleteIcon />
                </IconButton>
            );

            const formFields = (
                <div style={{ marginTop: "-24px" }}>
                    <FormField
                        name={`${fieldName}.name`}
                        component={TextFormField}
                        text="Name"
                        fullWidth={true}
                    />
                    <FormField
                        name={`${fieldName}.${fieldSubname}`}
                        component={TextFormField}
                        text={secondFieldName}
                        fullWidth={true}
                    />
                </div>
            );

            return (
                <ListItem
                    key={fieldName}
                    disabled={true}
                    primaryText={formFields}
                    leftIcon={deleteButton}
                />
            );
        });
        scenarioArguments.push(<ListItem
            key={null}
            primaryText={`Add new ${firstFieldName.toLowerCase()}`}
            leftIcon={<ContentAddIcon />}
            onTouchTap={this.addArgument}
        />);

        return (
            <List>
                <ListItem
                    primaryText={firstFieldName + "s"}
                    nestedItems={scenarioArguments}
                    primaryTogglesNestedList={true}
                />
            </List>
        );
    }

    public componentWillReceiveProps(nextProps: IProps) {
        if (nextProps.formName !== this.props.formName) {
            this.props.fields.removeAll();
        }
    }

    private addArgument() {
        const value = this.props.secondFieldName.toLowerCase();
        this.props.fields.push({ name: "", [value]: "" });
    }

    private removeArgument(index: number, event) {
        event.stopPropagation();
        this.props.fields.remove(index);
    }
};


interface IProps {
    formName: string;
    firstFieldName: string;
    secondFieldName: string;
    style: React.CSSProperties;
};


interface IFieldProps {
    name: string;
    [secondaryValue: string]: string;
}
