## Funcionalidades Clave de MediTurnos

Este documento detalla cómo se implementan las principales funcionalidades del sistema: gestión de turnos, calendario, roles y otras acciones críticas.


### 1. Gestión de Turnos

#### 1.1. Modelo de Turno (Backend)

La clase `Turno` (`api/models/Turno.php`) encapsula la lógica principal:

- **`getAll($filters = [])`**
  - Obtiene turnos desde la tabla `turnos` con joins a:
    - `turno_estados` (estado).
    - `pacientes` y `medicos` (nombres).
  - Filtros soportados:
    - `fecha`, `medicoId`, `pacienteId`, `estado`, `desde`, `hasta`, `id`.
  - Aplica un filtro adicional por rol:
    - Si el usuario actual (`getCurrentUser()`) es médico, restringe a `medico_id = medicoId del usuario`.
    - Si es paciente, restringe a `paciente_id = pacienteId del usuario`.
  - Normaliza el resultado para el frontend (`pacienteId`, `medicoId`, `estadoCodigo`, `estadoNombre`, `fechaCreacion`, `fechaActualizacion`).

- **`create($data)`**
  - Valida que no haya conflicto de horario mediante `checkDisponibilidad`.
  - Obtiene `estado_id` desde `turno_estados` (por defecto `pendiente`).
  - Inserta un nuevo registro en `turnos`.

- **`update($id, $data)`**
  - Revalida conflictos de fecha/hora si cambian estos campos o el médico.
  - Permite actualizar paciente, médico, fecha, hora, estado, motivo y notas.

- **`cancel($id)`**
  - Un atajo para cambiar el estado del turno a `cancelado` usando `update`.

- **`getTurnosDelDia($fecha)`**
  - Si no se indica fecha, usa la fecha actual.
  - Llama a `getAll(['fecha' => $fecha])`.

- **`getProximosTurnos($limit)`**
  - Obtiene turnos desde la fecha actual hacia adelante.
  - Filtra aquellos cuyo estado no sea `cancelado`.
  - Ordena por fecha/hora y limita al número solicitado.

- **`getEstadisticas($fechaInicio, $fechaFin)`**
  - Obtiene todos los turnos en el rango [inicio, fin].
  - Cuenta cantidad de turnos por estado (`pendientes`, `confirmados`, `completados`, `cancelados`, `noAsistio`).

- **`checkDisponibilidad($medicoId, $fecha, $hora, $excludeId = null)`**
  - Verifica si ya existe un turno con ese médico, fecha y hora, con estado **no** en (`cancelado`, `no_asistio`).
  - Se usa antes de insertar o actualizar un turno para evitar superposiciones.


#### 1.2. Controlador de Turnos (Backend)

`TurnoController` (`api/controllers/TurnoController.php`):

- `index()` – `GET /api/turno`
  - Llama `Turno::getAll` con los filtros de `$_GET`.

- `show($id)` – `GET /api/turno/{id}`
  - Devuelve un turno individual.

- `store()` – `POST /api/turno`
  - Llama `Turno::create` y devuelve el turno creado.

- `update($id)` – `PUT /api/turno/{id}`
  - Llama `Turno::update` con los datos aportados.

- `destroy($id)` – `DELETE /api/turno/{id}`
  - Llama `Turno::cancel($id)` para marcar el turno como cancelado.

- `delDia()` – `GET /api/turno/del-dia?fecha=YYYY-MM-DD`
  - Devuelve turnos de una fecha específica (por defecto hoy).

- `proximos()` – `GET /api/turno/proximos?limit=N`
  - Devuelve próximos turnos a partir de hoy, excluyendo cancelados.

- `estadisticas()` – `GET /api/turno/estadisticas?fechaInicio=...&fechaFin=...`
  - Devuelve estadísticas agregadas de turnos en un rango.


#### 1.3. Manager de Turnos (Frontend)

`TurnosManager` (`js/modules/turnos.js`):

- Usa `ApiClient` para llamar a los endpoints de `TurnoController`.
- Proporciona una interfaz simplificada al resto del frontend:
  - `getAll(filters)`, `getById(id)`, `create(turnoData)`, `update(id, updates)`, `cancel(id)`, `getTurnosDelDia(fecha)`, `getProximosTurnos(limit)`, `getEstadisticas(fechaInicio, fechaFin)`.
- Se encarga de normalizar los datos devueltos por la API para garantizar que el campo `estado` siempre tenga un valor consistente.


### 2. Gestión del Calendario

La funcionalidad de calendario se concentra en el dashboard de secretario (`js/views/secretario/dashboard.js`).

#### 2.1. Carga de datos

- `SecretarioDashboard.loadCalendario()`:
  - Calcula primer y último día del mes actual.
  - Llama `TurnosManager.getAll({desde, hasta})` para obtener todos los turnos del mes.
  - Llama `PacientesManager.getAll({activo:true})` y `MedicosManager.getAll({activo:true})` para tener nombres de pacientes y médicos.
  - Agrupa turnos en un diccionario `turnosPorFecha` (`YYYY-MM-DD` → lista de turnos).

#### 2.2. Render del mes

- `renderCalendarMonth(container, year, month)`:
  - Construye:
    - Barra de navegación del calendario con:
      - Mes y año actuales.
      - Botones para ir al mes anterior, siguiente y “Hoy”.
    - Grid de días:
      - Cada celda de día muestra:
        - Número de día.
        - Badge con cantidad de turnos de ese día, si los hay.
      - El día actual se marca como especial.
  - Cada día clickable tiene un atributo `data-date="YYYY-MM-DD"`.

#### 2.3. Detalle diario

- Al hacer clic en un día:
  - Se llama `renderDayAppointments(dateISO)`:
    - Actualiza el título del panel lateral con la fecha y nombre del día de semana.
    - Muestra el recuento de turnos.
    - Renderiza tarjetas para cada turno con:
      - Hora, paciente, médico, motivo (si está presente).
      - Un badge de estado (pendiente, confirmado, cancelado, etc.) con color.
      - Botón de edición que llama a `window.editTurno(id)` para abrir el modal de turno correspondiente.

Este calendario funciona como una vista global de ocupación, pensada para el rol secretario.


### 3. Gestión de Disponibilidad de Médicos

La disponibilidad de médicos se define a nivel de base de datos y se expone vía el modelo `Medico`.

#### 3.1. Datos de disponibilidad (BD)

- Tabla `medico_disponibilidad`:
  - `medico_id`, `dia_semana` (enum: lunes–domingo), `hora_inicio`, `hora_fin`, `activo`.
- Datos ejemplo:
  - Médicos con disponibilidad en días hábiles, cada uno con su rango horario.

#### 3.2. Backend – `Medico` y `MedicoController`

- `Medico::getDisponibilidad($id, $fecha)`:
  - Comprueba existencia del médico.
  - Obtiene turnos activos del día `fecha` para ese médico mediante `Turno::getAll`.
  - Calcula:
    - `disponible` (true si la cantidad de turnos activos es menor a 20).
    - `turnosOcupados`.
    - Lista de turnos.

- `Medico::getHorariosDisponibles($id, $fecha)`:
  - Llama a `getDisponibilidad` y utiliza una lista fija de horarios (`08:00` a `18:00` cada 30 min).
  - Devuelve solo las horas que **no** están ocupadas por turnos activos.

- Controlador:
  - `disponibilidad($id)` – `GET /api/medico/{id}/disponibilidad?fecha=...`.
  - `horariosDisponibles($id)` – `GET /api/medico/{id}/horarios-disponibles?fecha=...`.

#### 3.3. Frontend – Uso de disponibilidad

- `MedicosManager.getHorariosDisponibles(id, fecha)`:
  - Llama el endpoint correspondiente.
  - Si la API devuelve un array, lo usa.
  - En caso de error o lista vacía, hace fallback a `CONFIG.HORARIOS`.

- En:
  - `ModalManager.openTurnoModal` (admin/secretario).
  - `PacienteDashboard.loadReservar` (paciente).

Los selects de hora se poblan según la combinación de médico y fecha seleccionada, marcando horas ocupadas como deshabilitadas y mostrando un texto como `(Ocupado)` cuando corresponde.


### 4. Gestión de Pacientes y Usuarios

#### 4.1. Pacientes

- **Modelo `Paciente`**
  - `create`, `getById`, `getAll`, `update`, `delete`, `getHistorial`, `updateUltimaVisita`.
  - `getHistorial` devuelve los turnos del paciente usando `Turno::getAll(['pacienteId' => id])`.

- **Front-end**
  - `PacientesManager` encapsula las llamadas a la API.
  - `ModalManager.openPacienteModal` permite:
    - Alta / edición de datos de paciente desde dashboards (admin/secretario/paciente).
    - Normalización de DNI antes de enviar al backend.

#### 4.2. Usuarios

- **Modelo `Usuario`**
  - Administra usuarios de la tabla `usuarios`:
    - Validación de email único.
    - Validación de longitud de contraseña (aunque se guarda en texto plano).
    - Asociaciones a médicos (`medico_id`) o pacientes (`paciente_id`).
    - Borrado lógico (`activo = 0`).
    - Cambio de contraseña (`changePassword`).
  - Triggers en BD:
    - Exigen que usuarios con rol `medico` tengan `medico_id`.
    - Exigen que usuarios con rol `paciente` tengan `paciente_id`.
    - Limpian asociaciones si el rol es `administrador` o `secretario`.

- **Front-end**
  - `UsuariosManager` provee las operaciones necesarias para los dashboards.
  - `ModalManager.openUsuarioModal`:
    - Carga listas de médicos y pacientes.
    - Adapta el formulario según el rol:
      - Muestra select de médico si el rol es `medico`.
      - Muestra select de paciente si el rol es `paciente`.
    - Maneja creación y actualización de usuarios.


### 5. Notificaciones

Aunque el backend define un modelo y controlador de notificaciones, el frontend actual se apoya sobre todo en notificaciones visuales:

- **Backend**
  - Tabla `notificaciones` y modelo `Notificacion`.
  - Triggers de `turnos`:
    - Al crear turno: envían una notificación al usuario vinculado al paciente.
    - Al confirmar turno: envían notificaciones a paciente y médico.
  - `NotificacionController` ofrece:
    - `GET /api/notificacion`: lista de notificaciones del usuario actual.
    - `POST /api/notificacion`: creación manual.
    - `PUT /api/notificacion/{id}/read`: marcar una notificación como leída.
    - `PUT /api/notificacion/read-all`: marcar todas como leídas.

- **Frontend**
  - `NotificationManager` muestra notificaciones flotantes en UI:
    - `success`, `error`, `warning`, `info`.
  - Además, guarda notificaciones en `localStorage` (`mediturnos_notificaciones`) mediante `saveNotification` y `getUserNotifications`.
  - El frontend no consume (en el código mostrado) el endpoint `/api/notificacion`; el sistema de notificaciones backend funciona de forma independiente por ahora.


### 6. Validaciones y Reglas de Negocio en la Base de Datos

La base de datos añade una capa importante de seguridad e integridad:

- **Conflictos de Turnos**
  - Triggers `trg_validar_turno_antes_insert` y `trg_validar_turno_antes_update` en `turnos`:
    - Impiden que se inserte o actualice un turno a una combinación de `medico_id` + `fecha` + `hora` que ya esté ocupada por un turno no cancelado/no asistido.

- **Actualización de Última Visita**
  - Trigger `trg_actualizar_ultima_visita`:
    - Cuando un turno cambia a estado `completado`, actualiza `pacientes.ultima_visita` con la fecha del turno.

- **Notificaciones Automáticas**
  - Triggers `trg_notificar_turno_creado` y `trg_notificar_turno_confirmado`:
    - Insertan registros en `notificaciones` con mensajes adecuados, vinculados a usuarios asociados a pacientes y médicos.

- **Coherencia de Roles de Usuario**
  - Triggers en `usuarios` (insert y update):
    - Validan que usuarios con rol `medico` tengan `medico_id` no nulo.
    - Validan que usuarios con rol `paciente` tengan `paciente_id` no nulo.
    - Limpian campos `medico_id` y `paciente_id` al cambiar el rol a `administrador` o `secretario`.


### 7. Resumen de Funcionalidades

- **Turnos**
  - CRUD completo, con validación de solapamientos, estados y estadísticas de uso.
  - Integración con notificaciones y actualización de historial clínico básico (`ultima_visita`).

- **Calendario**
  - Vista mensual de ocupación para secretaría, con detalle por día de todos los turnos.

- **Disponibilidad de Médicos**
  - Definición por día de la semana y franjas horarias.
  - Cálculo de horarios disponibles efectivo a partir de disponibilidad y turnos ya reservados.

- **Roles**
  - Cada rol tiene una experiencia adaptada:
    - Admin: visión y control global.
    - Secretario: opérations diarias y calendario.
    - Médico: agenda propia, estado de turnos y acceso a sus pacientes.
    - Paciente: reserva y gestión de sus turnos.

- **Integridad**
  - La lógica de negocio está repartida entre:
    - Código PHP (modelos y controladores).
    - Reglas y triggers en la base de datos.
  - Esto asegura que las reglas clave (no solapamiento, coherencia de roles, actualización de última visita, notificaciones) se respeten incluso si se accede a la base de datos desde distintos puntos del sistema.


