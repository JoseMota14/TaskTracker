# ⚡ TaskFlow — Guia de Setup

## Estrutura do projeto

```
project/
├── docker-compose.yml          # Keycloak via Docker
├── keycloak/
│   └── realm-export.json       # Realm pré-configurado (auto-importado)
├── html-version/
│   └── index.html              # App HTML com Keycloak.js
└── react-version/              # App React + Vite
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── keycloak.js         # Instância singleton do Keycloak
        ├── KeycloakProvider.jsx # Context + hook useKeycloak()
        └── App.jsx             # UI completa
```

---

## Passo 1 — Subir o Keycloak

```bash
# Na raiz do projeto
docker compose up -d
```

Aguarda ~30 segundos e acede a:

- **Keycloak Admin:** http://localhost:8080
  - Utilizador: `admin` / Password: `admin`
- O realm `task-app` e o utilizador demo são criados automaticamente.

> **Utilizador demo:** `demo` / Password: `demo123`

---

## Passo 2 — Testar a versão HTML

Abre o ficheiro `html-version/index.html` diretamente no browser
(ou usa um servidor local como o Live Server do VS Code).

**Nota:** O browser tem de conseguir aceder a `http://localhost:8080`.

---

## Passo 3 — Correr a versão React

```bash
cd react-version
npm install
npm run dev
```

Acede a **http://localhost:5173** — serás redirecionado para o Keycloak automaticamente.

---

## Como funciona a autenticação

### Fluxo

```
Browser → Keycloak (login) → Redirect com code → App troca code por token → Acesso
```

### Ficheiros chave

| Ficheiro               | Responsabilidade                                          |
| ---------------------- | --------------------------------------------------------- |
| `keycloak.js`          | Instância singleton do cliente Keycloak                   |
| `KeycloakProvider.jsx` | Inicializa, gere estado e expõe `useKeycloak()`           |
| `App.jsx`              | Consome `useKeycloak()` para obter `user`, `logout`, etc. |

### Hook `useKeycloak()`

```jsx
const { loading, authenticated, user, logout } = useKeycloak();

// user = { name, username, email, initials }
```

---

## Configuração do Keycloak (manual, se necessário)

Se quiseres criar o realm manualmente em vez de importar:

1. Acede a http://localhost:8080 → Admin Console
2. Cria um novo **Realm** → nome: `task-app`
3. Cria um **Client**:
   - Client ID: `task-app-client`
   - Client type: Public
   - Valid redirect URIs: `http://localhost:5173/*`
   - Web origins: `http://localhost:5173`
4. Cria um **User** de teste com password definida

---

## Variáveis de ambiente (produção)

Cria um ficheiro `.env` na raiz do `react-version/`:

```env
VITE_KEYCLOAK_URL=https://auth.teudominio.com
VITE_KEYCLOAK_REALM=task-app
VITE_KEYCLOAK_CLIENT=task-app-client
```

E atualiza `keycloak.js`:

```js
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT,
});
```
