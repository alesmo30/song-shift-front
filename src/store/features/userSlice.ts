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
        clearUser: () => initialState,
    },
})

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
