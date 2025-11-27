## Estructura del Proyecto MediTurnos

Este documento describe las carpetas y archivos relevantes del proyecto, así como el propósito de cada módulo principal.


### 1. Raíz del Proyecto

- **`landing.html`**
  - Página pública principal del sistema.
  - Contiene:
    - Header con logo y navegación.
    - Sección hero con métricas simuladas y botones de acción.
    - Sección de características y llamado a la acción.
    - Footer con enlaces a información adicional.
    - Modales embebidos para login y registro (`#loginModal`, `#registerModal`).
  - Carga scripts:
    - `js/app.js` (bootstrap global).
    - `js/views/landing.js` (lógica de landing, login y registro).
    - `js/utils/debug.js` (utilidades de debug).

- **`views/`**
  - **`views/base.html`**
    - Plantilla base con sidebar y layout de app.
    - No se usa directamente en dashboards especificados, pero representa un layout genérico.
  - **`views/admin/dashboard.html`**
    - Plantilla del dashboard para rol administrador.
    - Incluye:
      - Sidebar con secciones: Dashboard, Turnos, Pacientes, Médicos, Usuarios, Reportes.
      - Contenedores (`#stats-grid`, `#recent-appointments`, `#appointments-table`, `#pacientes-grid`, `#medicos-grid`, `#usuarios-table`, `#reports-content`) donde el JS renderiza contenido dinámico.
    - Scripts:
      - `../../js/app.js`
      - `../../js/app-complete.js`
      - `../../js/views/admin/dashboard.js`
  - **`views/medico/dashboard.html`**
    - Dashboard para médicos:
      - Secciones: Dashboard, Mis Turnos, Pacientes, Disponibilidad.
      - Contenedores: `#stats-grid`, `#turnos-hoy`, `#mis-turnos`, `#pacientes-list`, `#disponibilidad-content`.
    - Scripts:
      - `../../js/app.js`
      - `../../js/views/medico/dashboard.js`
  - **`views/paciente/dashboard.html`**
    - Dashboard del paciente:
      - Secciones: Inicio, Mis Turnos, Reservar Turno, Historial, Mi Perfil.
      - Contenedores: `#proximos-turnos`, `#mis-turnos`, `#reservar-content`, `#historial-content`, `#perfil-content`.
    - Scripts:
      - `../../js/app.js`
      - `../../js/views/paciente/dashboard.js`
  - **`views/secretario/dashboard.html`**
    - Dashboard del secretario:
      - Secciones: Dashboard, Turnos, Pacientes, Calendario.
      - Contenedores: `#stats-grid`, `#turnos-hoy`, `#turnos-table`, `#pacientes-list`, `#calendar-view`.
    - Scripts:
      - `../../js/app.js`
      - `../../js/views/secretario/dashboard.js`


### 2. Estilos (`css/`)

- **`css/main.css`**
  - Estilos base de la aplicación.
  - Incluye definiciones de tipografías, colores, botones, formularios, tarjetas (`card`), badges, etc.

- **`css/layout.css`**
  - Estilos de layout para:
    - Contenedor principal (`.app-container`).
    - Sidebar (`.sidebar`) y header (`.header`).
    - Área de contenido (`.content`), grids de estadísticas, etc.

- **`css/landing.css`**
  - Estilos específicos de la página de landing:
    - Hero, secciones de características, CTA, footer.
    - Estilado de los modales de login/registro.


### 3. Frontend JavaScript (`js/`)

#### 3.1. Bootstrap y Configuración

- **`js/app.js`**
  - Punto de entrada JS para todas las páginas internas.
  - Define la clase `MediTurnosApp` que:
    - Inicializa `StorageManager`, `NotificationManager`, router y UI (sidebar, usuario en encabezado).
    - Verifica autenticación y redirige entre landing y dashboards según corresponda.
  - Expone `window.MediTurnos` con referencias a módulos core.

- **`js/app-complete.js`**
  - Cargado adicionalmente en el dashboard de admin.
  - El archivo está presente en el proyecto; su contenido no se detalla en el snapshot, pero se asume complementariedad con `app.js`.

- **`js/config.js`**
  - Exporta el objeto `CONFIG`:
    - Claves de `localStorage`.
    - Roles (`ROLES`).
    - Permisos por rol (`PERMISSIONS`).
    - Estados de turnos (`TURNO_ESTADOS`).
    - Listado de horarios disponibles (`HORARIOS`).
    - Parámetros de UI (duración de notificaciones, etc.).


#### 3.2. Módulos de negocio (`js/modules/`)

- **`api.js` – `ApiClient`**
  - Cliente HTTP para la API PHP:
    - Base URL: `/mediturnos/api`.
    - Métodos generales: `request`, `get`, `post`, `put`, `delete`.
  - Métodos específicos por recurso:
    - Autenticación: `login`, `register`, `logout`, `getCurrentUser`.
    - Turnos: `getTurnos`, `getTurno`, `createTurno`, `updateTurno`, `cancelTurno`, `getTurnosDelDia`, `getProximosTurnos`, `getEstadisticas`.
    - Médicos: `getMedicos`, `getMedico`, `getMedicoDisponibilidad`, `getMedicoHorariosDisponibles`.
    - Pacientes: `getPacientes`, `getPaciente`, `getPacienteHistorial`, `createPaciente`, `updatePaciente`, `deletePaciente`.
    - Usuarios: `getUsuarios`, `getUsuario`, `createUsuario`, `updateUsuario`, `deleteUsuario`, `changeUsuarioPassword`.

- **`auth.js` – `AuthManager`**
  - Maneja autenticación y roles en el lado del cliente.
  - Usa `localStorage` para:
    - `login(email, password)` contra usuarios almacenados localmente.
    - `logout()`, `getCurrentUser()`, `isAuthenticated()`.
    - Verificación de rol y permisos con `CONFIG.PERMISSIONS`.
  - Se combina con la autenticación real del backend mediante la escritura de `mediturnos_current_user` tras el login en la API.

- **`storage.js` – `StorageManager`**
  - Inicializa datos en `localStorage`:
    - Usuarios de ejemplo (admin, secretario, médico, paciente).
    - Médicos y pacientes “dummy” para pruebas.
    - Estructuras base de turnos y notificaciones en local.
  - Proporciona métodos `get`, `set`, `remove`, `clear`.

- **`notifications.js` – `NotificationManager`**
  - Crea un contenedor de notificaciones en el DOM.
  - Muestra notificaciones de tipo `success`, `error`, `warning`, `info`.
  - Permite almacenar notificaciones por usuario en `localStorage` (no conectadas a la tabla `notificaciones` de la BD).

- **`turnos.js` – `TurnosManager`**
  - Abstracción sobre turnos:
    - Listado con filtros.
    - Obtención por ID.
    - Creación, actualización y cancelación.
    - Consultas de turnos del día, próximos turnos y estadísticas.
  - Se apoya exclusivamente en el backend (`ApiClient`).

- **`medicos.js` – `MedicosManager`**
  - Operaciones sobre médicos vía API:
    - Listar, obtener por ID, crear, actualizar, eliminar.
    - Obtener disponibilidad y horarios disponibles por fecha.
    - Método auxiliar `getEspecialidades()` que deriva especialidades a partir de la lista de médicos (no usa endpoint dedicado).

- **`pacientes.js` – `PacientesManager`**
  - CRUD de pacientes y consulta de historial a través de la API:
    - `getAll`, `getById`, `create`, `update`, `delete`, `getHistorial`, `updateUltimaVisita`.

- **`usuarios.js` – `UsuariosManager`**
  - CRUD de usuarios vía API:
    - `getAll`, `getById`, `create`, `update`, `delete`, `changePassword`.

- **`router.js` – `Router`**
  - Define rutas lógicas a vistas HTML:
    - Landing: `/`, `/landing`, `/login`.
    - Dashboards: `/admin`, `/secretario`, `/medico`, `/paciente`.
  - `navigate(path)`:
    - Controla acceso según autenticación y rol (usando `AuthManager`).
    - Redirige a landing o al dashboard según corresponda.
  - `redirectByRole(rol)`:
    - Redirige a la vista HTML del dashboard correspondiente.


#### 3.3. Componentes (`js/components/`)

- **`form.js` – `FormValidator`**
  - Clase para agregar reglas de validación a formularios:
    - Reglas predefinidas: `required`, `email`, `minLength`, `maxLength`, `pattern`, `match`.
  - Manipula clases CSS y mensajes de error en el DOM.

- **`table.js` – `DataTable`**
  - Componente de tabla reutilizable:
    - Búsqueda en cliente.
    - Ordenamiento por columnas.
    - Paginación.
    - Formateos personalizados por columna (`render`, `format`).

- **`modal.js` – `Modal`**
  - Componente base de modal:
    - Estructura: backdrop, contenido, header opcional, footer opcional.
    - Métodos: `open`, `close`, `destroy`, `setContent`, `setTitle`.
    - Soporta cierre por botón, clic en backdrop y tecla ESC.

- **`modals.js` – `ModalManager`**
  - Gestor de modales para el sistema:
    - **Turnos**: crear/editar, cambiar estado.
    - **Pacientes**: crear/editar.
    - **Médicos**: crear/editar.
    - **Usuarios**: crear/editar.
    - **Historial** de un paciente.
    - **Confirmaciones** genéricas (con mensajes personalizados).
    - **Modales de información** en landing (`acerca`, `precios`, `ayuda`, `contacto`, `privacidad`, `terminos`).
  - Exporta funciones globales en `window.ModalManager` y helpers como `openInfoModal`.


#### 3.4. Vistas JS (`js/views/`)

- **`js/views/landing.js` – `LandingView`**
  - Controla:
    - Apertura/cierre de modales de login/registro.
    - Validación y formato de DNI y fecha de nacimiento.
    - Envío de formularios de login (`/auth/login`) y registro (`/auth/register`).
    - Guardado del usuario actual en `localStorage`.
    - Redirección según rol (`Router.redirectByRole`).
    - Carga de estadísticas del hero usando `ApiClient` (turnos del día, pacientes y médicos activos).

- **`js/views/admin/dashboard.js` – `AdminDashboard`**
  - Verifica rol `administrador`.
  - Mapea navegación lateral a secciones internas.
  - Carga:
    - Estadísticas de turnos del día, número de pacientes, médicos y usuarios.
    - Turnos recientes (próximos turnos).
    - Listado filtrable de turnos.
    - Grillas de pacientes, médicos y usuarios.
    - Reportes de estadísticas de turnos del mes.
  - Define funciones globales (`logout`, `editTurno`, `cancelTurno`, `editPaciente`, `verHistorial`, `editMedico`, `editUsuario`).

- **`js/views/medico/dashboard.js` – `MedicoDashboard`**
  - Verifica rol `medico`.
  - Carga:
    - Turnos de hoy del médico.
    - Todos sus turnos.
    - Lista de pacientes relacionados.
    - Información de disponibilidad y especialidad del médico.
  - Funciones globales: `logout`, `cambiarEstado`, `verHistorial`, `editarDisponibilidad`.

- **`js/views/paciente/dashboard.js` – `PacienteDashboard`**
  - Verifica rol `paciente`.
  - Carga:
    - Próximos turnos del paciente.
    - Lista de todos sus turnos, permitiendo cancelación.
    - Formulario para reservar turnos, con cálculo de horarios disponibles por médico/fecha.
    - Historial de turnos.
    - Datos de perfil.
  - Funciones globales: `logout`, `irAReservar`, `cancelarTurno`, `editarPerfil`.

- **`js/views/secretario/dashboard.js` – `SecretarioDashboard`**
  - Verifica rol `secretario`.
  - Carga:
    - Estadísticas básicas (turnos de hoy, pacientes activos).
    - Lista de turnos y pacientes.
    - Calendario mensual de turnos con panel lateral de detalle por día.
  - Funciones globales: `logout`, `editTurno`, `cancelTurno`, `nuevoTurnoPaciente`.


### 4. Utilidades (`js/utils/`)

- **`formatters.js`**
  - `setupDniFormatter(input)`: formatea el valor del input como DNI (`xx.xxx.xxx`), controlando input, pegado y posición del cursor.
  - `formatDateToDMY(value)`: convierte fechas de `YYYY-MM-DD` (o `Date`) a `DD-MM-YYYY`.

- **`debug.js` – `DebugUtils`**
  - Funciones para uso en la consola del navegador:
    - `checkStorage()`: muestra contenido de usuarios, médicos y pacientes en `localStorage`.
    - `reinitStorage()`: limpia y reinicializa storage.
    - `testLogin(email, password)`: prueba credenciales contra usuarios en `localStorage`.
  - Expuestas en `window.DebugUtils`, `window.reinitStorage`, `window.checkStorage`, `window.testLogin`.


### 5. Backend (`api/`)

- **`api/index.php`**
  - Router principal:
    - Activa manejo de errores y modo debug opcional (`?debug`).
    - Carga `config/database.php`.
    - Interpreta la URL para identificar:
      - Controlador (`auth`, `usuario`, `medico`, `paciente`, `turno`, `notificacion`, etc.).
      - Acción (método), ID y subacción cuando corresponde.
    - Despacha a la clase `XController` y al método correcto según:
      - HTTP method (GET, POST, PUT, DELETE).
      - Segmentos de ruta y lista de acciones especiales (`login`, `register`, `logout`, `me`, `disponibilidad`, `horarios-disponibles`, `especialidades`, `historial`, `del-dia`, `proximos`, `estadisticas`, `change-password`, `read`, `read-all`).

- **`api/config/database.php`**
  - Configura:
    - Conexión PDO usando la clase `Database`.
    - Sesión PHP (`initSession`).
    - Encabezados CORS y JSON (`setHeaders`).
  - Define helpers:
    - `jsonResponse`, `errorResponse`, `successResponse`.
    - `getJsonInput`, `requireAuth`, `getCurrentUser`.

- **`api/controllers/`**
  - `AuthController.php`: login, logout, registro, consulta de usuario actual (`/auth/*`).
  - `UsuarioController.php`: CRUD y cambio de contraseña de usuarios (`/usuario/*`).
  - `MedicoController.php`: CRUD de médicos, especialidades, disponibilidad y horarios disponibles (`/medico/*`).
  - `PacienteController.php`: CRUD de pacientes e historial de turnos (`/paciente/*`).
  - `TurnoController.php`: CRUD de turnos, turnos del día, próximos turnos y estadísticas (`/turno/*`).
  - `NotificacionController.php`: consulta y actualización de notificaciones (`/notificacion/*`).

- **`api/models/`**
  - `Usuario.php`: acceso a la tabla `usuarios` (login, creación, actualización, borrado lógico, cambio de contraseña).
  - `Medico.php`: acceso a `medicos`, `medico_especialidades`, `medico_disponibilidad` y utilidades relacionadas (especialidades y disponibilidad).
  - `Paciente.php`: acceso a `pacientes` y a su historial mediante `Turno`.
  - `Turno.php`: acceso a `turnos` con filtros, validación de conflictos, estadísticas y lógica de negocio sobre estados.
  - `Notificacion.php`: gestión de `notificaciones`.
  - `Especialidad.php`: gestión básica de `especialidades`.


### 6. Base de Datos (`db/mediturnos.sql`)

- Define todas las tablas necesarias:
  - `usuarios`, `pacientes`, `medicos`, `especialidades`, `medico_especialidades`, `medico_disponibilidad`, `turnos`, `turno_estados`, `notificaciones`.
- Agrega:
  - Índices para mejorar consultas.
  - Triggers para:
    - Validar conflictos de turnos.
    - Actualizar `ultima_visita` del paciente.
    - Crear notificaciones al crear/confirmar turnos.
    - Validar coherencia de `rol` y `medico_id`/`paciente_id` en `usuarios`.
  - Vistas de reporte:
    - `v_disponibilidad_medicos`, `v_estadisticas_turnos`, `v_medicos_completos`, `v_notificaciones_pendientes`, `v_turnos_completos`.


### 7. Resumen

La estructura del proyecto separa claramente:

- **Frontend** (presentación, interacción de usuario, módulos JS).
- **Backend** (API REST en PHP con modelos y controladores).
- **Persistencia** (base de datos MySQL con reglas de negocio a nivel de SQL).

Cada carpeta y archivo relevante contribuye a uno de estos niveles, y los módulos están organizados por dominio (turnos, pacientes, médicos, usuarios), lo que facilita la comprensión y la evolución del sistema.


