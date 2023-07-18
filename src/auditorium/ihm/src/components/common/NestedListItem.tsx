import React from 'react';

import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';


const NestedListItem: React.FC<Props> = (props) => {
    const {primary, secondary, rightIcon, leftIcon, onLeftClick, initiallyOpen, nestedItems, inset} = props;
    const [open, storeOpen] = React.useState<boolean>(!!initiallyOpen);

    const handleCollapseToggle = React.useCallback(() => {
        storeOpen((o: boolean) => !o);
    }, []);

    return (
        <React.Fragment>
            <ListItemButton onClick={handleCollapseToggle}>
                {leftIcon && <ListItemIcon onClick={onLeftClick}>{leftIcon}</ListItemIcon>}
                <ListItemText primary={primary} secondary={secondary} />
                {rightIcon || (Boolean(nestedItems) && (open ? <ExpandLess /> : <ExpandMore />))}
            </ListItemButton>
            {nestedItems && <Collapse in={open} timeout="auto" unmountOnExit sx={inset ? {pl: 4} : undefined}>
                <List>{nestedItems}</List>
            </Collapse>}
        </React.Fragment>
    );
};


interface Props {
    primary?: string;
    secondary?: string;
    rightIcon?: Node;
    leftIcon?: Node;
    initiallyOpen?: boolean;
    nestedItems?: Node;
    inset?: boolean;
    onLeftClick?: () => void;
}


type Node = React.PropsWithChildren<{}>["children"];


export default NestedListItem;
