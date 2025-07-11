import { configureStore } from "@reduxjs/toolkit";

import RootReducer from "./RootReducer";

const preloadedState = {};

export const store = configureStore({
    reducer: RootReducer,
    // !!! enable this?
    // devTools: import.meta.env.PROD !== true,
    devTools: import.meta.env.PROD !== true,
    preloadedState,
    // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(),
    // middleware: (getDefaultMiddleware) =>
    //   getDefaultMiddleware().concat(thunkMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
