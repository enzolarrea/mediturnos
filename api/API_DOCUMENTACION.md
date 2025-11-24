# 📚 Documentación Completa de la API MediTurnos

## 🔗 Base URL
```
http://localhost/mediturnos/api
```

## 🔐 Autenticación

La mayoría de los endpoints requieren autenticación mediante sesión PHP. Solo los endpoints de `auth/login` y `auth/register` son públicos.

---

## 📋 Índice de Endpoints

### 🔑 Autenticación (`/auth`)
- [POST /auth/login](#post-authlogin)
- [POST /auth/register](#post-authregister)
- [POST /auth/logout](#post-authlogout)
- [GET /auth/me](#get-authme)

### 👥 Usuarios (`/usuario`)
- [GET /usuario](#get-usuario)
- [GET /usuario/:id](#get-usuarioid)
- [POST /usuario](#post-usuario)
- [PUT /usuario/:id](#put-usuarioid)
- [DELETE /usuario/:id](#delete-usuarioid)
- [POST /usuario/:id/change-password](#post-usuarioidchange-password)

### 👨‍⚕️ Médicos (`/medico`)
- [GET /medico](#get-medico)
- [GET /medico/:id](#get-medicoid)
- [POST /medico](#post-medico)
- [PUT /medico/:id](#put-medicoid)
- [DELETE /medico/:id](#delete-medicoid)
- [GET /medico/:id/disponibilidad](#get-medicoiddisponibilidad)
- [GET /medico/:id/horarios-disponibles](#get-medicoidhorarios-disponibles)
- [GET /medico/especialidades](#get-medicoespecialidades)

### 👤 Pacientes (`/paciente`)
- [GET /paciente](#get-paciente)
- [GET /paciente/:id](#get-pacienteid)
- [POST /paciente](#post-paciente)
- [PUT /paciente/:id](#put-pacienteid)
- [DELETE /paciente/:id](#delete-pacienteid)
- [GET /paciente/:id/historial](#get-pacienteidhistorial)

### 📅 Turnos (`/turno`)
- [GET /turno](#get-turno)
- [GET /turno/:id](#get-turnoid)
- [POST /turno](#post-turno)
- [PUT /turno/:id](#put-turnoid)
- [DELETE /turno/:id](#delete-turnoid)
- [GET /turno/del-dia](#get-turnodel-dia)
- [GET /turno/proximos](#get-turnoproximos)
- [GET /turno/estadisticas](#get-turnoestadisticas)

### 🔔 Notificaciones (`/notificacion`)
- [GET /notificacion](#get-notificacion)
- [POST /notificacion](#post-notificacion)
- [PUT /notificacion/:id/read](#put-notificacionidread)
- [PUT /notificacion/read-all](#put-notificacionread-all)

---

## 🔑 Autenticación

### POST /auth/login

Iniciar sesión.

**Request Body:**
```json
{
  "email": "admin@mediturnos.com",
  "password": "Admin123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "nombre": "Admin",
    "apellido": "Sistema",
    "email": "admin@mediturnos.com",
    "rol": "administrador",
    "medicoId": null,
    "pacienteId": null,
    "activo": true
  }
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/auth/login
Content-Type: application/json

{
  "email": "admin@mediturnos.com",
  "password": "Admin123"
}
```

---

### POST /auth/register

Registrar nuevo usuario.

**Request Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "rol": "paciente",
  "dni": "12345678",
  "telefono": "1234567890",
  "fechaNacimiento": "1990-01-01",
  "direccion": "Calle 123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Registro exitoso",
  "user": {
    "id": 5,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "rol": "paciente",
    "pacienteId": 3,
    "activo": true
  }
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/auth/register
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "rol": "paciente"
}
```

---

### POST /auth/logout

Cerrar sesión.

**Response 200:**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/auth/logout
```

---

### GET /auth/me

Obtener información del usuario actual.

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "nombre": "Admin",
    "apellido": "Sistema",
    "email": "admin@mediturnos.com",
    "rol": "administrador"
  }
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/auth/me
```

---

## 👥 Usuarios

### GET /usuario

Listar todos los usuarios (con filtros opcionales).

**Query Parameters:**
- `rol` (string): Filtrar por rol (administrador, medico, paciente)
- `activo` (boolean): Filtrar por estado activo
- `search` (string): Buscar por nombre, apellido o email

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Admin",
      "apellido": "Sistema",
      "email": "admin@mediturnos.com",
      "rol": "administrador",
      "activo": true
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/usuario?rol=medico&activo=true
```

---

### GET /usuario/:id

Obtener un usuario por ID.

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "nombre": "Admin",
    "apellido": "Sistema",
    "email": "admin@mediturnos.com",
    "rol": "administrador"
  }
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/usuario/1
```

---

### POST /usuario

Crear nuevo usuario.

**Request Body:**
```json
{
  "nombre": "Dr. Carlos",
  "apellido": "García",
  "email": "carlos@example.com",
  "password": "password123",
  "rol": "medico",
  "medicoId": 2
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "user": {
    "id": 6,
    "nombre": "Dr. Carlos",
    "apellido": "García",
    "email": "carlos@example.com",
    "rol": "medico"
  }
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/usuario
Content-Type: application/json

{
  "nombre": "Dr. Carlos",
  "apellido": "García",
  "email": "carlos@example.com",
  "password": "password123",
  "rol": "medico"
}
```

---

### PUT /usuario/:id

Actualizar usuario.

**Request Body:**
```json
{
  "nombre": "Dr. Carlos",
  "apellido": "García López",
  "activo": true
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "user": {
    "id": 6,
    "nombre": "Dr. Carlos",
    "apellido": "García López"
  }
}
```

**Postman:**
```
PUT http://localhost/mediturnos/api/usuario/6
Content-Type: application/json

{
  "nombre": "Dr. Carlos",
  "apellido": "García López"
}
```

---

### DELETE /usuario/:id

Eliminar usuario (soft delete).

**Response 200:**
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

**Postman:**
```
DELETE http://localhost/mediturnos/api/usuario/6
```

---

### POST /usuario/:id/change-password

Cambiar contraseña de usuario.

**Request Body:**
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/usuario/1/change-password
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

---

## 👨‍⚕️ Médicos

### GET /medico

Listar todos los médicos (con filtros opcionales).

**Query Parameters:**
- `activo` (boolean): Filtrar por estado activo
- `especialidad` (string): Filtrar por especialidad
- `search` (string): Buscar por nombre, matrícula o especialidad

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Dr. Juan Pérez",
      "matricula": "MP12345",
      "email": "juan@example.com",
      "telefono": "1234567890",
      "especialidades": "Cardiología, Medicina General",
      "activo": true,
      "disponibilidad": {
        "lunes": {"inicio": "08:00", "fin": "12:00"},
        "miercoles": {"inicio": "14:00", "fin": "18:00"}
      }
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/medico?activo=true&especialidad=Cardiología
```

---

### GET /medico/:id

Obtener un médico por ID.

**Response 200:**
```json
{
  "success": true,
  "medico": {
    "id": 1,
    "nombre": "Dr. Juan Pérez",
    "matricula": "MP12345",
    "email": "juan@example.com",
    "especialidades": "Cardiología, Medicina General",
    "disponibilidad": {
      "lunes": {"inicio": "08:00", "fin": "12:00"}
    }
  }
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/medico/1
```

---

### POST /medico

Crear nuevo médico.

**Request Body:**
```json
{
  "nombre": "Dr. María López",
  "matricula": "MP67890",
  "email": "maria@example.com",
  "telefono": "0987654321",
  "horario": "Lunes a Viernes 8:00-18:00",
  "especialidades": [1, 2],
  "disponibilidad": {
    "lunes": {"inicio": "08:00", "fin": "12:00"},
    "miercoles": {"inicio": "14:00", "fin": "18:00"}
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Médico creado exitosamente",
  "medico": {
    "id": 2,
    "nombre": "Dr. María López",
    "matricula": "MP67890"
  }
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/medico
Content-Type: application/json

{
  "nombre": "Dr. María López",
  "matricula": "MP67890",
  "email": "maria@example.com",
  "especialidades": [1, 2]
}
```

---

### PUT /medico/:id

Actualizar médico.

**Request Body:**
```json
{
  "nombre": "Dr. María López García",
  "telefono": "0987654321",
  "activo": true
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Médico actualizado exitosamente",
  "medico": {
    "id": 2,
    "nombre": "Dr. María López García"
  }
}
```

**Postman:**
```
PUT http://localhost/mediturnos/api/medico/2
Content-Type: application/json

{
  "nombre": "Dr. María López García"
}
```

---

### DELETE /medico/:id

Eliminar médico (soft delete).

**Response 200:**
```json
{
  "success": true,
  "message": "Médico eliminado exitosamente"
}
```

**Postman:**
```
DELETE http://localhost/mediturnos/api/medico/2
```

---

### GET /medico/:id/disponibilidad

Obtener disponibilidad de un médico en una fecha específica.

**Query Parameters:**
- `fecha` (string): Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)

**Response 200:**
```json
{
  "success": true,
  "disponible": true,
  "turnosOcupados": 3,
  "turnos": [
    {
      "id": 1,
      "fecha": "2025-11-25",
      "hora": "09:00",
      "pacienteId": 1
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/medico/1/disponibilidad?fecha=2025-11-25
```

---

### GET /medico/:id/horarios-disponibles

Obtener horarios disponibles de un médico en una fecha.

**Query Parameters:**
- `fecha` (string): Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)

**Response 200:**
```json
{
  "success": true,
  "data": [
    "08:00",
    "08:30",
    "09:30",
    "10:00",
    "10:30"
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/medico/1/horarios-disponibles?fecha=2025-11-25
```

---

### GET /medico/especialidades

Obtener lista de especialidades disponibles.

**Response 200:**
```json
{
  "success": true,
  "data": [
    "Cardiología",
    "Medicina General",
    "Pediatría"
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/medico/especialidades
```

---

## 👤 Pacientes

### GET /paciente

Listar todos los pacientes (con filtros opcionales).

**Query Parameters:**
- `activo` (boolean): Filtrar por estado activo
- `search` (string): Buscar por nombre, apellido, DNI o email

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "dni": "12345678",
      "telefono": "1234567890",
      "email": "juan@example.com",
      "fechaNacimiento": "1990-01-01",
      "ultimaVisita": "2025-11-20",
      "activo": true
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/paciente?activo=true&search=Juan
```

---

### GET /paciente/:id

Obtener un paciente por ID.

**Response 200:**
```json
{
  "success": true,
  "paciente": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "dni": "12345678",
    "email": "juan@example.com"
  }
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/paciente/1
```

---

### POST /paciente

Crear nuevo paciente.

**Request Body:**
```json
{
  "nombre": "María",
  "apellido": "González",
  "dni": "87654321",
  "telefono": "0987654321",
  "email": "maria@example.com",
  "fechaNacimiento": "1985-05-15",
  "direccion": "Av. Principal 456"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Paciente creado exitosamente",
  "paciente": {
    "id": 2,
    "nombre": "María",
    "apellido": "González",
    "dni": "87654321"
  }
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/paciente
Content-Type: application/json

{
  "nombre": "María",
  "apellido": "González",
  "dni": "87654321",
  "email": "maria@example.com"
}
```

---

### PUT /paciente/:id

Actualizar paciente.

**Request Body:**
```json
{
  "nombre": "María",
  "apellido": "González López",
  "telefono": "0987654321"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Paciente actualizado exitosamente",
  "paciente": {
    "id": 2,
    "nombre": "María",
    "apellido": "González López"
  }
}
```

**Postman:**
```
PUT http://localhost/mediturnos/api/paciente/2
Content-Type: application/json

{
  "nombre": "María",
  "apellido": "González López"
}
```

---

### DELETE /paciente/:id

Eliminar paciente (soft delete).

**Response 200:**
```json
{
  "success": true,
  "message": "Paciente eliminado exitosamente"
}
```

**Postman:**
```
DELETE http://localhost/mediturnos/api/paciente/2
```

---

### GET /paciente/:id/historial

Obtener historial de turnos de un paciente.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fecha": "2025-11-20",
      "hora": "10:00",
      "medicoId": 1,
      "estado": "completado",
      "motivo": "Consulta general"
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/paciente/1/historial
```

---

## 📅 Turnos

### GET /turno

Listar todos los turnos (con filtros opcionales).

**Query Parameters:**
- `fecha` (string): Filtrar por fecha (YYYY-MM-DD)
- `medicoId` (int): Filtrar por médico
- `pacienteId` (int): Filtrar por paciente
- `estado` (string): Filtrar por estado (pendiente, confirmado, completado, cancelado, no_asistio)
- `desde` (string): Fecha inicio (YYYY-MM-DD)
- `hasta` (string): Fecha fin (YYYY-MM-DD)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "pacienteId": 1,
      "medicoId": 1,
      "fecha": "2025-11-25",
      "hora": "10:00",
      "motivo": "Consulta general",
      "estado": "pendiente",
      "estadoCodigo": "pendiente",
      "estadoNombre": "Pendiente"
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/turno?fecha=2025-11-25&estado=pendiente
```

---

### GET /turno/:id

Obtener un turno por ID.

**Response 200:**
```json
{
  "success": true,
  "turno": {
    "id": 1,
    "pacienteId": 1,
    "medicoId": 1,
    "fecha": "2025-11-25",
    "hora": "10:00",
    "estado": "pendiente"
  }
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/turno/1
```

---

### POST /turno

Crear nuevo turno.

**Request Body:**
```json
{
  "pacienteId": 1,
  "medicoId": 1,
  "fecha": "2025-11-25",
  "hora": "10:00",
  "motivo": "Consulta general",
  "notas": "Primera consulta"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Turno creado exitosamente",
  "turno": {
    "id": 1,
    "pacienteId": 1,
    "medicoId": 1,
    "fecha": "2025-11-25",
    "hora": "10:00",
    "estado": "pendiente"
  }
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/turno
Content-Type: application/json

{
  "pacienteId": 1,
  "medicoId": 1,
  "fecha": "2025-11-25",
  "hora": "10:00",
  "motivo": "Consulta general"
}
```

---

### PUT /turno/:id

Actualizar turno.

**Request Body:**
```json
{
  "fecha": "2025-11-26",
  "hora": "11:00",
  "estado": "confirmado",
  "motivo": "Consulta de seguimiento"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Turno actualizado exitosamente",
  "turno": {
    "id": 1,
    "fecha": "2025-11-26",
    "hora": "11:00",
    "estado": "confirmado"
  }
}
```

**Postman:**
```
PUT http://localhost/mediturnos/api/turno/1
Content-Type: application/json

{
  "estado": "confirmado"
}
```

---

### DELETE /turno/:id

Cancelar turno.

**Response 200:**
```json
{
  "success": true,
  "message": "Turno cancelado exitosamente"
}
```

**Postman:**
```
DELETE http://localhost/mediturnos/api/turno/1
```

---

### GET /turno/del-dia

Obtener turnos del día.

**Query Parameters:**
- `fecha` (string): Fecha en formato YYYY-MM-DD (opcional, por defecto hoy)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fecha": "2025-11-25",
      "hora": "10:00",
      "pacienteId": 1,
      "medicoId": 1
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/turno/del-dia?fecha=2025-11-25
```

---

### GET /turno/proximos

Obtener próximos turnos.

**Query Parameters:**
- `limit` (int): Número de turnos a retornar (opcional, por defecto 5)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fecha": "2025-11-25",
      "hora": "10:00",
      "pacienteId": 1,
      "medicoId": 1
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/turno/proximos?limit=10
```

---

### GET /turno/estadisticas

Obtener estadísticas de turnos.

**Query Parameters:**
- `fechaInicio` (string): Fecha inicio (YYYY-MM-DD, opcional, por defecto inicio del mes)
- `fechaFin` (string): Fecha fin (YYYY-MM-DD, opcional, por defecto fin del mes)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pendientes": 10,
    "confirmados": 20,
    "completados": 15,
    "cancelados": 3,
    "noAsistio": 2
  }
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/turno/estadisticas?fechaInicio=2025-11-01&fechaFin=2025-11-30
```

---

## 🔔 Notificaciones

### GET /notificacion

Obtener notificaciones del usuario actual.

**Query Parameters:**
- `unread` (boolean): Solo no leídas (opcional)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "mensaje": "Tienes un turno mañana a las 10:00",
      "tipo": "info",
      "read": false,
      "fecha": "2025-11-24 10:00:00"
    }
  ]
}
```

**Postman:**
```
GET http://localhost/mediturnos/api/notificacion?unread=true
```

---

### POST /notificacion

Crear nueva notificación.

**Request Body:**
```json
{
  "userId": 1,
  "message": "Tienes un turno mañana a las 10:00",
  "type": "info"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Notificación creada exitosamente",
  "id": 1
}
```

**Postman:**
```
POST http://localhost/mediturnos/api/notificacion
Content-Type: application/json

{
  "userId": 1,
  "message": "Tienes un turno mañana a las 10:00",
  "type": "info"
}
```

---

### PUT /notificacion/:id/read

Marcar notificación como leída.

**Response 200:**
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

**Postman:**
```
PUT http://localhost/mediturnos/api/notificacion/1/read
```

---

### PUT /notificacion/read-all

Marcar todas las notificaciones como leídas.

**Response 200:**
```json
{
  "success": true,
  "message": "Todas las notificaciones marcadas como leídas",
  "count": 5
}
```

**Postman:**
```
PUT http://localhost/mediturnos/api/notificacion/read-all
```

---

## 📝 Notas Importantes

1. **Autenticación**: La mayoría de los endpoints requieren estar autenticado. Usa `/auth/login` primero.

2. **Sesiones**: La API usa sesiones PHP. Asegúrate de mantener las cookies de sesión en Postman.

3. **CORS**: Si pruebas desde un frontend, configura los orígenes permitidos en `api/config/database.php`.

4. **Errores**: Todos los errores retornan formato JSON:
   ```json
   {
     "success": false,
     "message": "Mensaje de error"
   }
   ```

5. **Filtros**: Muchos endpoints GET aceptan parámetros de query string para filtrar resultados.

6. **Soft Delete**: Los endpoints DELETE no eliminan físicamente los registros, solo los marcan como inactivos.

---

## 🧪 Colección de Postman

Para facilitar las pruebas, puedes importar esta colección en Postman. Crea una colección con estos endpoints y configura:

- **Variable de entorno**: `base_url` = `http://localhost/mediturnos/api`
- **Headers por defecto**: `Content-Type: application/json`

---

## ✅ Checklist de Pruebas

### Autenticación
- [ ] POST /auth/login
- [ ] POST /auth/register
- [ ] GET /auth/me
- [ ] POST /auth/logout

### Usuarios
- [ ] GET /usuario
- [ ] GET /usuario/:id
- [ ] POST /usuario
- [ ] PUT /usuario/:id
- [ ] DELETE /usuario/:id

### Médicos
- [ ] GET /medico
- [ ] GET /medico/:id
- [ ] POST /medico
- [ ] GET /medico/:id/disponibilidad
- [ ] GET /medico/:id/horarios-disponibles
- [ ] GET /medico/especialidades

### Pacientes
- [ ] GET /paciente
- [ ] GET /paciente/:id
- [ ] POST /paciente
- [ ] GET /paciente/:id/historial

### Turnos
- [ ] GET /turno
- [ ] POST /turno
- [ ] GET /turno/del-dia
- [ ] GET /turno/proximos
- [ ] GET /turno/estadisticas

### Notificaciones
- [ ] GET /notificacion
- [ ] POST /notificacion
- [ ] PUT /notificacion/:id/read

---

**Última actualización**: 2025-11-24

