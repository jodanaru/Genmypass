# Configuración de Dropbox OAuth para Genmypass

Esta guía documenta los pasos necesarios para configurar la autenticación OAuth 2.0 con Dropbox en el proyecto Genmypass, para permitir guardar y sincronizar la bóveda en la nube.

## Requisitos previos

- Cuenta de Dropbox
- Acceso a [Dropbox App Console](https://www.dropbox.com/developers/apps)

## 1. Crear una aplicación en Dropbox

1. Accede a [www.dropbox.com/developers/apps](https://www.dropbox.com/developers/apps)
2. Haz clic en **"Create app"**
3. Elige **"Scoped access"** (acceso limitado por permisos)
4. Elige **"App folder"** — Dropbox creará una carpeta dedicada para la app (`/Apps/Genmypass` o el nombre que des a la app); el usuario solo ve esa carpeta, no todo su Dropbox
5. Asigna un **nombre** a la app, por ejemplo: `Genmypass`
6. Acepta los términos y haz clic en **"Create app"**

## 2. Configurar permisos (Scopes)

1. En el panel de la app, ve a la pestaña **"Permissions"**
2. Activa los siguientes permisos:

| Permiso | Scope | Descripción |
|---------|--------|-------------|
| **files.content.write** | Lectura y escritura | Necesario para subir y actualizar el archivo de la bóveda |
| **files.content.read** | Lectura y escritura | Necesario para descargar el archivo de la bóveda |
| **account_info.read** | Solo lectura | Identificar la cuenta (email, nombre) |

3. Haz clic en **"Submit"** para guardar los cambios si se solicita.

> **¿Por qué App folder?**  
> La app solo puede leer y escribir dentro de la carpeta `/Apps/<Nombre de tu app>`. El usuario no ve archivos sueltos en su raíz de Dropbox y el alcance queda acotado a lo que necesita Genmypass.

## 3. Configurar URIs de redirección

1. Ve a la pestaña **"Settings"** de la app
2. En **"OAuth 2"** → **"Redirect URIs"**, haz clic en **"Add"**
3. Añade las URIs que usará la aplicación:

   **Desarrollo:**
   ```
   http://localhost:5173/auth/callback
   ```

   **Producción** (sustituye por tu dominio):
   ```
   https://tu-dominio.com/auth/callback
   ```

4. Guarda los cambios (**"Add"** / **"Save"** según la interfaz).

> La ruta `/auth/callback` es la que usa el frontend de Genmypass; debe coincidir exactamente con la configurada en la app.

## 4. Obtener credenciales

En la pestaña **"Settings"** de la app verás:

- **App key** — Es el identificador público (equivalente a *Client ID*). Se usa en el frontend mediante variable de entorno.
- **App secret** — Es confidencial. **No** debe estar en el frontend; solo en el Cloudflare Worker (proxy OAuth). Ver [CLOUDFLARE_WORKER_SETUP.md](CLOUDFLARE_WORKER_SETUP.md#6-configurar-secrets).

### Configuración en el proyecto

Crea o actualiza el archivo `.env` en la raíz del proyecto (frontend):

```env
# Dropbox OAuth (SPA, PKCE)
# App key — público; App secret solo en el Worker
VITE_DROPBOX_CLIENT_ID=tu-app-key
```

Opcional, si usas un proxy OAuth en desarrollo:

```env
# URL del proxy OAuth (desarrollo: http://localhost:8787)
VITE_OAUTH_PROXY_URL=http://localhost:8787
```

> ⚠️ **Importante**
> - No subas `.env` al repositorio (debe estar en `.gitignore`).
> - El **App secret** no se pone en el frontend. Se configura como secret en el Worker: `DROPBOX_CLIENT_ID` (App key) y `DROPBOX_CLIENT_SECRET` (App secret).

## 5. Flujo OAuth en Genmypass

El frontend usa OAuth 2.0 con **PKCE**:

1. El usuario elige “Conectar Dropbox” en el onboarding o ajustes.
2. Se redirige a `https://www.dropbox.com/oauth2/authorize` con `client_id`, `redirect_uri`, `code_challenge`, `scope`, etc.
3. El usuario autoriza la app en Dropbox y es redirigido a `https://tu-origen/auth/callback?code=...&state=...`.
4. El frontend envía `code` y `code_verifier` al **Cloudflare Worker** (`POST /api/auth/dropbox/token`).
5. El Worker, con el App secret, intercambia el code por tokens con Dropbox y devuelve `access_token` y `refresh_token` al cliente.
6. Genmypass guarda los tokens de forma segura (por ejemplo en memoria/cifrado) y usa la API de Dropbox para leer/escribir el archivo de la bóveda.

El intercambio de código por tokens y el refresh se hacen siempre a través del Worker para no exponer el App secret. Ver [CLOUDFLARE_WORKER_SETUP.md](CLOUDFLARE_WORKER_SETUP.md).

## 6. Verificación de la configuración

### Checklist

- [ ] App creada en Dropbox (Scoped access, App folder)
- [ ] Permisos activados: `files.content.read`, `files.content.write`, `account_info.read`
- [ ] Redirect URIs configuradas: `http://localhost:5173/auth/callback` y la URL de producción
- [ ] `VITE_DROPBOX_CLIENT_ID` en `.env` del frontend
- [ ] App secret configurado solo en el Worker (`DROPBOX_CLIENT_ID` y `DROPBOX_CLIENT_SECRET` en Cloudflare)
- [ ] Prueba de flujo completo: conectar Dropbox desde la app y comprobar que se crea la carpeta en Dropbox

## Recursos adicionales

- [Dropbox OAuth 2.0](https://www.dropbox.com/developers/documentation/http/documentation#oauth2-authorize)
- [Dropbox PKCE](https://www.dropbox.com/developers/documentation/http/documentation#authorization)
- [Scopes de Dropbox](https://www.dropbox.com/developers/documentation/http/documentation#authorization)
- [CLOUDFLARE_WORKER_SETUP.md](CLOUDFLARE_WORKER_SETUP.md) — Configuración del proxy OAuth (Google y Dropbox)

---

*Última actualización: Febrero 2026*
