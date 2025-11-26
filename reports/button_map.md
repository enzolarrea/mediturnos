### Mapa de botones / acciones de UI → lógica JS

Formato columnas:

- **Selector**: id/clase/atributo HTML del botón.
- **JS actual**: archivo JS y función que maneja la acción.
- **JS legacy / referencia**: módulo/función basada en `localStorage` relevante.
- **Estado actual (estimado)**: funciona / falla / parcialmente / no implementado.
- **Recomendación inmediata**: parche principal sugerido.

> Nota: el estado se basa en inspección de código. Los casos marcados como *falla* suelen usar funciones `async` como si fueran síncronas o todavía escriben en `localStorage` en vez de usar la API/BD.

| Selector / Botón | JS actual (archivo / función) | JS legacy / referencia | Estado actual (estimado) | Recomendación inmediata |
| --- | --- | --- | --- | --- |
| `.btn-logout` en `views/*/dashboard.html` | `window.logout` en `js/views/paciente/dashboard.js`, `js/views/secretario/dashboard.js`, `js/views/medico/dashboard.js`, `js/views/admin/dashboard.js` | `AuthManager.logout` (`js/modules/auth.js`) | Parcialmente | Unificar logout para llamar también a `ApiClient.logout()` y luego limpiar `localStorage`; centralizar en un único helper. |
| `.sidebar-toggle` en dashboards | `MediTurnosApp.initUI` en `js/app.js` | N/A | Funciona | Mantener; solo UI. |
| `button.btn-primary#newAppointmentBtn` (Admin/Secretario) | `openAppointmentModal()` en `js/views/admin/dashboard.js` y `js/views/secretario/dashboard.js` → `ModalManager.openTurnoModal()` | `ModalManager.openTurnoModal/saveTurno` (usa `PacientesManager`/`MedicosManager` y `TurnosManager`) | Falla / Parcial | Hacer `openTurnoModal/saveTurno` totalmente `async` y usar `await` sobre managers basados en API; migrar `saveTurno` a `await TurnosManager.create/update`. |
| `button#addAppointmentBtn2` (Admin/Secretario) | Igual que `#newAppointmentBtn` | Igual | Falla / Parcial | Idem anterior. |
| `button#addPacienteBtn` (Admin/Secretario) | `ModalManager.openPacienteModal()` desde dashboards | `PacientesManager.create/update` (`localStorage`) | Falla / Parcial | Cambiar `PacientesManager.create/update/delete` para usar `/api/paciente` vía `ApiClient`; hacer `ModalManager.savePaciente` `async` + `await`. |
| `button#addMedicoBtn` (Admin) | `ModalManager.openMedicoModal()` | `MedicosManager.create/update` (`localStorage`) | Falla / Parcial | Migrar a endpoints `/api/medico`; adaptar `ModalManager.saveMedico` para usar API. |
| `button#addUsuarioBtn` (Admin) | `ModalManager.openUsuarioModal()` | `UsuariosManager.create/update` (`localStorage`) | Falla / Parcial | Crear cliente API para `/api/usuario` y reemplazar `UsuariosManager` legacy en `saveUsuario`. |
| `.nav-item[data-section="..."]` (Admin) | `AdminDashboard.setupNavigation()` → `loadDashboard/loadTurnos/...` (`js/views/admin/dashboard.js`) | Managers `TurnosManager`, `PacientesManager`, `MedicosManager`, `UsuariosManager` | Falla / Parcial (usan métodos `async` de forma síncrona) | Volver todos los métodos de carga `async` y usar `await` en llamadas a managers; migrar `UsuariosManager` a API. |
| Botón cancelar turno en tablas admin (`onclick="cancelTurno(id)"`) | `window.cancelTurno` en `js/views/admin/dashboard.js` → `TurnosManager.cancel(id)` | Legacy cancelación local | Falla | Hacer función `async`, usar `ModalManager.confirm`, `await TurnosManager.cancel(id)` y recargar `loadTurnos/loadDashboard`. |
| `button.btn-icon[onclick="editTurno(id)"]` (Admin/Secretario) | `window.editTurno` en `js/views/admin/dashboard.js` y `js/views/secretario/dashboard.js` → `ModalManager.openTurnoModal(turno)` | `TurnosManager.getById` (API, async) | Falla | Hacer funciones `async` y usar `const turno = await TurnosManager.getById(id);` antes de abrir modal. |
| `button.btn-primary.btn-sm[onclick="nuevoTurnoPaciente(id)"]` (Secretario) | `window.nuevoTurnoPaciente` en `js/views/secretario/dashboard.js` → `ModalManager.openTurnoModal(null, id)` | `PacientesManager.getAll`, `MedicosManager.getAll` legacy | Parcial | Depende de que `openTurnoModal` use managers API con `await`; ajustar después de migrar managers. |
| `.nav-item[data-section="dashboard/turnos/pacientes/calendario"]` (Secretario) | `SecretarioDashboard.setupNavigation()` + `loadDashboard/loadTurnos/loadPacientes` (`js/views/secretario/dashboard.js`) | Managers legacy + API | Falla / Parcial | Hacer métodos `async` y usar `await` en `TurnosManager.getTurnosDelDia/getAll` y `PacientesManager/MedicosManager`; implementar lógica específica para sección `calendario` usando API. |
| Botones cancelar turno en vistas de paciente (`onclick="cancelarTurno(id)"`) | `window.cancelarTurno` en `js/views/paciente/dashboard.js` → `TurnosManager.cancel(id)` con `ModalManager.confirm` | N/A | Parcial (depende solo de backend) | Revisar errores de API y estados; la lógica JS ya es `async` y usa notificaciones. |
| `#reservarSubmitBtn` dentro de `#reservarForm` (Paciente) | `PacienteDashboard.reservarTurno(form)` en `js/views/paciente/dashboard.js` → `TurnosManager.create(turnoData)` | Legacy de reserva en storage (ya reemplazada) | Parcial (según API) | Confirmar que API de creación de turno (`TurnoController`) responde con `turno` y manejar errores específicos (slot ocupado, validaciones). |
| Botones de cambio de estado (`onclick="cambiarEstado(id)"`) (Médico) | `window.cambiarEstado` en `js/views/medico/dashboard.js` → `ModalManager.openEstadoTurnoModal(id)` | `ModalManager.openEstadoTurnoModal/saveEstadoTurno` (usa `TurnosManager.update`) | Falla / Parcial (usa managers como síncronos) | Hacer `openEstadoTurnoModal/saveEstadoTurno` 100% `async` y `await TurnosManager.getById/update`; recargar dashboard tras éxito. |
| `button.btn-primary[onclick="editarPerfil()"]` (Paciente) | `window.editarPerfil` en `js/views/paciente/dashboard.js` → `ModalManager.openPacienteModal(paciente)` | `PacientesManager.getById` (`async`) | Falla | Marcar `editarPerfil` como `async` y hacer `const paciente = await PacientesManager.getById(user.pacienteId);`; migrar guardado al endpoint `/api/paciente`. |

Este archivo se irá ampliando a medida que se completen los parches y se validen manualmente los botones restantes (médico, secretaria, admin, notificaciones y calendario).


