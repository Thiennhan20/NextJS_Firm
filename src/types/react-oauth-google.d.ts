declare module '@react-oauth/google' {
  import * as React from 'react';

  export interface GoogleOAuthProviderProps {
    clientId: string;
    children?: React.ReactNode;
  }
  export const GoogleOAuthProvider: React.FC<GoogleOAuthProviderProps>;

  export interface CredentialResponse {
    credential: string;
  }

  export interface GoogleLoginProps {
    onSuccess: (credentialResponse: CredentialResponse) => void;
    onError?: () => void;
    theme?: string;
    shape?: string;
    width?: number | string;
    locale?: string;
    useOneTap?: boolean;
  }
  export const GoogleLogin: React.FC<GoogleLoginProps>;
}



