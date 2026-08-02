import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
    persistReducer,
    persistStore,
    createMigrate,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import userReducer from './features/userSlice'

const rootReducer = combineReducers({
    user: userReducer,
})

const migrate = createMigrate({}, { debug: false })

const persistConfig = {
    key: 'totify',
    version: 0,
    storage,
    whitelist: ['user'],
    migrate,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
