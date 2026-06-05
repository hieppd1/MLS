import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import Cookies from "js-cookie";
import type { RootState } from "./store";
import { setCredentials, clearCredentials } from "./features/auth/authSlice";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5009";

export const rawBaseQuery = (baseUrl: string) =>
  fetchBaseQuery({
    baseUrl,
    prepareHeaders(headers, { getState }) {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const tenant = state.auth.tenantSlug;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (tenant) headers.set("X-Tenant-Slug", tenant);
      // Send locale so backend returns error messages in the right language
      const locale = Cookies.get("NEXT_LOCALE") ?? "vi";
      headers.set("Accept-Language", locale);
      return headers;
    },
  });

/**
 * Module-level mutex: all concurrent 401s share one refresh call.
 * Without this, multiple simultaneous requests each try to rotate the
 * single-use refresh token — only the first succeeds, the rest get 401
 * on the refresh itself, triggering a forced logout.
 */
let pendingRefresh: Promise<boolean> | null = null;

function doTokenRefresh(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: any,
  tenant: string
): Promise<boolean> {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async (): Promise<boolean> => {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Slug": tenant,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        Cookies.set("refreshToken", data.refreshToken, { expires: 30, sameSite: "strict" });
        api.dispatch(setCredentials({ accessToken: data.accessToken, user: data.user }));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
}

/**
 * Wraps any baseQuery with automatic JWT refresh on 401.
 * Uses a shared promise (mutex) so concurrent 401s share one refresh call.
 * On success: stores new tokens and retries the original request.
 * On failure: clears credentials and redirects to /login.
 */
export function withReauth(baseUrl: string): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> {
  const base = rawBaseQuery(baseUrl);

  return async (args, api, extraOptions) => {
    let result = await base(args, api, extraOptions);

    if (result.error?.status === 401) {
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        api.dispatch(clearCredentials());
        if (typeof window !== "undefined") window.location.href = "/login";
        return result;
      }

      const state = api.getState() as RootState;
      const tenant = state.auth.tenantSlug;

      const refreshed = await doTokenRefresh(api, tenant);

      if (refreshed) {
        // Retry original request — new token is now in Redux store
        result = await base(args, api, extraOptions);
      } else {
        Cookies.remove("refreshToken");
        api.dispatch(clearCredentials());
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }

    return result;
  };
}
