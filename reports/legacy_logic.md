### Lógica legacy basada en `localStorage` (resumen)

- **StorageManager (`js/modules/storage.js`)**
  - Inicializa colecciones en `localStorage`: `USERS`, `TURNOS`, `MEDICOS`, `PACIENTES`, `NOTIFICACIONES` usando claves de `CONFIG.STORAGE`.
  - Crea datos de ejemplo:
    - Usuarios por defecto (admin, secretario, médico, paciente) con campos: `id`, `nombre`, `apellido`, `email`, `password`, `rol`, `medicoId`/`pacienteId`, `activo`, `fechaCreacion`.
    - Médicos con: `id`, `nombre`, `especialidad`, `matricula`, `horario`, `email`, `telefono`, `activo`, `disponibilidad` (por día con `inicio`/`fin`).
    - Pacientes con: `id`, `nombre`, `apellido`, `dni`, `telefono`, `email`, `fechaNacimiento`, `direccion`, `ultimaVisita`, `activo`.
  - Proporciona helpers genéricos: `get(key)`, `set(key, value)`, `remove(key)`, `clear()` sobre `localStorage`.

- **AuthManager (`js/modules/auth.js`)**
  - **Login**:
    - Lee usuarios desde `StorageManager.get(CONFIG.STORAGE.USERS)`.
    - Normaliza email (trim + lowercase) y compara con contraseña plana.
    - Valida `activo !== false`.
    - Guarda usuario actual (sin `password`) en `StorageManager.set(CONFIG.STORAGE.CURRENT_USER, userSafe)`.
  - **Logout**: borra `CURRENT_USER` del storage.
  - **Estado/roles**:
    - `getCurrentUser()`, `isAuthenticated()`, `hasPermission(permission)`, `hasRole(role)`, `canAccess(permission)` usando `CONFIG.PERMISSIONS`.
  - **Register**:
    - Valida unicidad de `email`.
    - Valida contraseña: mínimo 8 caracteres y coincidencia `password` / `confirmPassword`.
    - Crea nuevo usuario con `rol` (por defecto paciente) y lo persiste en `USERS`.
    - Si el rol es paciente, crea también registro en `PACIENTES` con datos básicos y lo guarda en `StorageManager`.

- **PacientesManager (`js/modules/pacientes.js`) – parte legacy**
  - **create(pacienteData)** (solo localStorage):
    - Carga pacientes desde `CONFIG.STORAGE.PACIENTES`.
    - Valida **DNI único**: si ya existe un paciente con el mismo `dni`, devuelve `{ success: false, message: 'Ya existe un paciente con este DNI' }`.
    - Construye objeto:
      - `id` generado con `Date.now()`.
      - Campos: `nombre`, `apellido`, `dni`, `telefono`, `email`, `fechaNacimiento`, `direccion`, `ultimaVisita`, `activo`, `fechaCreacion`.
    - Guarda en storage y retorna `{ success: true, paciente }`.
  - **update(id, updates)** (solo localStorage):
    - Busca paciente por `id` y, si cambia `dni`, vuelve a validar **DNI único**.
    - Actualiza campos y setea `fechaActualizacion`.
  - **delete(id)**:
    - Implementa **soft delete**: marca `activo = false`.
  - **updateUltimaVisita(id)**:
    - Actualiza `ultimaVisita` a la fecha actual (YYYY-MM-DD).
  - **Nota**: los métodos `getAll`, `getById`, `getHistorial` ya usan la API (`ApiClient`), mientras que `create/update/delete/updateUltimaVisita` aún dependen de `localStorage`.

- **MedicosManager (`js/modules/medicos.js`) – parte legacy**
  - **create(medicoData)** (solo localStorage):
    - Lee médicos desde `CONFIG.STORAGE.MEDICOS`.
    - Valida **matrícula única**; si se repite devuelve `{ success: false, message: 'Ya existe un médico con esta matrícula' }`.
    - Construye objeto con: `id`, `nombre`, `especialidad`, `matricula`, `horario`, `email`, `telefono`, `activo`, `disponibilidad`, `fechaCreacion`.
  - **update(id, updates)**:
    - Valida unicidad de matrícula si se cambia.
    - Actualiza campos y `fechaActualizacion`.
  - **delete(id)**:
    - Soft delete: marca `activo = false`.
  - **getDisponibilidad/getHorariosDisponibles** ya están basados en API (`ApiClient.getMedicoDisponibilidad / getMedicoHorariosDisponibles`), con fallback a `CONFIG.HORARIOS`.

- **UsuariosManager (`js/modules/usuarios.js`) – parte legacy**
  - Gestiona usuarios directamente en `CONFIG.STORAGE.USERS`:
    - `getAll(filters)`: filtra por `rol`, `activo`, búsqueda en `nombre`, `apellido`, `email` (sin exponer `password`).
    - `create(userData)`: valida **email único** y longitud mínima de contraseña; puede asociar `medicoId`/`pacienteId`.
    - `update(id, updates)`: valida email único si cambia y longitud de nueva contraseña si se envía.
    - `delete(id)`: soft delete (marca `activo = false`); **evita eliminar el último admin** activo.
    - `changePassword(id, oldPassword, newPassword)`: valida contraseña actual y nueva longitud mínima.

- **NotificationManager (`js/modules/notifications.js`) – parte legacy**
  - `saveNotification(userId, message, type)`:
    - Persiste notificaciones en `CONFIG.STORAGE.NOTIFICACIONES` con campos: `id`, `userId`, `message`, `type`, `read`, `fecha`.
  - `getUserNotifications(userId)`:
    - Filtra notificaciones no leídas (`read === false`) para el usuario.
  - A nivel UI, todas las notificaciones/toasts usan `NotificationManager.show/success/error/...` con un contenedor único `#notifications-container`.

- **Debug (`js/utils/debug.js`)**
  - Expone utilidades para inspeccionar y resetear el estado de `localStorage` (`checkStorage`, `reinitStorage`, `localStorage.removeItem` por cada clave de `CONFIG.STORAGE`).

### Qué lógica debe reutilizarse / migrarse a BD/API

- **Validaciones críticas a conservar (mover a backend + validar también en frontend):**
  - **Unicidad de DNI de paciente** → ya está parcialmente en el modelo `Paciente` a nivel DB (verificar), pero debe garantizarse en:
    - Endpoint `POST /api/paciente` y en registración (`POST /api/auth/register`).
  - **Unicidad de matrícula de médico** → validar en `Medico` (modelo PHP) y en `POST /api/medico`.
  - **Unicidad de email de usuario** → validar en `Usuario` (modelo PHP) y `POST /api/usuario` / `POST /api/auth/register`.
  - **Restricción “no eliminar último admin”** → mover la lógica a `Usuario`/`UsuarioController` para que se aplique también vía API.
  - **Reglas de contraseña** (longitud mínima 8, coincidencia confirmación) → ya están en `AuthController::register`, pero deben mantenerse alineadas con la validación frontend.

- **Estructura de objetos (deben coincidir DB ↔ frontend):**
  - Paciente: `id`, `nombre`, `apellido`, `dni`, `telefono`, `email`, `fechaNacimiento`, `direccion`, `ultimaVisita`, `activo`.
  - Médico: `id`, `nombre`, `especialidad`/`especialidades`, `matricula`, `horario`, `email`, `telefono`, `activo`, `disponibilidad`.
  - Usuario: `id`, `nombre`, `apellido`, `email`, `rol`, `medicoId`/`pacienteId`, `activo`, fechas de creación/actualización.
  - Turno (actualmente ya mapeado en `api/models/Turno.php`): `id`, `pacienteId`, `medicoId`, `fecha`, `hora`, `motivo`, `notas`, `estado` (`estadoCodigo`), fechas y metadatos.

- **Lógica de negocio a migrar a endpoints/servicios API (en lugar de `localStorage`):**
  - **Creación/edición de pacientes** desde los modales (`ModalManager.openPacienteModal/savePaciente`):
    - Deben usar `ApiClient` (`POST/PUT /api/paciente`) en lugar de `PacientesManager.create/update` basados en `localStorage`.
  - **Creación/edición de médicos** (`ModalManager.saveMedico`):
    - Debe usar `ApiClient` (`POST/PUT /api/medico`) en lugar de `MedicosManager.create/update` legacy.
  - **Gestión de usuarios** (`ModalManager.saveUsuario`):
    - Debe apoyarse en los endpoints `UsuarioController` (`/api/usuario`) en lugar de `UsuariosManager` legacy.
  - **Notificaciones persistentes**:
    - Hoy existen endpoints `NotificacionController`; la lógica de `NotificationManager.saveNotification/getUserNotifications` debería migrarse a esos endpoints para mantener consistencia con la BD.

- **Autenticación y sesión:**
  - La autenticación efectiva ya está en backend (`AuthController`, sesiones PHP) y el frontend usa `ApiClient.login/register`.
  - **Compatibilidad legacy**: se sigue guardando un usuario en `localStorage` (`StorageManager.set('mediturnos_current_user', response.user)`) solo para reutilizar la lógica de `AuthManager`/`Router`.
  - A futuro, `AuthManager` debería convertirse en un wrapper fino encima de la sesión/API (en vez de leer desde `CONFIG.STORAGE.USERS`), manteniendo la misma API pública (`getCurrentUser/isAuthenticated/hasRole`).

### Conclusión operativa

- Los módulos `AuthManager`, `PacientesManager`, `MedicosManager`, `UsuariosManager`, `NotificationManager` y `StorageManager` contienen **la lógica legacy basada en `localStorage`** que define:
  - Estructura de entidades.
  - Validaciones de unicidad y reglas de negocio.
  - Estados de botones y flujos de confirmación/cancelación a través de `NotificationManager` y `ModalManager`.
- Para la versión con BD:
  - **Lectura/listado** ya se realiza principalmente vía API (`ApiClient`).
  - **Escritura (create/update/delete)** aún depende en varios puntos de `localStorage` y debe migrarse a los endpoints PHP, manteniendo las mismas reglas y mensajes de error.
  - La lógica aquí documentada se usará como referencia para implementar/ajustar endpoints en PHP y para adaptar los managers del frontend a un modelo 100% basado en API.


