     import { createTheme } from '@mui/material/styles';

     const theme = createTheme({
       typography: {
         fontFamily: 'Inter, sans-serif', // Use a clean sans-serif font
         h1: {
           fontWeight: 700,
           fontSize: '3rem',
           color: '#000',
         },
         h2: {
           fontWeight: 700,
           fontSize: '2.5rem',
           color: '#000',
         },
         h3: {
           fontWeight: 700,
           fontSize: '2rem',
           color: '#000',
         },
         subtitle1: {
           color: 'rgba(0, 0, 0, 0.6)', // Soft gray
         },
         button: {
           textTransform: 'none', // Keep button text as is
         },
       },
       palette: {
         primary: {
           main: '#1A73E8', // Primary blue
         },
         background: {
           default: '#FFFFFF', // White background
         },
       },
       components: {
         MuiButton: {
           styleOverrides: {
             root: {
               borderRadius: '8px', // Rounded corners for buttons
             },
             containedPrimary: {
               color: '#FFFFFF', // White text for blue buttons
             },
             outlinedPrimary: {
               borderColor: '#1A73E8',
               color: '#1A73E8',
             },
           },
         },
         MuiTextField: {
           styleOverrides: {
             root: {
               '& .MuiOutlinedInput-root': {
                 borderRadius: '8px', // Rounded corners for input fields
               },
             },
           },
         },
         MuiPaper: {
           styleOverrides: {
             root: {
               borderRadius: '12px', // Soft rounded corners for modals
               boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', // Drop shadow
             },
           },
         },
       },
     });

     export default theme;
     