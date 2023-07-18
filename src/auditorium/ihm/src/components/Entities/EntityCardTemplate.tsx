import React from 'react';

import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';

import {useSelector} from '../../redux';


const EntityCardTemplate: React.FC<React.PropsWithChildren<Props>> = (props) => {
    const {title, subtitle, media, actions, children} = props;
    const isUser = useSelector((state) => state.login.is_user);

    return (
        <Card sx={{position: "relative"}}>
            <CardHeader title={title} subheader={subtitle} sx={{height: "64px", backgroundColor: "rgba(0, 0, 0, 0.4)"}} />
            <CardMedia
                component="img"
                alt="header logo"
                image={media}
                height="96"
                sx={{objectFit: "contain", position: "absolute", width: "96px", top: 0, right: 8}}
            />
            <CardContent>
                {children}
            </CardContent>
            {isUser && actions != null && <CardActions
                disableSpacing
                sx={{display: "flex", flexDirection: "column", gap: 1}}
            >
                {actions}
            </CardActions>}
        </Card>
    );
};


interface Props {
    title: string;
    subtitle?: string;
    media: string;
    actions?: React.PropsWithChildren<{}>["children"];
}


export default EntityCardTemplate;
