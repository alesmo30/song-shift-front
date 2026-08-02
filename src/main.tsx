import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import { App } from './App'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { totifyTheme } from './theme/theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      {/* injectFirst: los estilos de MUI se inyectan primero para que global.css
          y los CSS Modules del layout sigan ganando la cascada. Sin CssBaseline. */}
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={totifyTheme}>
          <App />
        </ThemeProvider>
      </StyledEngineProvider>
    </Provider>
  </StrictMode>,
)
