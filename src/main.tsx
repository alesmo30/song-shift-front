import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import { App } from './App'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store/store'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { totifyTheme } from './theme/theme'
import { injectStore } from './api/client'

// Inyectamos el store al cliente de Axios para evitar dependencias circulares
injectStore(store)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* injectFirst: los estilos de MUI se inyectan primero para que global.css
            y los CSS Modules del layout sigan ganando la cascada. Sin CssBaseline. */}
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={totifyTheme}>
            <App />
          </ThemeProvider>
        </StyledEngineProvider>
      </PersistGate>
    </Provider>
  </StrictMode>,
)
