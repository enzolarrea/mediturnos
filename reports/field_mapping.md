### Mapeo de campos Frontend ↔ Backend (BD/API)

#### Paciente

- **Frontend (JS / API)** → **Backend (DB / PHP)**
- `id` → `pacientes.id`
- `nombre` → `pacientes.nombre`
- `apellido` → `pacientes.apellido`
- `dni` → `pacientes.dni`
- `telefono` → `pacientes.telefono`
- `email` → `pacientes.email`
- `fechaNacimiento` → `pacientes.fecha_nacimiento`
- `direccion` → `pacientes.direccion`
- `ultimaVisita` → `pacientes.ultima_visita`
- `activo` → `pacientes.activo`
- `fechaCreacion` → `pacientes.fecha_creacion`
- `fechaActualizacion` → `pacientes.fecha_actualizacion`

Notas:
- El modelo `Paciente` ya normaliza `fecha_nacimiento` → `fechaNacimiento`, `ultima_visita` → `ultimaVisita`, etc., antes de retornar al frontend.
- Al crear/actualizar desde JS se usan las claves camelCase (`fechaNacimiento`, `ultimaVisita`), que el modelo PHP mapea a las columnas snake_case.

#### Médico

- **Frontend** → **Backend**
- `id` → `medicos.id`
- `nombre` → `medicos.nombre`
- `matricula` → `medicos.matricula`
- `email` → `medicos.email`
- `telefono` → `medicos.telefono`
- `horario` → `medicos.horario`
- `activo` → `medicos.activo`
- `fechaCreacion` → `medicos.fecha_creacion`
- `fechaActualizacion` → `medicos.fecha_actualizacion`
- `especialidades` (string CSV en backend) → `GROUP_CONCAT(e.nombre)` en modelo `Medico` → expuesto como `especialidades` (string) y `especialidad`/`especialidades[]` normalizados por `MedicosManager`.
- `disponibilidad` (objeto `{ dia: { inicio, fin } }`) → tablas `medico_disponibilidad` (`dia_semana`, `hora_inicio`, `hora_fin`).

Notas:
- El modelo `Medico` devuelve `especialidades` como string con coma, y el `MedicosManager` en frontend lo convierte a:
  - `especialidad`: string (primera especialidad o join de todas).
  - `especialidades`: array de strings.
- La disponibilidad se almacena en `medico_disponibilidad` y se reconstruye en `Medico::getDisponibilidadArray` como el objeto que espera el frontend.

#### Usuario

- **Frontend** → **Backend**
- `id` → `usuarios.id`
- `nombre` → `usuarios.nombre`
- `apellido` → `usuarios.apellido`
- `email` → `usuarios.email`
- `password` (solo al crear/actualizar) → `usuarios.password`
- `rol` → `usuarios.rol` (valores: `administrador`, `secretario`, `medico`, `paciente`)
- `medicoId` → `usuarios.medico_id`
- `pacienteId` → `usuarios.paciente_id`
- `activo` → `usuarios.activo`
- `fechaCreacion` → `usuarios.fecha_creacion`
- `fechaActualizacion` → `usuarios.fecha_actualizacion`

Notas:
- El modelo `Usuario` mapea `medico_id`/`paciente_id` ↔ `medicoId`/`pacienteId` al devolver datos a JS.
- `AuthController::login` y `AuthController::register` también exponen `medicoId`/`pacienteId` en la respuesta JSON.

#### Turno

- **Frontend** → **Backend**
- `id` → `turnos.id`
- `pacienteId` → `turnos.paciente_id`
- `medicoId` → `turnos.medico_id`
- `fecha` → `turnos.fecha`
- `hora` → `turnos.hora`
- `motivo` → `turnos.motivo`
- `notas` → `turnos.notas`
- `estado` / `estadoCodigo` → `turnos.estado_id` (relación con `turno_estados.codigo`)
- `estadoNombre` → `turno_estados.nombre`
- `fechaCreacion` → `turnos.fecha_creacion`
- `fechaActualizacion` → `turnos.fecha_actualizacion`

Notas:
- El modelo `Turno` hace el mapping `estado_codigo` → `estado`/`estadoCodigo` y oculta los campos internos (`estado_id`, etc.).
- En creación/actualización desde JS se envía `estado` como código (`pendiente`, `confirmado`, `cancelado`, etc.), que `Turno::getEstadoId` traduce a `turno_estados.id`.

#### Inconsistencias detectadas / a vigilar

- **Especialidad de médico**:
  - Backend trabaja con múltiples especialidades (`especialidades` en CSV y tabla relacional).
  - Frontend a veces espera `especialidad` como string simple, otras `especialidades` como array.
  - El `MedicosManager` ya normaliza ambos, pero cualquier nuevo consumo debe utilizar preferentemente `especialidades[]`.
- **Fechas de paciente**:
  - Al registrar desde landing se ingresa la fecha como `DD/MM/YYYY`, se transforma a `YYYY-MM-DD` antes de mandar a la API.
  - En BD se guarda como `DATE` (`fecha_nacimiento`), y el modelo la expone como `fechaNacimiento` en formato `YYYY-MM-DD`; la UI debe formatearla si quiere mostrarla en otro formato.

Este mapeo se usará como referencia para validar que las llamadas de los managers JS (`PacientesManager`, `MedicosManager`, `UsuariosManager`, `TurnosManager`) coincidan con los nombres de campos esperados por los modelos PHP y evitar bugs silenciosos por nombres desalineados.


