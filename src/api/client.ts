import axios from 'axios';
import type { RootState } from '../store/store';
import { clearUser } from '../store/features/userSlice';

// Referencia al store inyectado
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any; 

// Función que llamaremos desde main.tsx para inyectar el store
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const injectStore = (_store: any) => {
  store = _store;
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  // CRÍTICO: Necesario para que el navegador envíe y reciba la cookie HttpOnly del Refresh Token
  withCredentials: true, 
});

// Interceptor de Petición (Request)
apiClient.interceptors.request.use((config) => {
  if (store) {
    const state = store.getState() as RootState;
    const token = state.user?.token; 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor de Respuesta (Response)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si recibimos un 401 y la petición NO fue a /login ni a /renew-tokens
    const isAuthEndpoint = originalRequest.url?.includes('/login') || originalRequest.url?.includes('/renew-tokens');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Hacemos la petición para renovar tokens.
        // NOTA: No enviamos body porque el Refresh Token viaja en la cookie gracias a withCredentials
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/renew-tokens`, 
          {},
          { withCredentials: true } 
        );

        // Si es exitoso, actualizamos el Redux Store con el nuevo token
        if (store) {
          // Despachamos solo una actualización parcial si es posible, o usamos el state actual
          const state = store.getState() as RootState;
          store.dispatch({
            type: 'user/setUser',
            payload: {
              ...state.user,
              token: data.accessToken
            }
          });
        }

        // Actualizamos el header de la petición original con el nuevo token y reintentamos
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Si falló el renew-tokens (ej: el refresh token expiró de verdad)
        // Limpiamos el store (cerrando sesión)
        if (store) {
          store.dispatch(clearUser());
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
