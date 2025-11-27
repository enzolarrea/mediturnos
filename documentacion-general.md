## Documentación General de MediTurnos

### 1. Visión General

MediTurnos es un sistema de gestión de turnos médicos que integra:

- **Frontend web** basado en HTML, CSS y JavaScript modular (ES Modules).
- **Backend PHP** con una API REST que expone endpoints para autenticación, usuarios, médicos, pacientes, turnos y notificaciones.
- **Base de datos MySQL** con tablas normalizadas, triggers y vistas para garantizar integridad, estadísticas y notificaciones automáticas.

El sistema ofrece dashboards separados según el rol del usuario (administrador, secretario, médico y paciente), todos construidos sobre una misma API y un conjunto común de componentes de UI.


### 2. Componentes Principales

- **Landing pública (`landing.html` + `js/views/landing.js`)**
  - Presenta el producto, muestra métricas de ejemplo (turnos de hoy, pacientes y médicos activos) y permite:
    - Iniciar sesión.
    - Registrarse como paciente.
    - Ver información adicional (acerca de, precios, soporte, privacidad, términos) mediante modales.

- **Dashboards por rol (`views/*/dashboard.html` + `js/views/*/dashboard.js`)**
  - Cada rol tiene su propia interfaz, pero comparten:
    - Layout con sidebar, header y contenido principal.
    - Inicialización global de la app (`js/app.js`).
    - Uso de managers de negocio (turnos, pacientes, médicos, usuarios) y modales reutilizables.

- **Módulos de negocio en JS (`js/modules/*.js`)**
  - Encapsulan la lógica de interacción con la API y la transformación de datos para:
    - Turnos, médicos, pacientes, usuarios, almacenamiento local, autenticación, notificaciones y routing.

- **API backend (`api/`)**
  - `api/index.php` actúa como router central, mapeando rutas REST a métodos de controladores.
  - Controladores en `api/controllers/` implementan la lógica de cada recurso.
  - Modelos en `api/models/` encapsulan el acceso a la base de datos mediante PDO.

- **Base de datos (`db/mediturnos.sql`)**
  - Define tablas para usuarios, pacientes, médicos, especialidades, disponibilidad, turnos, estados de turnos y notificaciones.
  - Incluye vistas y triggers para:
    - Validar conflictos de turnos (mismo médico/fecha/hora).
    - Actualizar automáticamente la última visita del paciente.
    - Generar notificaciones cuando se crean o confirman turnos.


### 3. Roles y Experiencia de Usuario

- **Administrador**
  - Accede al dashboard de administración.
  - Ve estadísticas globales (turnos del día, cantidad de pacientes, médicos y usuarios).
  - Gestiona turnos, pacientes, médicos y usuarios.
  - Consulta reportes y estadísticas de turnos en el mes actual.

- **Secretario**
  - Gestiona el día a día de los turnos.
  - Puede crear, editar y cancelar turnos.
  - Gestiona pacientes.
  - Cuenta con un calendario mensual de turnos para visualizar la carga por día.

- **Médico**
  - Ve sus turnos de hoy y sus turnos históricos.
  - Cambia el estado de sus turnos (pendiente, confirmado, en curso, completado, no asistió).
  - Consulta pacientes que atiende y su historial de turnos.
  - Visualiza y edita su disponibilidad y datos básicos.

- **Paciente**
  - Ve próximos turnos y su historial de atención.
  - Reserva nuevos turnos seleccionando médico, fecha y hora disponible.
  - Cancela sus propios turnos (cuando corresponda).
  - Consulta y edita sus datos de perfil.


### 4. Interacción Frontend–Backend

- El frontend usa el cliente `ApiClient` (`js/modules/api.js`) para comunicarse con la API:
  - Base URL fija: `/mediturnos/api`.
  - Todas las peticiones incluyen credenciales (`credentials: 'include'`) para aprovechar la sesión PHP.
  - Manejo estándar de respuestas JSON con convenciones `success`, `message`, `data`.

- La API en PHP:
  - Inicia sesión PHP y configura CORS y `Content-Type` en `api/config/database.php`.
  - Usa `api/index.php` para:
    - Parsear la URL.
    - Resolver controlador y método.
    - Ejecutar el método adecuado según HTTP method (`GET`, `POST`, `PUT`, `DELETE`) y segmentos de la ruta.


### 5. Flujo Alto Nivel del Sistema

1. **Acceso inicial**
   - El usuario accede a `landing.html`, ve la información del producto y puede iniciar sesión o registrarse.

2. **Autenticación**
   - El login y el registro se realizan contra los endpoints `/api/auth/login` y `/api/auth/register`.
   - Al autenticarse correctamente:
     - El backend crea/usa la sesión PHP.
     - El frontend guarda los datos del usuario actual en `localStorage` (`mediturnos_current_user`).

3. **Redirección según rol**
   - Según el rol (`administrador`, `secretario`, `medico`, `paciente`), el frontend redirige al dashboard correspondiente dentro de `views/*/dashboard.html`.

4. **Trabajo diario**
   - Cada rol interactúa con el backend a través de sus respectivos dashboards:
     - Creación, edición, cancelación y consulta de turnos.
     - Gestión de pacientes, médicos y usuarios (según rol).
     - Visualización de estadísticas y calendario.

5. **Persistencia e integridad**
   - La base de datos asegura:
     - Unicidad de emails, DNIs y matrículas.
     - Coherencia de relaciones (por ejemplo, usuarios de tipo médico/paciente deben estar vinculados a un registro `medicos`/`pacientes`).
     - No superposición de turnos para un mismo médico/fecha/hora.
     - Actualización automática de `ultima_visita` y creación de notificaciones.


### 6. Alcance de la Documentación

Esta documentación general resume:

- La arquitectura global (frontend, backend, base de datos).
- Los componentes clave del proyecto y cómo se relacionan.
- La experiencia y las capacidades de cada rol dentro del sistema.
- El flujo principal de autenticación y acceso a dashboards.

Para detalles más específicos sobre estructura de carpetas, archivos individuales, flujos por rol y funcionalidades clave (turnos, calendario, etc.), se complementa con:

- `estructura-del-proyecto.md`
- `flujos-del-sistema.md`
- `funcionalidades-clave.md`


