import { createSlice } from "@reduxjs/toolkit";



export const userSlice = createSlice({
    name: 'user',
    initialState: {
        name: '',
        email: '',
        isSpotifyConnected: false,
    },
    reducers: {
        setUser: (state, action) => {
            const { payload: { name, email, isSpotifyConnected } } = action;
            state.name = name;
            state.email = email;
            state.isSpotifyConnected = isSpotifyConnected;
        },
        clearUser: (state) => {
            state.name = '';
            state.email = '';
            state.isSpotifyConnected = false;
        },
    },
})

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
