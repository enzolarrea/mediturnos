## Flujos del Sistema en MediTurnos

Este documento describe los flujos principales del sistema y el comportamiento de cada rol.


### 1. Flujo de Autenticación

#### 1.1. Login

1. El usuario abre `landing.html`.
2. Hace clic en "Iniciar Sesión", lo que abre el modal `#loginModal`.
3. El formulario de login es manejado por `LandingView.handleLogin` (`js/views/landing.js`):
   - Obtiene `email` y `password`.
   - Invoca `ApiClient.login(email, password)` → `POST /api/auth/login`.
4. El backend (`AuthController::login`) realiza:
   - Lectura de JSON mediante `getJsonInput`.
   - Validación básica (email y password requeridos).
   - Llamada a `Usuario::verifyCredentials(email, password)`:
     - Busca usuario en `usuarios` por email.
     - Compara password en texto plano y que `activo = 1`.
   - Si las credenciales son correctas:
     - Inicializa `$_SESSION` con: `user_id`, `user_nombre`, `user_apellido`, `user_email`, `user_rol`, `user_medico_id`, `user_paciente_id`, `user_activo`.
     - Devuelve JSON con `success: true` y datos del usuario (sin contraseña).
5. El frontend:
   - Guarda el usuario en `localStorage` (`mediturnos_current_user`).
   - Muestra notificación de éxito.
   - Llama `Router.redirectByRole(user.rol)` para enviar al dashboard correspondiente.

#### 1.2. Registro de Paciente

1. En `landing.html`, el usuario abre el modal de registro `#registerModal`.
2. El formulario se maneja en `LandingView.handleRegister`:
   - Toma `nombre`, `apellido`, `dni`, `fecha_de_nacimiento`, `email`, `password`, `confirmPassword`.
   - Convierte fecha de `dd/mm/yyyy` a `yyyy-mm-dd`.
   - Normaliza DNI eliminando puntos.
   - Envía estos datos a `ApiClient.register` → `POST /api/auth/register`.
3. Backend (`AuthController::register`):
   - Verifica email y contraseña.
   - Verifica que `password` y `confirmPassword` coincidan.
   - Rol por defecto: `paciente`.
   - Crea primero un paciente con `Paciente::create` y guarda el `pacienteId`.
   - Crea usuario en `usuarios` con `Usuario::create`, enlazando `paciente_id`.
   - Devuelve `success: true` con el usuario creado (sin password).
4. Frontend:
   - Guarda el usuario en `localStorage`.
   - Muestra notificación de éxito.
   - Redirige al dashboard de paciente con `Router.redirectByRole('paciente')`.

#### 1.3. Logout

En cada dashboard, se define una función global `logout()` (en JS de cada rol) que:

1. Muestra una confirmación (usando `ModalManager.confirm`).
2. Si el usuario confirma:
   - Llama `AuthManager.logout()` para borrar `mediturnos_current_user` de `localStorage`.
   - Redirige a `landing.html`.

(En el código actual, el logout del backend (`/api/auth/logout`) no se llama desde el frontend de dashboards; la sesión PHP se mantiene hasta expirar o ser invalidada manualmente.)


### 2. Flujo de Navegación por Rol

#### 2.1. Redirección inicial

`MediTurnosApp.checkAuth()` en `js/app.js`:

- Si la URL actual es landing (`landing.html`, `/`, `index.html`):
  - Si `AuthManager.isAuthenticated()` es verdadero:
    - Obtiene el usuario (`AuthManager.getCurrentUser()`).
    - Llama `Router.redirectByRole(user.rol)` para llevarlo a su dashboard.
- Si la URL actual no es landing:
  - Si el usuario **no** está autenticado (`AuthManager.isAuthenticated()` es falso):
    - Redirige a `landing.html`.

#### 2.2. Dashboards

Cada archivo `js/views/*/dashboard.js`:

- Verifica el rol adecuando al cargar:
  - Admin: `AuthManager.hasRole(CONFIG.ROLES.ADMIN)`.
  - Secretario: `AuthManager.hasRole(CONFIG.ROLES.SECRETARIO)`.
  - Médico: `AuthManager.hasRole(CONFIG.ROLES.MEDICO)`.
  - Paciente: `AuthManager.hasRole(CONFIG.ROLES.PACIENTE)`.
- Si la verificación falla, se redirige a `landing.html`.
- Maneja los clics en `.nav-item` de la sidebar, activando/desactivando secciones (`.content-section`) y cargando los datos necesarios de cada sección.


### 3. Flujo de Gestión de Turnos

#### 3.1. Creación de Turno (Admin/Secretario)

1. Desde el dashboard de admin o secretario:
   - El usuario hace clic en:
     - Botón "Nuevo Turno" (`#newAppointmentBtn`, `#addAppointmentBtn2`).
     - O "Nuevo Turno" asociado a un paciente (`nuevoTurnoPaciente(id)` en secretario).
2. Estas acciones llaman `ModalManager.openTurnoModal(turno = null, pacienteIdPreseleccionado?)`:
   - El modal:
     - Carga pacientes (`PacientesManager.getAll({activo:true})`) y médicos (`MedicosManager.getAll({activo:true})`) via API.
     - Muestra un formulario con:
       - Paciente, médico, fecha, hora, estado, motivo, notas.
3. Al hacer clic en guardar:
   - Llama `ModalManager.saveTurno(turnoId)`:
     - Si `turnoId` es `null` → creación.
     - Construye `turnoData` con `pacienteId`, `medicoId`, `fecha`, `hora`, `estado`, `motivo`, `notas`.
     - Llama a `TurnosManager.create(turnoData)` → `POST /api/turno`.
4. Backend (`TurnoController::store` + `Turno::create`):
   - Valida que no exista conflicto de horario para el médico (`checkDisponibilidad` + triggers SQL).
   - Obtiene `estado_id` (por defecto `pendiente`).
   - Inserta registro en `turnos`.
   - Los triggers:
     - Evitan superposición de turnos activos (`trg_validar_turno_antes_insert`).
     - Crean notificación al paciente asociado (`trg_notificar_turno_creado`).
5. Frontend:
   - Muestra notificación de éxito.
   - Cierra el modal.
   - Recarga las listas de turnos y el dashboard si hay métodos disponibles (`loadTurnos`, `loadDashboard`).

#### 3.2. Reserva de Turno (Paciente)

1. El paciente entra a su dashboard (sección "Reservar Turno").
2. `PacienteDashboard.loadReservar()`:
   - Carga la lista de médicos activos (`MedicosManager.getAll({activo:true})`).
   - Renderiza un formulario con:
     - Select de médico.
     - Input de fecha (mínimo hoy).
     - Select de hora vacío inicialmente.
     - Motivo de consulta.
3. Al seleccionar médico y fecha:
   - Se llama `MedicosManager.getHorariosDisponibles(medicoId, fecha)`:
     - Internamente usa `ApiClient.getMedicoHorariosDisponibles` → `GET /api/medico/{id}/horarios-disponibles?fecha=...`.
     - El backend calcula horarios libres basados en:
       - Disponibilidad del médico (`medico_disponibilidad`).
       - Turnos activos existentes (`turnos` + `turno_estados`).
   - El select de hora se rellena con `CONFIG.HORARIOS`, marcando como deshabilitadas las horas no disponibles.
4. Al enviar el formulario:
   - `PacienteDashboard.reservarTurno(form)`:
     - Arma `turnoData` con el `pacienteId` del usuario actual y datos ingresados.
     - Llama `TurnosManager.create(turnoData)`.
5. Backend ejecuta el mismo flujo de creación de turno descrito antes.
6. Frontend:
   - Notifica éxito.
   - Limpia el formulario.
   - Recarga los próximos turnos y la lista de turnos.
   - Cambia a la sección "Mis Turnos".

#### 3.3. Edición de Turnos

1. En los dashboards de admin y secretario:
   - El botón de edición de turno llama `editTurno(id)`.
2. `editTurno(id)`:
   - Obtiene el turno vía `TurnosManager.getById(id)` → `GET /api/turno/{id}`.
   - Llama `ModalManager.openTurnoModal(turno)` para mostrar el formulario prellenado.
3. Al guardar:
   - `ModalManager.saveTurno(turno.id)` construye `updates` y llama `TurnosManager.update(id, updates)` → `PUT /api/turno/{id}`.
4. Backend (`Turno::update`):
   - Si cambian fecha, hora o médico, revalida disponibilidad (`checkDisponibilidad` y triggers SQL).

#### 3.4. Cambio de Estado de Turno (Médico)

1. En el dashboard de médico:
   - Botón "editar estado" llama `cambiarEstado(id)`.
2. `ModalManager.openEstadoTurnoModal(turnoId)`:
   - Obtiene el turno con `TurnosManager.getById`.
   - Muestra un formulario con un select de estados (`pendiente`, `confirmado`, `en_curso`, `completado`, `no_asistio`) y notas.
3. Al guardar:
   - `ModalManager.saveEstadoTurno(turnoId)` llama `TurnosManager.update(turnoId, { estado, notas })`.
4. Backend:
   - Actualiza el campo `estado_id`.
   - Triggers:
     - Si el nuevo estado es `completado`, actualiza `ultima_visita` en `pacientes`.
     - Si el nuevo estado es `confirmado`, crea notificaciones para paciente y médico.

#### 3.5. Cancelación de Turnos

1. En los dashboards de admin, secretario y paciente:
   - Botones de cancelación llaman funciones globales (`cancelTurno(id)` o `cancelarTurno(id)`).
2. Estas funciones:
   - Muestran un modal de confirmación (`ModalManager.confirm`).
   - Si se confirma, llaman `TurnosManager.cancel(id)` → `DELETE /api/turno/{id}`.
3. Backend:
   - `TurnoController::destroy($id)` llama `Turno::cancel($id)`, que internamente ejecuta un `update` para cambiar el estado a `cancelado`.


### 4. Flujo del Calendario (Secretario)

1. El secretario selecciona la sección "Calendario" en su dashboard.
2. `SecretarioDashboard.loadCalendario()`:
   - Calcula el primer y último día del mes actual.
   - Llama `TurnosManager.getAll({ desde, hasta })` para obtener todos los turnos del mes.
   - Carga también pacientes y médicos para poder resolver nombres.
   - Agrupa los turnos por fecha (`turnosPorFecha`).
3. `renderCalendarMonth(container, year, month)`:
   - Construye:
     - Encabezado con nombre del mes/año y botones para navegar a mes anterior/siguiente y “Hoy”.
     - Cuadrícula con días del mes:
       - Cada día muestra un badge con la cantidad de turnos.
       - El día actual se resalta.
4. Al hacer clic en un día:
   - Marca el día como seleccionado.
   - Llama `renderDayAppointments(dateISO)`:
     - Actualiza título del panel lateral con el día.
     - Lista los turnos de esa fecha con:
       - Hora, paciente, médico, motivo, estado.
       - Botón de edición que llama `window.editTurno(id)` (abre modal de turno).


### 5. Comportamiento por Rol (Detalle)

#### 5.1. Administrador

- **Dashboard**:
  - Ve estadísticas resumidas (turnos de hoy, pacientes activos, médicos activos, usuarios activos).
  - Ve próximos turnos en un listado lateral.
- **Turnos**:
  - Puede filtrar por fecha, médico y estado.
  - Crear, editar y cancelar turnos.
- **Pacientes**:
  - Ve una grilla de tarjetas de pacientes (datos de contacto, última visita).
  - Puede editar pacientes y ver su historial completo.
- **Médicos**:
  - Ve una grilla de tarjetas de médicos (matrícula, especialidad, horario).
  - Puede editar información de médicos.
- **Usuarios**:
  - Puede crear, editar y gestionar usuarios del sistema, asignando roles y, cuando corresponda, asociándolos a médicos o pacientes.
- **Reportes**:
  - Visualiza estadísticas agregadas de turnos del mes actual (total, confirmados, completados, cancelados).

#### 5.2. Secretario

- **Dashboard**:
  - Ve la cantidad de turnos del día y cantidad total de pacientes.
  - Lista los turnos de hoy con paciente, médico y estado.
- **Turnos**:
  - Ve y gestiona todos los turnos del sistema.
  - Puede crear nuevos turnos, editarlos o cancelarlos.
- **Pacientes**:
  - Puede ver el listado de pacientes y crear nuevos pacientes rápidamente.
  - Desde cada paciente, puede abrir el modal para crear un turno asociado.
- **Calendario**:
  - Visualiza un calendario mensual con el conteo de turnos por día.
  - Puede ver los detalles de los turnos de un día concreto y abrirlos para edición.

#### 5.3. Médico

- **Dashboard**:
  - Ve sus turnos asignados para la fecha actual.
  - Visualiza su propia especialidad y nombre en las stats.
- **Mis Turnos**:
  - Ve sus turnos futuros y pasados.
  - Puede cambiar el estado de sus turnos (p. ej. marcar como `en_curso`, `completado`, `no_asistio`).
- **Pacientes**:
  - Lista pacientes que tienen o han tenido turnos con él.
  - Puede abrir el historial de un paciente.
- **Disponibilidad**:
  - Ve su horario y especialidad.
  - Puede abrir el modal de médico para editar sus datos (incluida la disponibilidad, manejada por el backend).

#### 5.4. Paciente

- **Inicio (Dashboard)**:
  - Mensaje de bienvenida.
  - Botón para ir directamente a “Reservar Turno”.
  - Lista de próximos turnos (fecha, hora, médico, especialidad, estado).
- **Mis Turnos**:
  - Lista de todos sus turnos.
  - Permite cancelar turnos que aún no han sido cancelados o completados.
- **Reservar Turno**:
  - Selecciona médico, fecha y hora disponible, y puede indicar motivo.
  - El sistema muestra horarios ocupados como deshabilitados.
- **Historial**:
  - Ve el historial de sus turnos anteriores, con estado y médico.
- **Mi Perfil**:
  - Ve sus datos personales.
  - Puede abrir el modal para editarlos.


### 6. Resumen de Flujos

- La autenticación se realiza contra la API (`/auth`), con sesión PHP y un reflejo del usuario en `localStorage`.
- La navegación entre landing y dashboards está controlada por `MediTurnosApp` y `Router`, en función de si el usuario está autenticado y de su rol.
- La gestión de turnos es central:
  - Admin y secretario pueden gestionar turnos de todos.
  - Médicos gestionan el estado de sus propios turnos.
  - Pacientes reservan y cancelan sus turnos.
- El calendario del secretario ofrece una vista mensual global de turnos con detalle diario.
- Las reglas de negocio críticas (conflictos de turnos, actualización de última visita, generación de notificaciones y coherencia de roles) se refuerzan tanto en la capa de aplicación (modelos PHP) como en la base de datos (triggers y constraints).


