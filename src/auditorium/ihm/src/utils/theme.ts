import {createTheme, Theme} from '@mui/material/styles';


const createCustomTheme = (prefersDarkMode: boolean): Theme => createTheme({
  palette: {
    mode: prefersDarkMode ? 'dark' : 'light',
    primary: {
      main: "#2A72A9",
    },
    secondary: {
      main: "#F48C00",
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "1em",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          color: "white",
        },
      },
    },
  },
});


export default createCustomTheme;
