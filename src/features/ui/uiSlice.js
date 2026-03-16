import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  banners: {
    emailVerifyDismissed: false,
    emailVerifyCooldownUntil: 0,
    emailVerifyLastRequestedAt: 0,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // banners
    dismissEmailVerify(state) {
      state.banners.emailVerifyDismissed = true;
    },
    showEmailVerify(state) {
      state.banners.emailVerifyDismissed = false;
    },
    setEmailVerifyRequestState(state, action) {
      const { cooldownUntil = 0, requestedAt = 0 } = action.payload || {};
      state.banners.emailVerifyCooldownUntil = Number(cooldownUntil) || 0;
      state.banners.emailVerifyLastRequestedAt = Number(requestedAt) || 0;
    },
  },
});

export const { dismissEmailVerify, showEmailVerify, setEmailVerifyRequestState } =
  uiSlice.actions;
export const selectEmailVerifyDismissed = (state) =>
  state.ui.banners.emailVerifyDismissed;

export default uiSlice.reducer;
