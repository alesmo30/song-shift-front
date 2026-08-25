import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
    name: string;
    email: string;
    isSpotifyConnected: boolean;
    token: string;
}

const initialState: UserState = {
    name: '',
    email: '',
    isSpotifyConnected: false,
    token: '',
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserState>) => {
            const { name, email, isSpotifyConnected, token } = action.payload;
            state.name = name;
            state.email = email;
            state.isSpotifyConnected = isSpotifyConnected;
            state.token = token;
        },
        // Único escritor de isSpotifyConnected fuera de setUser/clearUser.
        // Se despacha solo desde la carga/actualización del estado de Spotify
        // (ver src/store/features/spotifySlice.ts), nunca desde un componente.
        setSpotifyConnected: (state, action: PayloadAction<boolean>) => {
            state.isSpotifyConnected = action.payload;
        },
        clearUser: () => initialState,
    },
})

export const { setUser, setSpotifyConnected, clearUser } = userSlice.actions;
export default userSlice.reducer;
