import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { useAppDispatch } from '../../store/hooks';
import { loadSpotifyStatus } from '../../store/spotifyStatus';
import { getSpotifyCallbackErrorMessage } from '../../store/features/spotifySlice';
import type { SpotifyCallbackReason } from '../../types/spotify';

const KNOWN_REASONS: SpotifyCallbackReason[] = [
  'access_denied',
  'invalid_state',
  'state_expired',
  'state_reused',
  'token_exchange_failed',
  'profile_fetch_failed',
  'user_not_allowlisted',
];

/**
 * Destino del redirect de GET /spotify/callback en el backend: siempre un
 * 302 a `{FRONTEND_URL}{redirectPath}?spotify=connected` o
 * `?spotify=error&reason=...`. Esta página solo re-consulta el estado y
 * limpia la URL con `navigate('/', { replace: true })` -- nunca se queda
 * aquí ni renderiza más que un spinner de paso.
 */
export function SpotifyCallback() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      if (searchParams.get('spotify') === 'error') {
        const reasonParam = searchParams.get('reason');
        const reason = KNOWN_REASONS.find((known) => known === reasonParam) ?? 'token_exchange_failed';
        // El mensaje viaja por router state, no por el slice: el propio
        // montaje de Landing dispara su fetch de estado y pisaría
        // cualquier error que se hubiera guardado ahí.
        navigate('/', { replace: true, state: { spotifyCallbackMessage: getSpotifyCallbackErrorMessage(reason) } });
        return;
      }

      await loadSpotifyStatus(dispatch);
      navigate('/', { replace: true });
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress data-testid="spotify-callback-spinner" />
    </div>
  );
}
