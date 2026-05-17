// import Keycloak from "keycloak-js";
// import type { KeycloakConfig } from "keycloak-js";

// const keycloakConfig: KeycloakConfig = {
//   url: import.meta.env.VITE.VITE_KEYCLOAK_URL || "http://localhost:8080",
//   realm: import.meta.env.VITE.VITE_KEYCLOAK_REALM || "tarefas",
//   clientId: import.meta.env.VITE.VITE_KEYCLOAK_CLIENT_ID || "tarefas-web",
// };

// export const keycloak = new Keycloak(keycloakConfig);
import Keycloak from "keycloak-js";
import type { KeycloakConfig } from "keycloak-js";

const keycloakConfig: KeycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "tarefas",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "tarefas-web",
};

export const keycloak = new Keycloak(keycloakConfig);
