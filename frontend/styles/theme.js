// frontend/src/styles/theme.js
import { createTheme } from '@mui/material/styles';

// 颜色调色板
const colors = {
    primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff'
    },
    secondary: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
        contrastText: '#ffffff'
    },
    success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
        contrastText: '#ffffff'
    },
    error: {
        main: '#d32f2f',
        light: '#ef5350',
        dark: '#c62828',
        contrastText: '#ffffff'
    },
    warning: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
        contrastText: '#ffffff'
    },
    info: {
        main: '#0288d1',
        light: '#03a9f4',
        dark: '#01579b',
        contrastText: '#ffffff'
    },
    grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121'
    }
};

// 字体
const typography = {
    fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif'
    ].join(','),
    h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2
    },
    h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3
    },
    h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3
    },
    h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4
    },
    h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4
    },
    h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5
    },
    subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5
    },
    subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5
    },
    body1: {
        fontSize: '1rem',
        lineHeight: 1.6
    },
    body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6
    },
    caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5
    },
    overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    }
};

// 间距
const spacing = 8;

// 圆角
const shape = {
    borderRadius: 8
};

// 阴影
const shadows = [
    'none',
    '0 1px 3px rgba(0,0,0,0.08)',
    '0 2px 6px rgba(0,0,0,0.08)',
    '0 4px 12px rgba(0,0,0,0.08)',
    '0 6px 20px rgba(0,0,0,0.08)',
    '0 8px 32px rgba(0,0,0,0.08)',
    '0 10px 40px rgba(0,0,0,0.10)',
    '0 12px 48px rgba(0,0,0,0.10)',
    '0 14px 56px rgba(0,0,0,0.10)',
    '0 16px 64px rgba(0,0,0,0.12)',
    '0 18px 72px rgba(0,0,0,0.12)',
    '0 20px 80px rgba(0,0,0,0.12)',
    '0 22px 88px rgba(0,0,0,0.12)',
    '0 24px 96px rgba(0,0,0,0.12)',
    '0 26px 104px rgba(0,0,0,0.12)',
    '0 28px 112px rgba(0,0,0,0.12)',
    '0 30px 120px rgba(0,0,0,0.12)',
    '0 32px 128px rgba(0,0,0,0.12)',
    '0 34px 136px rgba(0,0,0,0.12)',
    '0 36px 144px rgba(0,0,0,0.12)',
    '0 38px 152px rgba(0,0,0,0.12)',
    '0 40px 160px rgba(0,0,0,0.12)',
    '0 42px 168px rgba(0,0,0,0.12)',
    '0 44px 176px rgba(0,0,0,0.12)',
    '0 46px 184px rgba(0,0,0,0.12)'
];

// 创建主题
export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        grey: colors.grey,
        background: {
            default: '#f8f9fc',
            paper: '#ffffff'
        },
        text: {
            primary: '#1a1a2e',
            secondary: '#4a4a6a',
            disabled: '#8888aa'
        }
    },
    typography,
    spacing,
    shape,
    shadows,
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920
        }
    },
    components: {
        // MuiButton
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '8px 20px',
                    transition: 'all 0.2s ease'
                },
                contained: {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    '&:hover': {
                        boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
                        transform: 'translateY(-1px)'
                    }
                },
                outlined: {
                    borderWidth: 2,
                    '&:hover': {
                        borderWidth: 2
                    }
                }
            }
        },
        // MuiCard
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease'
                }
            }
        },
        // MuiPaper
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundImage: 'none'
                }
            }
        },
        // MuiTableCell
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    color: '#4a4a6a',
                    backgroundColor: '#fafafa'
                }
            }
        },
        // MuiChip
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    fontWeight: 500
                }
            }
        },
        // MuiDialog
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    boxShadow: '0 20px 80px rgba(0,0,0,0.15)'
                }
            }
        },
        // MuiAppBar
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    backgroundColor: '#ffffff',
                    color: '#1a1a2e'
                }
            }
        },
        // MuiDrawer
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1a1a2e',
                    color: '#ffffff',
                    borderRight: 'none'
                }
            }
        },
        // MuiListItemButton
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '4px 8px',
                    '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)'
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(25,118,210,0.2)',
                        '&:hover': {
                            backgroundColor: 'rgba(25,118,210,0.3)'
                        }
                    }
                }
            }
        },
        // MuiListItemIcon
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: 'rgba(255,255,255,0.6)',
                    minWidth: 40
                }
            }
        },
        // MuiListItemText
        MuiListItemText: {
            styleOverrides: {
                primary: {
                    color: '#ffffff',
                    fontWeight: 500
                }
            }
        },
        // MuiLinearProgress
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    height: 8
                },
                bar: {
                    borderRadius: 4
                }
            }
        },
        // MuiTab
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem'
                }
            }
        },
        // MuiTabs
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                }
            }
        }
    }
});

// 暗色主题（可选）
export const darkTheme = createTheme({
    ...theme,
    palette: {
        mode: 'dark',
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        grey: colors.grey,
        background: {
            default: '#121212',
            paper: '#1e1e2e'
        },
        text: {
            primary: '#e8e8f0',
            secondary: '#a0a0b8',
            disabled: '#666680'
        }
    },
    components: {
        ...theme.components,
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1e1e2e',
                    color: '#e8e8f0'
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#161625'
                }
            }
        }
    }
});

export default theme;