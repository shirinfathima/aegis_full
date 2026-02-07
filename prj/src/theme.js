     import { createTheme } from '@mui/material/styles';

     const theme = createTheme({
       typography: {
         fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
         h1: {
           fontWeight: 700,
           fontSize: '2.5rem',
           letterSpacing: '-0.02em',
           color: '#1a1a1a',
         },
         h2: {
           fontWeight: 700,
           fontSize: '2rem',
           letterSpacing: '-0.01em',
           color: '#1a1a1a',
         },
         h3: {
           fontWeight: 600,
           fontSize: '1.5rem',
           letterSpacing: '-0.01em',
           color: '#1a1a1a',
         },
         h4: {
           fontWeight: 600,
           fontSize: '1.25rem',
           letterSpacing: '-0.01em',
           color: '#1a1a1a',
         },
         h5: {
           fontWeight: 600,
           fontSize: '1.125rem',
           color: '#2a2a2a',
         },
         h6: {
           fontWeight: 600,
           fontSize: '1rem',
           color: '#2a2a2a',
         },
         subtitle1: {
           fontSize: '0.875rem',
           color: '#708090',
           letterSpacing: '0.01em',
         },
         subtitle2: {
           fontSize: '0.813rem',
           color: '#708090',
           letterSpacing: '0.02em',
           textTransform: 'uppercase',
         },
         body1: {
           fontSize: '0.938rem',
           color: '#2a2a2a',
         },
         body2: {
           fontSize: '0.875rem',
           color: '#4a4a4a',
         },
         button: {
           textTransform: 'none',
           fontWeight: 500,
           letterSpacing: '0.01em',
         },
       },
       palette: {
         primary: {
           main: '#224C98',
           light: '#4682b4',
           dark: '#1c3e7d',
           lighter: '#eff6ff',
           contrastText: '#ffffff',
         },
         secondary: {
           main: '#4682b4',
           light: '#6397c2',
           dark: '#3a6d96',
           lighter: '#f0f9ff',
           contrastText: '#ffffff',
         },
         success: {
           main: '#16a34a',
           light: '#22c55e',
           dark: '#15803d',
           lighter: '#f0fdf4',
           contrastText: '#ffffff',
         },
         warning: {
           main: '#ea580c',
           light: '#fb923c',
           dark: '#c2410c',
           lighter: '#fff7ed',
           contrastText: '#ffffff',
         },
         error: {
           main: '#dc2626',
           light: '#ef4444',
           dark: '#b91c1c',
           lighter: '#fef2f2',
           contrastText: '#ffffff',
         },
         info: {
           main: '#0891b2',
           light: '#06b6d4',
           dark: '#0e7490',
           lighter: '#ecfeff',
           contrastText: '#ffffff',
         },
         text: {
           primary: '#1a1a1a',
           secondary: '#708090',
           disabled: '#9ca3af',
         },
         background: {
           default: '#f0f4f8',
           paper: '#ffffff',
         },
         grey: {
           50: '#f9fafb',
           100: '#f3f4f6',
           200: '#e5e7eb',
           300: '#d1d5db',
           400: '#9ca3af',
           500: '#708090',
           600: '#536878',
           700: '#374151',
           800: '#1f2937',
           900: '#111827',
         },
         divider: '#e5e7eb',
       },
       shape: {
         borderRadius: 8,
       },
       shadows: [
         'none',
         '0px 1px 2px rgba(0, 0, 0, 0.04)',
         '0px 1px 3px rgba(0, 0, 0, 0.06), 0px 1px 2px rgba(0, 0, 0, 0.04)',
         '0px 2px 4px rgba(0, 0, 0, 0.06), 0px 2px 3px rgba(0, 0, 0, 0.04)',
         '0px 4px 6px rgba(0, 0, 0, 0.06), 0px 2px 4px rgba(0, 0, 0, 0.04)',
         '0px 6px 10px rgba(0, 0, 0, 0.07), 0px 2px 6px rgba(0, 0, 0, 0.05)',
         '0px 8px 14px rgba(0, 0, 0, 0.08), 0px 3px 8px rgba(0, 0, 0, 0.06)',
         '0px 10px 18px rgba(0, 0, 0, 0.09), 0px 4px 10px rgba(0, 0, 0, 0.07)',
         '0px 12px 22px rgba(0, 0, 0, 0.10), 0px 5px 12px rgba(0, 0, 0, 0.08)',
         '0px 14px 26px rgba(0, 0, 0, 0.11), 0px 6px 14px rgba(0, 0, 0, 0.09)',
         '0px 16px 30px rgba(0, 0, 0, 0.12), 0px 7px 16px rgba(0, 0, 0, 0.10)',
         '0px 18px 34px rgba(0, 0, 0, 0.13), 0px 8px 18px rgba(0, 0, 0, 0.11)',
         '0px 20px 38px rgba(0, 0, 0, 0.14), 0px 9px 20px rgba(0, 0, 0, 0.12)',
         '0px 22px 42px rgba(0, 0, 0, 0.15), 0px 10px 22px rgba(0, 0, 0, 0.13)',
         '0px 24px 46px rgba(0, 0, 0, 0.16), 0px 11px 24px rgba(0, 0, 0, 0.14)',
         '0px 26px 50px rgba(0, 0, 0, 0.17), 0px 12px 26px rgba(0, 0, 0, 0.15)',
         '0px 28px 54px rgba(0, 0, 0, 0.18), 0px 13px 28px rgba(0, 0, 0, 0.16)',
         '0px 30px 58px rgba(0, 0, 0, 0.19), 0px 14px 30px rgba(0, 0, 0, 0.17)',
         '0px 32px 62px rgba(0, 0, 0, 0.20), 0px 15px 32px rgba(0, 0, 0, 0.18)',
         '0px 34px 66px rgba(0, 0, 0, 0.21), 0px 16px 34px rgba(0, 0, 0, 0.19)',
         '0px 36px 70px rgba(0, 0, 0, 0.22), 0px 17px 36px rgba(0, 0, 0, 0.20)',
         '0px 38px 74px rgba(0, 0, 0, 0.23), 0px 18px 38px rgba(0, 0, 0, 0.21)',
         '0px 40px 78px rgba(0, 0, 0, 0.24), 0px 19px 40px rgba(0, 0, 0, 0.22)',
         '0px 42px 82px rgba(0, 0, 0, 0.25), 0px 20px 42px rgba(0, 0, 0, 0.23)',
         '0px 44px 86px rgba(0, 0, 0, 0.26), 0px 21px 44px rgba(0, 0, 0, 0.24)',
       ],
       components: {
         MuiButton: {
           styleOverrides: {
             root: {
               borderRadius: '8px',
               fontWeight: 500,
               padding: '8px 16px',
               boxShadow: 'none',
               '&:hover': {
                 boxShadow: 'none',
               },
             },
             containedPrimary: {
               '&:hover': {
                 backgroundColor: '#1c3e7d',
               },
             },
             outlined: {
               borderWidth: '1.5px',
               '&:hover': {
                 borderWidth: '1.5px',
               },
             },
           },
         },
         MuiIconButton: {
           styleOverrides: {
             root: {
               borderRadius: '6px',
               transition: 'all 0.2s ease-in-out',
               '&:hover': {
                 backgroundColor: 'rgba(0, 0, 0, 0.04)',
               },
             },
           },
         },
         MuiChip: {
           styleOverrides: {
             root: {
               fontWeight: 600,
               fontSize: '0.813rem',
               borderRadius: '10px',
               padding: '4px 8px',
             },
             filled: {
               '&.MuiChip-colorWarning': {
                 background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                 color: 'white',
                 fontWeight: 700,
               },
               '&.MuiChip-colorSuccess': {
                 background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                 color: 'white',
                 fontWeight: 700,
               },
               '&.MuiChip-colorPrimary': {
                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                 color: 'white',
                 fontWeight: 700,
               },
             },
           },
         },
         MuiCard: {
           styleOverrides: {
             root: {
               borderRadius: '12px',
               border: '1px solid #e5e7eb',
               boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.04)',
               transition: 'all 0.2s ease-in-out',
             },
           },
         },
         MuiPaper: {
           styleOverrides: {
             root: {
               borderRadius: '8px',
             },
             elevation1: {
               boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06), 0px 1px 2px rgba(0, 0, 0, 0.04)',
             },
           },
         },
         MuiTableCell: {
           styleOverrides: {
             root: {
               borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
               padding: '16px 20px',
               fontSize: '0.938rem',
             },
             head: {
               backgroundColor: 'rgba(102, 126, 234, 0.08)',
               color: '#667eea',
               fontWeight: 700,
               fontSize: '0.75rem',
               textTransform: 'uppercase',
               letterSpacing: '0.1em',
               borderBottom: '2px solid rgba(102, 126, 234, 0.2)',
             },
           },
         },
         MuiTableRow: {
           styleOverrides: {
             root: {
               transition: 'all 0.2s ease-in-out',
               '&:hover': {
                 backgroundColor: 'rgba(102, 126, 234, 0.04)',
                 transform: 'scale(1.005)',
               },
               '&:last-child td': {
                 borderBottom: 0,
               },
             },
           },
         },
         MuiTab: {
           styleOverrides: {
             root: {
               textTransform: 'none',
               fontWeight: 500,
               fontSize: '0.938rem',
               minHeight: '48px',
               '&.Mui-selected': {
                 fontWeight: 600,
               },
             },
           },
         },
         MuiTabs: {
           styleOverrides: {
             indicator: {
               height: '3px',
               borderRadius: '3px 3px 0 0',
             },
           },
         },
         MuiAvatar: {
           styleOverrides: {
             root: {
               fontWeight: 600,
             },
           },
         },
       },
     });

     export default theme;
     