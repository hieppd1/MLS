import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  preferredLocale?: string;
}

interface AuthState {
  accessToken: string | null;
  user: UserInfo | null;
  tenantSlug: string;
  /** true once localStorage has been read on the client */
  isHydrated: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  tenantSlug: "demo", // restored properly in AuthRestorer useEffect
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user: UserInfo }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isHydrated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    },
    hydrateAuth(state) {
      // Called once on client mount to restore from localStorage
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("accessToken");
      const userStr = localStorage.getItem("user");
      const tenant = localStorage.getItem("tenantSlug") ?? "demo";
      state.tenantSlug = tenant;
      if (token && userStr) {
        try {
          state.accessToken = token;
          state.user = JSON.parse(userStr) as UserInfo;
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      }
      state.isHydrated = true;
    },
    setTenantSlug(state, action: PayloadAction<string>) {
      state.tenantSlug = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("tenantSlug", action.payload);
      }
    },
  },
});

export const { setCredentials, clearCredentials, hydrateAuth, setTenantSlug } =
  authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.user !== null;
export const selectCurrentUser     = (state: { auth: AuthState }) => state.auth.user;
export const selectAccessToken     = (state: { auth: AuthState }) => state.auth.accessToken;
