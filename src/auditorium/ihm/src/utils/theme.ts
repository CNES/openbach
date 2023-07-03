import {createTheme, Theme} from '@mui/material/styles';
declare module '@mui/material/styles' {
  interface Palette {
    mainTitle: Palette['primary'];
  }

  interface PaletteOptions {
    mainTitle: PaletteOptions['primary'];
  }
}
declare module '@mui/material/AppBar' {
  interface AppBarPropsColorOverrides {
    mainTitle: true;
  }
}


const compensate = String(50 / 9) + "%";


export const breakOutOfMainBody = {
    marginLeft: "-" + compensate,
    marginRight: "-" + compensate,
    paddingLeft: compensate,
    paddingRight: compensate,
    boxSizing: "content-box",
}


const createCustomTheme = (prefersDarkMode: boolean): Theme => createTheme({
  palette: {
    mode: prefersDarkMode ? 'dark' : 'light',
    primary: {
      main: "#2A72A9",
    },
    secondary: {
      main: "#F48C00",
    },
    mainTitle: {
      main: "black",
      contrastText: "white",
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
