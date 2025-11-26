### Pruebas manuales de botones y flujos críticos

#### 1. Paciente – Reservar turno

- **Flujo**:
  - Iniciar sesión como paciente (landing → Iniciar sesión).
  - En el dashboard de paciente, ir a `Reservar Turno` (botón “Reservar Nuevo Turno” o menú lateral).
  - Completar:
    - Médico / Especialidad.
    - Fecha (>= hoy).
    - Hora disponible (no marcada como “Ocupado”).
    - Motivo (opcional).
  - Click en **“Reservar Turno”**.
- **Resultado esperado**:
  - Botón pasa a estado “Reservando...” y se deshabilita durante la petición.
  - Toast de éxito: “Turno reservado exitosamente”.
  - El formulario se limpia.
  - Se recargan las secciones:
    - `Proximos turnos` en el dashboard.
    - `Mis Turnos` (incluye el nuevo turno).
  - La navegación cambia automáticamente a la pestaña **“Mis Turnos”**.
- **Casos edge**:
  - Intentar reservar sin seleccionar médico, fecha u hora → toast de error “Por favor completa todos los campos requeridos”.
  - Intentar reservar un slot ya ocupado (misma fecha/hora/médico) → mensaje de error coherente con backend (“El médico ya tiene un turno en esa fecha y hora”).
  - Usuario no logueado: acceder directo a `views/paciente/dashboard.html` debe redirigir a `landing.html`.

#### 2. Paciente – Cancelar turno

- **Flujo**:
  - Con un turno pendiente/confirmado:
    - Desde el dashboard (tarjetas de próximos turnos).
    - O desde la sección `Mis Turnos`.
  - Click en el ícono de cancelar (botón `X`).
  - Confirmar en el modal de confirmación.
- **Resultado esperado**:
  - Modal de confirmación con texto claro y botones Cancelar / Confirmar.
  - Al confirmar:
    - Turno pasa a estado `cancelado`.
    - Deja de aparecer en “Próximos turnos”.
    - En `Mis turnos` se muestra con badge de error / cancelado.
  - Toast de éxito “Turno cancelado exitosamente”.
- **Casos edge**:
  - Cancelar un turno ya cancelado → backend debe responder error 400 o mensaje adecuado; frontend mostrar toast “Error al cancelar el turno”.

#### 3. Secretaria – Gestión de turnos (listar / crear / editar / cancelar)

- **Flujo**:
  - Iniciar sesión como secretario.
  - En `Dashboard`:
    - Ver tarjetas de “Turnos Hoy” y listado de turnos de la fecha actual.
  - Ir a sección `Turnos`:
    - Validar que se ven todos los turnos con paciente, médico, fecha/hora y estado.
  - Click en **“Nuevo Turno”** (botón superior o en la tarjeta de gestión de turnos).
    - Modal de turno debe permitir seleccionar paciente, médico, fecha y hora (horarios ocupados deshabilitados).
    - Guardar turno → ver nuevo turno en el listado.
  - Editar un turno desde el ícono de lápiz:
    - Modificar hora o estado (p.ej. confirmado).
  - Cancelar turno desde el ícono `X`:
    - Confirmar en modal.
- **Resultado esperado**:
  - Listados siempre consistentes con la BD (refrescados tras crear/editar/cancelar).
  - No se permite guardar turnos con campos requeridos vacíos.
  - Conflictos de horario se informan con mensaje claro.

#### 4. Secretaria – Nueva cita desde un paciente

- **Flujo**:
  - En la sección `Pacientes` del secretario:
    - Buscar un paciente existente.
    - Click en **“Nuevo Turno”** en la tarjeta del paciente.
  - Modal de turno se abre con paciente preseleccionado.
  - Completar médico, fecha y hora → guardar.
- **Resultado esperado**:
  - El paciente aparece asociado correctamente en el nuevo turno.

#### 5. Médico – Mis turnos y cambio de estado

- **Flujo**:
  - Iniciar sesión como médico.
  - En `Dashboard`:
    - Ver “Turnos Hoy” con pacientes, horas y estado.
  - En `Mis Turnos`:
    - Listado de todos los turnos del médico.
  - Para un turno:
    - Click en botón de lápiz (**cambiar estado**).
    - En modal, elegir nuevo estado (confirmado, en curso, completado, no asistió).
    - Guardar.
- **Resultado esperado**:
  - Cambio de estado reflejado en badges de Dashboard y `Mis turnos`.
  - Toast de éxito “Estado actualizado exitosamente”.
  - No deberían quedar estados inconsistentes (por ejemplo, no duplicar “no asistió” en backend).

#### 6. Admin – Pacientes / Médicos / Usuarios (CRUD)

- **Flujo**:
  - Iniciar sesión como admin.
  - Sección `Pacientes`:
    - Click en “Nuevo Paciente”: completar campos obligatorios (nombre, apellido, DNI, teléfono).
    - Guardar → nuevo registro en listado; validación de DNI único.
    - Editar paciente desde botón “Editar”.
  - Sección `Médicos`:
    - Click en “Nuevo Médico”: completar nombre, especialidad, matrícula, horario.
    - Guardar → alta en BD; validación de matrícula única.
    - Editar médico y verificar que cambios se reflejan.
  - Sección `Usuarios`:
    - Click en “Nuevo Usuario”: completar nombre, email, rol, contraseña.
    - Guardar → usuario creado asociado opcionalmente a médico/paciente.
    - Editar usuario desde botón “Editar”.
- **Resultado esperado**:
  - Todas las altas/ediciones/bajas impactan en BD (no en `localStorage`).
  - Mensajes de error coherentes con validaciones de backend (email duplicado, DNI/matrícula duplicados, última eliminación de admin bloqueada).

#### 7. Admin – Filtros de turnos y reportes

- **Flujo**:
  - Sección `Turnos`:
    - Probar filtros por fecha, médico, estado y combinaciones.
  - Sección `Reportes`:
    - Ver totales por estado para el mes actual.
- **Resultado esperado**:
  - Filtros actualizan tabla de turnos vía llamada a API con parámetros correctos.
  - Reportes muestran conteos coherentes con los turnos existentes.

#### 8. Logout y sesiones

- **Flujo**:
  - Desde cualquier dashboard, usar botón de logout (en header o sidebar).
  - Confirmar en modal.
- **Resultado esperado**:
  - Sesión de backend destruida (`/api/auth/logout`).
  - `localStorage` ya no contiene usuario actual.
  - Redirección a `landing.html`.

#### Casos generales de error / edge

- Usuario sin permisos (rol incorrecto) intentando acceder a dashboard de otro rol → debe redirigir a su propio dashboard o a landing.
- Formularios con campos vacíos u órdenes inválidas:
  - Toast de error claro, sin navegación ni cambios en BD.
- Errores de red / servidor (simulados desconectando la API):
  - Mensaje genérico `Error en la petición` o el mensaje de backend, sin dejar la UI en estado inconsistente.


