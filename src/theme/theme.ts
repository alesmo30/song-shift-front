import { createTheme } from '@mui/material/styles';

/**
 * Theme Totify.
 *
 * Regla: los tokens viven en `src/styles/global.css`. Aquí solo se referencian
 * con `var(--*)`. Las únicas excepciones son los valores de `palette`, porque MUI
 * hace cálculos de color sobre ellos (contrastText, light/dark) y no puede operar
 * sobre una CSS custom property; esos literales replican los tokens equivalentes.
 */
export const totifyTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FF2D55', contrastText: '#ffffff' }, // --color-brand-start
    success: { main: '#1DB954', contrastText: '#000000' }, // --color-spotify
    warning: { main: '#FBBF24', contrastText: '#000000' }, // --color-warning
    error: { main: '#F87171', contrastText: '#000000' }, // --color-error
    background: { default: '#07070F', paper: '#0D0D16' }, // --color-bg
    text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.55)' },
  },

  shape: { borderRadius: 11 }, // --radius-input

  typography: {
    fontFamily: 'var(--font-body)',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    button: { textTransform: 'none' },
  },

  components: {
    /* ---- Button: replica .t-btn-primary / .t-btn-secondary ---- */
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableElevation: true,
        disableFocusRipple: true,
      },
      styleOverrides: {
        // El root queda neutro a propósito: los botones de los paneles conservan
        // su CSS Module y no deben heredar padding/minWidth de MUI.
        root: {
          fontFamily: 'var(--font-body)',
          textTransform: 'none',
          letterSpacing: 'normal',
          lineHeight: 'normal',
          minWidth: 0,
          padding: 0,
        },
        contained: {
          background: 'var(--gradient-brand-cta)',
          border: 'none',
          borderRadius: 'var(--radius-input)',
          padding: '15px',
          color: '#fff',
          fontSize: 'var(--fs-body-lg)',
          fontWeight: 'var(--fw-semibold)',
          boxShadow: 'var(--shadow-brand-cta)',
          transition: 'filter var(--transition-fast)',
          '&:hover': {
            background: 'var(--gradient-brand-cta)',
            boxShadow: 'var(--shadow-brand-cta)',
            filter: 'brightness(1.06)',
          },
          // El scaffold no atenuaba el botón deshabilitado (estado "Signing In...").
          '&.Mui-disabled': {
            background: 'var(--gradient-brand-cta)',
            boxShadow: 'var(--shadow-brand-cta)',
            color: '#fff',
          },
        },
        outlined: {
          background: 'var(--color-chip-bg)',
          border: '1px solid var(--color-chip-border)',
          borderRadius: 'var(--radius-xs)',
          padding: '7px var(--space-8)',
          color: 'var(--color-text-muted-1)',
          fontSize: 'var(--fs-caption)',
          fontWeight: 'var(--fw-medium)',
          '&:hover': {
            background: 'var(--color-chip-bg)',
            border: '1px solid var(--color-chip-border)',
          },
        },
        // Los botones con CSS Module propio usan variant="text": sin estilo de MUI.
        text: { color: 'inherit', background: 'none' },
      },
    },

    MuiIconButton: {
      defaultProps: { disableRipple: true, disableFocusRipple: true },
      styleOverrides: {
        root: { padding: 0, borderRadius: 'var(--radius-xs)', color: 'inherit' },
      },
    },

    /* ---- Formularios: label externo .t-label + input .t-input ---- */
    MuiTextField: {
      defaultProps: { fullWidth: true, variant: 'outlined' },
    },
    MuiInputLabel: {
      defaultProps: { shrink: true, disableAnimation: true },
      styleOverrides: {
        root: {
          position: 'static',
          transform: 'none',
          maxWidth: '100%',
          marginBottom: 'var(--space-3)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-micro)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--color-label)',
          letterSpacing: 'var(--tracking-label)',
          textTransform: 'uppercase',
          '&.Mui-focused, &.Mui-error, &.Mui-disabled': { color: 'var(--color-label)' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: 'var(--color-input-bg)',
          borderRadius: 'var(--radius-input)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-body)',
          color: 'var(--color-text)',
          '& legend': { display: 'none' },
          '& .MuiOutlinedInput-notchedOutline': {
            top: 0,
            border: '1px solid var(--color-input-border)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline':
            { border: '1px solid var(--color-input-border)', borderWidth: '1px' },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            border: '1px solid var(--color-error)',
          },
        },
        input: {
          padding: '13px var(--space-7)',
          height: 'auto',
          '&::placeholder': { color: 'var(--color-text-muted-3)', opacity: 1 },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: { root: { display: 'flex' } },
    },
    // Replica .t-error-text (el scaffold usaba un `color: red` inline).
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          margin: 'var(--space-1) 0 0',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-caption)',
          '&.Mui-error': { color: 'var(--color-error)' },
        },
      },
    },

    /* ---- Card: replica .t-card ---- */
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'var(--color-card)',
          border: '1px solid var(--color-card-border)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'var(--blur-card)',
          backgroundImage: 'none',
          color: 'var(--color-text)',
        },
      },
    },

    /* ---- Tabs: track segmentado, no indicador subrayado ---- */
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 0,
          background: 'var(--color-track)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-1)',
        },
        list: { gap: 'var(--space-1)' },
        indicator: { display: 'none' },
      },
    },
    MuiTab: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          maxWidth: 'none',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-xxs)',
          color: 'var(--color-text-muted-1)',
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          fontWeight: 'var(--fw-medium)',
          textTransform: 'none',
          letterSpacing: 'normal',
          lineHeight: 'normal',
          transition: 'all var(--transition-fast)',
          '&.MuiTab-labelIcon': {
            flexDirection: 'row',
            gap: 'var(--space-2)',
            minHeight: 0,
          },
          '& .MuiTab-icon': { margin: 0 },
          '&.Mui-selected': {
            background: 'var(--color-input-bg)',
            color: 'var(--color-text)',
          },
        },
      },
    },

    /* ---- Chip: base de StatusPill ---- */
    MuiChip: {
      styleOverrides: {
        root: {
          height: 'auto',
          padding: 0,
          borderRadius: 'var(--radius-xxs)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--fs-micro)',
          fontWeight: 'var(--fw-semibold)',
          whiteSpace: 'nowrap',
          '& .MuiChip-label': { padding: 'var(--space-1) var(--space-4)' },
        },
      },
    },

    /* ---- ListItem: base de SongRow ---- */
    MuiListItem: {
      defaultProps: { disableGutters: true },
      styleOverrides: { root: { padding: 0, width: 'auto' } },
    },
    MuiListItemText: {
      styleOverrides: { root: { margin: 0, minWidth: 0 } },
    },
  },
});
