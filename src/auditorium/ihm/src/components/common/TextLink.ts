import {Link} from 'react-router-dom';

import {styled} from '@mui/material/styles';


const TextLink = styled(Link, {name: "TextLink", slot: "Wrapper"})({
    color: "inherit",
    width: "100%",
    textDecoration: "none",
    '&:visited': {
        color: "inherit",
        textDecoration: "none",
    },
});


export default TextLink;
