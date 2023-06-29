import React from 'react';

import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';

import CloseMenu from '@mui/icons-material/ExpandLess';
import OpenMenu from '@mui/icons-material/ExpandMore';


const MenuButton: React.FC<React.PropsWithChildren<Props>> = (props) => {
    const {title, onOpen, useColor, children} = props;

    const [menuAnchor, setAnchor] = React.useState<HTMLElement>();

    const handleOpen = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
        if (onOpen != null) {onOpen();}
        setAnchor(event.currentTarget);
    }, [onOpen]);

    const handleClose = React.useCallback(() => {
        setAnchor(undefined);
    }, []);

    const open = Boolean(menuAnchor);
    const menuIcon = open ? <CloseMenu /> : <OpenMenu />;
    const buttonProps: ButtonProps = useColor ? {
        variant: "contained",
        color: open ? "secondary" : "primary"
    } : {};

    return (
        <React.Fragment>
            <Button onClick={handleOpen} endIcon={menuIcon} {...buttonProps} >
                {title}
            </Button>
            <Menu
                anchorEl={menuAnchor}
                open={open}
                onClick={handleClose}
                onClose={handleClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
            >
                {children}
            </Menu>
        </React.Fragment>
    );
};


interface Props {
    title: string;
    onOpen?: () => void;
    useColor?: boolean;
}


interface ButtonProps {
    variant?: "contained",
    color?: "primary" | "secondary",
}


export default MenuButton;
