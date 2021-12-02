import * as React from "react";

import Checkbox from "material-ui/Checkbox";
import {ListItem} from "material-ui/List";

import {IProfilePermissions} from "../../interfaces/login.interface";


export default class UserManager extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.onActiveCheck = this.onActiveCheck.bind(this);
        this.onAdminCheck = this.onAdminCheck.bind(this);
        this.deleteSelected = this.deleteSelected.bind(this);
    }

    public render() {
        const deleteCheckbox = <Checkbox defaultChecked={false} onCheck={this.deleteSelected} />;

        const {login, active, admin} = this.props.permissions;
        const displayArea = (
            <div style={{position: "absolute", left: "50%", width: "300px"}}>
                <Checkbox
                    label="Active"
                    checked={active}
                    disabled={admin}
                    onCheck={this.onActiveCheck}
                    style={{display: "inline-block", width: "50%"}}
                />
                <Checkbox
                    label="Admin"
                    checked={admin}
                    onCheck={this.onAdminCheck}
                    style={{display: "inline-block", width: "50%"}}
                />
            </div>
        );

        return (
            <ListItem
                primaryText={login}
                leftCheckbox={deleteCheckbox}
                rightToggle={displayArea}
            />
        );
    }

    private onActiveCheck(event, checked: boolean) {
        this.props.onUserActiveChange(checked);
    }

    private onAdminCheck(event, checked: boolean) {
        this.props.onUserAdminChange(checked);
    }

    private deleteSelected(event, checked: boolean) {
        this.props.onDeleteSelected(this.props.permissions.login, checked);
    }
};


interface IProps {
    permissions: IProfilePermissions;
    onUserActiveChange: (checked: boolean) => void;
    onUserAdminChange: (checked: boolean) => void;
    onDeleteSelected: (name: string, checked: boolean) => void;
};
