# 🗺️ Mapa Completo de Endpoints - API MediTurnos

## 📍 Base URL
```
http://localhost/mediturnos/api
```

---

## 📊 Tabla Resumen de Endpoints

| Método | Ruta | Controlador | Método | Descripción | Auth |
|--------|------|-------------|--------|-------------|------|
| **AUTENTICACIÓN** |
| POST | `/auth/login` | AuthController | login() | Iniciar sesión | ❌ |
| POST | `/auth/register` | AuthController | register() | Registrar usuario | ❌ |
| POST | `/auth/logout` | AuthController | logout() | Cerrar sesión | ✅ |
| GET | `/auth/me` | AuthController | me() | Usuario actual | ✅ |
| GET | `/auth` | AuthController | index() | Info del endpoint | ❌ |
| **USUARIOS** |
| GET | `/usuario` | UsuarioController | index() | Listar usuarios | ✅ |
| GET | `/usuario/:id` | UsuarioController | show($id) | Obtener usuario | ✅ |
| POST | `/usuario` | UsuarioController | store() | Crear usuario | ✅ |
| PUT | `/usuario/:id` | UsuarioController | update($id) | Actualizar usuario | ✅ |
| DELETE | `/usuario/:id` | UsuarioController | destroy($id) | Eliminar usuario | ✅ |
| POST | `/usuario/:id/change-password` | UsuarioController | changePassword($id) | Cambiar contraseña | ✅ |
| **MÉDICOS** |
| GET | `/medico` | MedicoController | index() | Listar médicos | ✅ |
| GET | `/medico/:id` | MedicoController | show($id) | Obtener médico | ✅ |
| POST | `/medico` | MedicoController | store() | Crear médico | ✅ |
| PUT | `/medico/:id` | MedicoController | update($id) | Actualizar médico | ✅ |
| DELETE | `/medico/:id` | MedicoController | destroy($id) | Eliminar médico | ✅ |
| GET | `/medico/:id/disponibilidad` | MedicoController | disponibilidad($id) | Disponibilidad médico | ✅ |
| GET | `/medico/:id/horarios-disponibles` | MedicoController | horariosDisponibles($id) | Horarios disponibles | ✅ |
| GET | `/medico/especialidades` | MedicoController | especialidades() | Lista especialidades | ✅ |
| **PACIENTES** |
| GET | `/paciente` | PacienteController | index() | Listar pacientes | ✅ |
| GET | `/paciente/:id` | PacienteController | show($id) | Obtener paciente | ✅ |
| POST | `/paciente` | PacienteController | store() | Crear paciente | ✅ |
| PUT | `/paciente/:id` | PacienteController | update($id) | Actualizar paciente | ✅ |
| DELETE | `/paciente/:id` | PacienteController | destroy($id) | Eliminar paciente | ✅ |
| GET | `/paciente/:id/historial` | PacienteController | historial($id) | Historial turnos | ✅ |
| **TURNOS** |
| GET | `/turno` | TurnoController | index() | Listar turnos | ✅ |
| GET | `/turno/:id` | TurnoController | show($id) | Obtener turno | ✅ |
| POST | `/turno` | TurnoController | store() | Crear turno | ✅ |
| PUT | `/turno/:id` | TurnoController | update($id) | Actualizar turno | ✅ |
| DELETE | `/turno/:id` | TurnoController | destroy($id) | Cancelar turno | ✅ |
| GET | `/turno/del-dia` | TurnoController | delDia() | Turnos del día | ✅ |
| GET | `/turno/proximos` | TurnoController | proximos() | Próximos turnos | ✅ |
| GET | `/turno/estadisticas` | TurnoController | estadisticas() | Estadísticas | ✅ |
| **NOTIFICACIONES** |
| GET | `/notificacion` | NotificacionController | index() | Listar notificaciones | ✅ |
| POST | `/notificacion` | NotificacionController | store() | Crear notificación | ✅ |
| PUT | `/notificacion/:id/read` | NotificacionController | read($id) | Marcar como leída | ✅ |
| PUT | `/notificacion/read-all` | NotificacionController | readAll() | Marcar todas leídas | ✅ |

---

## 🔍 Parámetros de Query Comunes

### Filtros Generales
- `search` (string): Búsqueda por texto
- `activo` (boolean): Filtrar por estado activo/inactivo

### Filtros Específicos

#### Turnos
- `fecha` (YYYY-MM-DD): Filtrar por fecha específica
- `medicoId` (int): Filtrar por médico
- `pacienteId` (int): Filtrar por paciente
- `estado` (string): pendiente, confirmado, completado, cancelado, no_asistio
- `desde` (YYYY-MM-DD): Fecha inicio rango
- `hasta` (YYYY-MM-DD): Fecha fin rango

#### Médicos
- `especialidad` (string): Filtrar por especialidad

#### Notificaciones
- `unread` (boolean): Solo no leídas

---

## 📝 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 400 | Bad Request - Error en los datos enviados |
| 401 | Unauthorized - No autenticado |
| 404 | Not Found - Recurso no encontrado |
| 405 | Method Not Allowed - Método HTTP no permitido |
| 500 | Internal Server Error - Error del servidor |

---

## 🔐 Autenticación

### Endpoints Públicos (No requieren autenticación)
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth` (info)

### Endpoints Protegidos (Requieren autenticación)
Todos los demás endpoints requieren estar autenticado mediante sesión PHP.

---

## 📦 Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Mensaje opcional",
  "data": { ... } // o directamente los datos
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Mensaje de error"
}
```

---

## 🧪 Orden Recomendado de Pruebas

1. **Autenticación**
   - POST /auth/login
   - GET /auth/me

2. **Médicos**
   - GET /medico
   - GET /medico/1
   - GET /medico/especialidades

3. **Pacientes**
   - GET /paciente
   - POST /paciente
   - GET /paciente/1

4. **Turnos**
   - GET /turno
   - POST /turno
   - GET /turno/del-dia
   - GET /turno/proximos

5. **Usuarios** (solo admin)
   - GET /usuario
   - GET /usuario/1

6. **Notificaciones**
   - GET /notificacion
   - POST /notificacion

---

## 📁 Archivos del Backend

### Controladores
- `api/controllers/AuthController.php`
- `api/controllers/UsuarioController.php`
- `api/controllers/MedicoController.php`
- `api/controllers/PacienteController.php`
- `api/controllers/TurnoController.php`
- `api/controllers/NotificacionController.php`

### Modelos
- `api/models/Usuario.php`
- `api/models/Medico.php`
- `api/models/Paciente.php`
- `api/models/Turno.php`
- `api/models/Notificacion.php`
- `api/models/Especialidad.php`

### Configuración
- `api/config/database.php`
- `api/index.php` (Router)
- `api/.htaccess`

---

**Última actualización**: 2025-11-24

