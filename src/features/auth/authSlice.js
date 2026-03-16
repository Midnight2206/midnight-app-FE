import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    clearCredentials(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
