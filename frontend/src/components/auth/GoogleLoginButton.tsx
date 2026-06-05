"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useGoogleAuthMutation } from "@/lib/features/auth/authApi";
import { setCredentials } from "@/lib/features/auth/authSlice";
import { useAppDispatch } from "@/lib/hooks";

interface Props {
  onError?: (message: string) => void;
}

export default function GoogleLoginButton({ onError }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [googleAuth] = useGoogleAuthMutation();

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      onError?.("Google không trả về credential.");
      return;
    }
    try {
      const result = await googleAuth({ idToken: credentialResponse.credential }).unwrap();
      Cookies.set("refreshToken", result.refreshToken, { expires: 30, sameSite: "strict" });
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      router.push("/");
    } catch {
      onError?.("Đăng nhập Google thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => onError?.("Google login bị hủy hoặc thất bại.")}
      useOneTap={false}
      text="continue_with"
      shape="rectangular"
      width="100%"
    />
  );
}
