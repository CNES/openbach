import * as React from "react";

import FlatButton from "material-ui/FlatButton";

import {FileUploadIcon} from "../../utils/theme";


export default class UploadFileButton extends React.Component<IProps, {}> {
    constructor(props) {
        super(props);
        this.doClick = this.doClick.bind(this);
    }

    public render() {
        const {id, label, onChange} = this.props;

        return (
            <FlatButton
                label={label}
                labelPosition="before"
                onChange={onChange}
                onTouchTap={this.doClick}
                icon={<FileUploadIcon />}
            >
                <input id={id} type="file" style={{display: "none"}} />
            </FlatButton>
        );
    }

    private doClick() {
        document.getElementById(this.props.id).click();
    }
};


interface IProps {
    id: string;
    label: string;
    onChange: (event: any) => void;
};
