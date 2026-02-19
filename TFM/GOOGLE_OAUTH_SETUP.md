# Configuración de Google OAuth para Genmypass

Esta guía documenta los pasos necesarios para configurar la autenticación OAuth 2.0 con Google Drive en el proyecto Genmypass.

## Requisitos previos

- Cuenta de Google
- Acceso a [Google Cloud Console](https://console.cloud.google.com)

## 1. Crear proyecto en Google Cloud Console

1. Accede a [console.cloud.google.com](https://console.cloud.google.com)
2. En la barra superior, haz clic en el selector de proyectos
3. Selecciona **"Nuevo proyecto"**
4. Configura:
   - **Nombre del proyecto**: `Genmypass`
   - **Organización**: (opcional)
5. Haz clic en **"Crear"**

## 2. Habilitar la API de Google Drive

1. En el menú lateral, ve a **APIs y servicios** → **Biblioteca**
2. Busca "Google Drive API"
3. Selecciona **Google Drive API**
4. Haz clic en **"Habilitar"**

## 3. Configurar Google Auth Platform

### 3.1 Información de la marca

1. Ve a **Google Auth Platform** → **Información de la marca**
2. Completa los campos:
   - **Nombre de la aplicación**: `Genmypass`
   - **Correo de asistencia al usuario**: tu email
   - **Logo de la aplicación**: (opcional)
3. Guarda los cambios

### 3.2 Configurar público

1. Ve a **Google Auth Platform** → **Público**
2. Selecciona **"Externo"** para permitir cualquier cuenta de Google
3. Guarda los cambios

> **Nota**: En modo "Testing", solo los usuarios añadidos como testers podrán usar la aplicación. Para producción, se requiere verificación de Google.

### 3.3 Configurar acceso a los datos (Scopes)

1. Ve a **Google Auth Platform** → **Acceso a los datos**
2. Haz clic en **"Agregar o quitar permisos"**
3. Busca y selecciona el siguiente permiso:

| API | Alcance | Descripción |
|-----|---------|-------------|
| Google Drive API | `https://www.googleapis.com/auth/drive.appdata` | Ver, crear y borrar sus propios datos de configuración en tu unidad de Google Drive |

4. Haz clic en **"Actualizar"**
5. Haz clic en **"Save"** para guardar los cambios

> **¿Por qué `drive.appdata`?**
> - Crea una carpeta oculta específica de la aplicación
> - El usuario no ve los archivos en su Drive
> - Solo Genmypass puede acceder a esos datos
> - Es un permiso "no sensible" (no requiere verificación de Google)

## 4. Crear credenciales OAuth 2.0

1. Ve a **Google Auth Platform** → **Clientes**
2. Haz clic en **"Crear cliente de OAuth"**
3. Selecciona **"Aplicación web"**
4. Configura:
   - **Nombre**: `Genmypass Web Client`

5. **Orígenes de JavaScript autorizados**:
   ```
   http://localhost:5173
   https://genmypass.app
   ```

6. **URIs de redirección autorizados**:
   ```
   http://localhost:5173/auth/google/callback
   https://genmypass.app/auth/google/callback
   ```

7. Haz clic en **"Crear"**

## 5. Obtener y configurar credenciales

Tras crear el cliente, obtendrás:

- **Client ID**: `xxxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxx`

### Configuración en el proyecto

Crea o actualiza el archivo `.env` en la raíz del proyecto:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

> ⚠️ **Importante**: 
> - Nunca subas el archivo `.env` al repositorio
> - El Client Secret no se usa en el cliente (SPA) cuando se implementa OAuth con PKCE
> - Asegúrate de que `.env` está en `.gitignore`

## 6. Añadir usuarios de prueba (Modo Testing)

Mientras la aplicación está en modo "Testing":

1. Ve a **Google Auth Platform** → **Público**
2. En la sección de usuarios de prueba, añade los emails de los testers
3. Solo estos usuarios podrán autorizar la aplicación

## 7. Verificación de la configuración

### Checklist

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google Drive API habilitada
- [ ] Información de la marca configurada
- [ ] Público configurado como "Externo"
- [ ] Scope `drive.appdata` añadido
- [ ] Cliente OAuth creado con URIs correctas
- [ ] Variables de entorno configuradas
- [ ] Usuarios de prueba añadidos (si aplica)

## Recursos adicionales

- [Documentación de Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth 2.0 para aplicaciones web del lado del cliente](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Implementación de PKCE](https://developers.google.com/identity/protocols/oauth2/native-app#pkce-flow)
- [Scopes de Google Drive](https://developers.google.com/drive/api/guides/api-specific-auth)

---

*Última actualización: Enero 2026*
