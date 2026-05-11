import { KeycloakError, KeycloakTokenParsed } from "keycloak-js";
import { createContext, useEffect, useMemo, useState } from "react";
import { keycloak } from "../utils/keycloak";

interface iAuthProvider {
  children: React.ReactNode;
}

interface AppTokenParsed extends KeycloakTokenParsed {
  email?: string;
  name?: string;
  preferred_username?: string;
}

interface AuthState {
  ready: boolean;
  authenticated: boolean;
  error: KeycloakError | Error | null;
}

export interface iAuthContext extends AuthState {
  token?: string;
  profile?: AppTokenParsed;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext({} as iAuthContext);

function AuthProvider({ children }: iAuthProvider) {
  const [authState, setAuthState] = useState<AuthState>({
    ready: false,
    authenticated: false,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        if (!mounted) return;
        setAuthState({ ready: true, authenticated, error: null });
      })
      .catch((error: KeycloakError) => {
        if (!mounted) return;
        setAuthState({ ready: true, authenticated: false, error });
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authState.authenticated) return undefined;

    const interval = window.setInterval(() => {
      keycloak.updateToken(60).catch(() => keycloak.login());
    }, 3000);
  }, [authState.authenticated]);

  const value = useMemo(
    () => ({
      ...authState,
      token: keycloak.token,
      profile: keycloak.tokenParsed as AppTokenParsed | undefined,
      login: () => keycloak.login(),
      logout: () =>
        keycloak.logout({
          redirectUri: window.location.origin,
        }),
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider };
