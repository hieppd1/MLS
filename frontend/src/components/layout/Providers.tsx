"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "@/lib/store";
import { hydrateAuth } from "@/lib/features/auth/authSlice";

function AuthRestorer() {
  useEffect(() => {
    store.dispatch(hydrateAuth());
  }, []);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Provider store={store}>
        <AuthRestorer />
        {children}
      </Provider>
    </GoogleOAuthProvider>
  );
}
