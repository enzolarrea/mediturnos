// ============================================
// SISTEMA COMPLETO DE MODALES FUNCIONALES
// ============================================

import { Modal } from './modal.js';
import { NotificationManager } from '../modules/notifications.js';
import { setupDniFormatter, formatDateToDMY, formatEstadoNombre } from '../utils/formatters.js';

export class ModalManager {
    static modals = {};

    static createModal(id, options = {}) {
        if (this.modals[id]) {
            return this.modals[id];
        }

        const modal = new Modal(id, options);
        this.modals[id] = modal;
        return modal;
    }

    static openModal(id, content, options = {}) {
        let modal = this.modals[id];

        if (!modal) {
            modal = this.createModal(id, options);
            modal.create(content);
        } else {
            modal.setContent(content);
            if (options.title) {
                modal.setTitle(options.title);
            }
        }

        modal.open();
        return modal;
    }

    static closeModal(id) {
        const modal = this.modals[id];
        if (modal) {
            modal.close();
        }
    }

    // Modal para crear/editar turno
    static async openTurnoModal(turno = null, pacienteIdPreseleccionado = null) {
        const { TurnosManager } = await import('../modules/turnos.js');
        const { PacientesManager } = await import('../modules/pacientes.js');
        const { MedicosManager } = await import('../modules/medicos.js');
        const { CONFIG } = await import('../config.js');

        // Obtener datos desde la API (async)
        const pacientes = await PacientesManager.getAll({ activo: true });
        const medicos = await MedicosManager.getAll({ activo: true });

        const isEdit = !!turno;
        const title = isEdit ? 'Editar Turno' : 'Nuevo Turno';

        let content = `
            <form id="turnoForm" class="appointment-form">
                <div class="form-group">
                    <label>Paciente *</label>
                    <select name="pacienteId" class="form-control" required>
                        <option value="">Seleccionar paciente</option>
                        ${pacientes.map(p => `
                            <option value="${p.id}" ${(turno && turno.pacienteId === p.id) || pacienteIdPreseleccionado === p.id ? 'selected' : ''}>
                                ${p.nombre} ${p.apellido} - DNI: ${p.dni}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Médico *</label>
                    <select name="medicoId" class="form-control" required id="medicoSelect">
                        <option value="">Seleccionar médico</option>
                        ${medicos.map(m => `
                            <option value="${m.id}" ${turno && turno.medicoId === m.id ? 'selected' : ''}>
                                ${m.nombre} - ${m.especialidad}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha *</label>
                        <input type="date" name="fecha" class="form-control" required 
                            value="${turno ? turno.fecha : new Date().toISOString().split('T')[0]}" 
                            min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Hora *</label>
                        <select name="hora" class="form-control" required id="horaSelect">
                            <option value="">Seleccionar hora</option>
                            ${CONFIG.HORARIOS.map(h => `
                                <option value="${h}" ${turno && turno.hora === h ? 'selected' : ''}>${h}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Estado</label>
                    <select name="estado" class="form-control">
                        <option value="pendiente" ${turno && turno.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="en_curso" ${turno && turno.estado === 'en_curso' ? 'selected' : ''}>En Curso</option>
                        <option value="confirmado" ${turno && turno.estado === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                        <option value="completado" ${turno && turno.estado === 'completado' ? 'selected' : ''}>Completado</option>
                        <option value="no_asistio" ${turno && turno.estado === 'no_asistio' ? 'selected' : ''}>No Asistió</option>
                        <option value="cancelado" ${turno && turno.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Motivo de Consulta</label>
                    <textarea name="motivo" class="form-control" rows="3" placeholder="Describir el motivo de la consulta...">${turno ? (turno.motivo || '') : ''}</textarea>
                </div>

                <div class="form-group">
                    <label>Notas</label>
                    <textarea name="notas" class="form-control" rows="2" placeholder="Notas adicionales...">${turno ? (turno.notas || '') : ''}</textarea>
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn-secondary" onclick="ModalManager.closeModal('turnoModal')">Cancelar</button>
            <button type="button" class="btn-primary" onclick="ModalManager.saveTurno(${turno ? turno.id : 'null'})">${isEdit ? 'Actualizar' : 'Guardar'} Turno</button>
        `;

        const modal = this.openModal('turnoModal', content, {
            title,
            footer,
            size: 'large'
        });

        // Actualizar horarios disponibles cuando cambia médico o fecha
        const medicoSelect = document.getElementById('medicoSelect');
        const fechaInput = document.querySelector('#turnoForm [name="fecha"]');
        const horaSelect = document.getElementById('horaSelect');

        const updateHorariosDisponibles = async () => {
            const medicoId = medicoSelect.value;
            const fecha = fechaInput.value;

            if (!medicoId || !fecha) return;

            const horariosDisponibles = await MedicosManager.getHorariosDisponibles(parseInt(medicoId), fecha);
            const horaActual = horaSelect.value;

            horaSelect.innerHTML = '<option value="">Seleccionar hora</option>' +
                CONFIG.HORARIOS.map(h => {
                    const disponible = horariosDisponibles.includes(h);
                    return `<option value="${h}" ${h === horaActual ? 'selected' : ''} ${!disponible ? 'disabled' : ''}>
                        ${h} ${!disponible ? '(Ocupado)' : ''}
                    </option>`;
                }).join('');
        };

        medicoSelect?.addEventListener('change', updateHorariosDisponibles);
        fechaInput?.addEventListener('change', updateHorariosDisponibles);

        return modal;
    }

    static async saveTurno(turnoId) {
        const form = document.getElementById('turnoForm');
        if (!form) return;

        const formData = new FormData(form);
        const { TurnosManager } = await import('../modules/turnos.js');

        const turnoData = {
            pacienteId: parseInt(formData.get('pacienteId')),
            medicoId: parseInt(formData.get('medicoId')),
            fecha: formData.get('fecha'),
            hora: formData.get('hora'),
            estado: formData.get('estado') || 'pendiente',
            motivo: formData.get('motivo') || '',
            notas: formData.get('notas') || ''
        };

        // Validación
        if (!turnoData.pacienteId || !turnoData.medicoId || !turnoData.fecha || !turnoData.hora) {
            NotificationManager.error('Por favor completa todos los campos requeridos');
            return;
        }

        let result;
        if (turnoId) {
            result = await TurnosManager.update(turnoId, turnoData);
        } else {
            result = await TurnosManager.create(turnoData);
        }

        if (result && result.success) {
            NotificationManager.success(turnoId ? 'Turno actualizado exitosamente' : 'Turno creado exitosamente');
            this.closeModal('turnoModal');

            // Recargar vista
            if (window.dashboard) {
                if (typeof window.dashboard.loadTurnos === 'function') {
                    window.dashboard.loadTurnos();
                }
                if (typeof window.dashboard.loadDashboard === 'function') {
                    window.dashboard.loadDashboard();
                }
            }
            // Si no hay dashboard, recargar página
            setTimeout(() => {
                if (!window.dashboard || typeof window.dashboard.loadTurnos !== 'function') {
                    window.location.reload();
                }
            }, 300);
        } else {
            NotificationManager.error(result.message || 'Error al guardar el turno');
        }
    }

    // Modal para crear/editar paciente
    static async openPacienteModal(paciente = null) {
        const { PacientesManager } = await import('../modules/pacientes.js');

        const isEdit = !!paciente;
        const title = isEdit ? 'Editar Paciente' : 'Nuevo Paciente';

        let content = `
            <form id="pacienteForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre *</label>
                        <input type="text" name="nombre" class="form-control" required 
                            value="${paciente ? paciente.nombre : ''}">
                    </div>
                    <div class="form-group">
                        <label>Apellido *</label>
                        <input type="text" name="apellido" class="form-control" required 
                            value="${paciente ? paciente.apellido : ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>DNI *</label>
                        <input type="text" name="dni" class="form-control" required 
                            pattern="[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}" 
                            placeholder="12.345.678"
                            inputmode="numeric"
                            maxlength="11"
                            value="${paciente ? paciente.dni : ''}">
                    </div>
                    <div class="form-group">
                        <label>Teléfono *</label>
                        <input type="tel" name="telefono" class="form-control" required 
                            value="${paciente ? paciente.telefono : ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" class="form-control" 
                            value="${paciente ? (paciente.email || '') : ''}">
                    </div>
                    <div class="form-group">
                        <label>Fecha de Nacimiento</label>
                        <input type="date" name="fechaNacimiento" class="form-control" 
                            value="${paciente ? (paciente.fechaNacimiento || '') : ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" name="direccion" class="form-control" 
                        value="${paciente ? (paciente.direccion || '') : ''}">
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn-secondary" onclick="ModalManager.closeModal('pacienteModal')">Cancelar</button>
            <button type="button" class="btn-primary" onclick="ModalManager.savePaciente(${paciente ? paciente.id : 'null'})">${isEdit ? 'Actualizar' : 'Guardar'} Paciente</button>
        `;

        const modal = this.openModal('pacienteModal', content, {
            title,
            footer,
            size: 'large'
        });

        // Aplicar mismo formateo de DNI que en el registro de paciente (landing)
        const dniInput = document.querySelector('#pacienteForm [name="dni"]');
        if (dniInput) {
            setupDniFormatter(dniInput);
        }

        return modal;
    }

    static async savePaciente(pacienteId) {
        const form = document.getElementById('pacienteForm');
        if (!form) return;

        const formData = new FormData(form);
        const { PacientesManager } = await import('../modules/pacientes.js');

        const rawDni = (formData.get('dni') || '').trim();
        const normalizedDni = rawDni.replace(/\./g, '');

        const pacienteData = {
            nombre: formData.get('nombre').trim(),
            apellido: formData.get('apellido').trim(),
            dni: normalizedDni,
            telefono: formData.get('telefono').trim(),
            email: formData.get('email').trim(),
            fechaNacimiento: formData.get('fechaNacimiento'),
            direccion: formData.get('direccion').trim()
        };

        // Validación
        if (!pacienteData.nombre || !pacienteData.apellido || !pacienteData.dni || !pacienteData.telefono) {
            NotificationManager.error('Por favor completa todos los campos requeridos');
            return;
        }

        let result;
        if (pacienteId) {
            result = await PacientesManager.update(pacienteId, pacienteData);
        } else {
            result = await PacientesManager.create(pacienteData);
        }

        if (result && result.success) {
            NotificationManager.success(pacienteId ? 'Paciente actualizado exitosamente' : 'Paciente creado exitosamente');
            this.closeModal('pacienteModal');

            // Recargar vista
            if (window.dashboard) {
                if (typeof window.dashboard.loadPacientes === 'function') {
                    window.dashboard.loadPacientes();
                }
                if (typeof window.dashboard.loadDashboard === 'function') {
                    window.dashboard.loadDashboard();
                }
            }
            setTimeout(() => {
                if (!window.dashboard || typeof window.dashboard.loadPacientes !== 'function') {
                    window.location.reload();
                }
            }, 300);
        } else {
            NotificationManager.error(result.message || 'Error al guardar el paciente');
        }
    }

    // Modal para crear/editar médico
    static async openMedicoModal(medico = null) {
        const { MedicosManager } = await import('../modules/medicos.js');

        const isEdit = !!medico;
        const title = isEdit ? 'Editar Médico' : 'Nuevo Médico';

        let content = `
            <form id="medicoForm">
                <div class="form-group">
                    <label>Nombre Completo *</label>
                    <input type="text" name="nombre" class="form-control" required 
                        value="${medico ? medico.nombre : ''}" 
                        placeholder="Dr. Juan Pérez">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Especialidad *</label>
                        <input type="text" name="especialidad" class="form-control" required 
                            value="${medico ? medico.especialidad : ''}" 
                            placeholder="Cardiología">
                    </div>
                    <div class="form-group">
                        <label>Matrícula *</label>
                        <input type="text" name="matricula" class="form-control" required 
                            value="${medico ? medico.matricula : ''}" 
                            placeholder="12345">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Horario *</label>
                        <input type="text" name="horario" class="form-control" required 
                            value="${medico ? medico.horario : ''}" 
                            placeholder="08:00 - 17:00">
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" name="telefono" class="form-control" 
                            value="${medico ? (medico.telefono || '') : ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" class="form-control" 
                        value="${medico ? (medico.email || '') : ''}">
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn-secondary" onclick="ModalManager.closeModal('medicoModal')">Cancelar</button>
            <button type="button" class="btn-primary" onclick="ModalManager.saveMedico(${medico ? medico.id : 'null'})">${isEdit ? 'Actualizar' : 'Guardar'} Médico</button>
        `;

        return this.openModal('medicoModal', content, {
            title,
            footer,
            size: 'large'
        });
    }

    static async saveMedico(medicoId) {
        const form = document.getElementById('medicoForm');
        if (!form) return;

        const formData = new FormData(form);
        const { MedicosManager } = await import('../modules/medicos.js');

        const medicoData = {
            nombre: formData.get('nombre').trim(),
            especialidad: formData.get('especialidad').trim(),
            matricula: formData.get('matricula').trim(),
            horario: formData.get('horario').trim(),
            telefono: formData.get('telefono').trim(),
            email: formData.get('email').trim()
        };

        // Validación
        if (!medicoData.nombre || !medicoData.especialidad || !medicoData.matricula || !medicoData.horario) {
            NotificationManager.error('Por favor completa todos los campos requeridos');
            return;
        }

        let result;
        if (medicoId) {
            result = await MedicosManager.update(medicoId, medicoData);
        } else {
            result = await MedicosManager.create(medicoData);
        }

        if (result && result.success) {
            NotificationManager.success(medicoId ? 'Médico actualizado exitosamente' : 'Médico creado exitosamente');
            this.closeModal('medicoModal');

            // Recargar vista
            if (window.dashboard) {
                if (typeof window.dashboard.loadMedicos === 'function') {
                    window.dashboard.loadMedicos();
                }
                if (typeof window.dashboard.loadDashboard === 'function') {
                    window.dashboard.loadDashboard();
                }
            }
            setTimeout(() => {
                if (!window.dashboard || typeof window.dashboard.loadMedicos !== 'function') {
                    window.location.reload();
                }
            }, 300);
        } else {
            NotificationManager.error(result.message || 'Error al guardar el médico');
        }
    }

    // Modal para ver historial de paciente
    static async openHistorialModal(pacienteId) {
        const { PacientesManager } = await import('../modules/pacientes.js');
        const { TurnosManager } = await import('../modules/turnos.js');
        const { MedicosManager } = await import('../modules/medicos.js');

        const paciente = await PacientesManager.getById(pacienteId);
        if (!paciente) {
            NotificationManager.error('Paciente no encontrado');
            return;
        }

        const historial = await PacientesManager.getHistorial(pacienteId);
        const medicos = await MedicosManager.getAll();

        let content = `
            <div style="margin-bottom: var(--spacing-lg);">
                <h4 style="margin-bottom: var(--spacing-sm);">${paciente.nombre} ${paciente.apellido}</h4>
                <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                    DNI: ${paciente.dni} | Tel: ${paciente.telefono}
                </p>
            </div>

            <div style="max-height: 400px; overflow-y: auto;">
                ${historial.length === 0 ?
                '<p class="text-center" style="padding: var(--spacing-xl); color: var(--text-secondary);">No hay historial de turnos</p>' :
                historial.map(t => {
                    const medico = medicos.find(m => m.id === t.medicoId);
                    const fechaCompleta = new Date(t.fecha + ' ' + t.hora);
                    const estado = t.estado || t.estadoCodigo || 'pendiente';
                    let estadoClass = 'warning'; // default
                    if (estado === 'confirmado') {
                        estadoClass = 'success';
                    } else if (estado === 'cancelado') {
                        estadoClass = 'error';
                    } else if (estado === 'completado') {
                        estadoClass = 'completed';
                    } else if (estado === 'en_curso') {
                        estadoClass = 'info';
                    } else if (estado === 'no_asistio') {
                        estadoClass = 'noAsist';
                    }
                    const estadoNombre = formatEstadoNombre(estado);

                    return `
                            <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-xs);">
                                    <div>
                                        <strong>${formatDateToDMY(t.fecha)} ${t.hora}</strong>
                                        <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--spacing-xs);">
                                            ${medico ? medico.nombre + ' - ' + medico.especialidad : 'Médico no encontrado'}
                                        </div>
                                        ${t.motivo ? `<div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--spacing-xs);">
                                            <i class="fas fa-info-circle"></i> ${t.motivo}
                                        </div>` : ''}
                                    </div>
                                    <span class="badge badge-${estadoClass}">${estadoNombre}</span>
                                </div>
                            </div>
                        `;
                }).join('')
            }
            </div>
        `;

        return this.openModal('historialModal', content, {
            title: 'Historial de Turnos',
            size: 'large'
        });
    }

    // Modal para crear/editar usuario
    static async openUsuarioModal(usuario = null) {
        const { UsuariosManager } = await import('../modules/usuarios.js');
        const { CONFIG } = await import('../config.js');
        const { MedicosManager } = await import('../modules/medicos.js');
        const { PacientesManager } = await import('../modules/pacientes.js');

        const isEdit = !!usuario;
        const title = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';

        const medicos = await MedicosManager.getAll({ activo: true });
        const pacientes = await PacientesManager.getAll({ activo: true });

        let content = `
            <form id="usuarioForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre *</label>
                        <input type="text" name="nombre" class="form-control" required 
                            value="${usuario ? usuario.nombre : ''}">
                    </div>
                    <div class="form-group">
                        <label>Apellido *</label>
                        <input type="text" name="apellido" class="form-control" required 
                            value="${usuario ? usuario.apellido : ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" class="form-control" required 
                        value="${usuario ? usuario.email : ''}">
                </div>

                ${!isEdit ? `
                    <div class="form-group">
                        <label>Contraseña *</label>
                        <input type="password" name="password" class="form-control" required 
                            minlength="8" placeholder="Mínimo 8 caracteres">
                    </div>
                ` : ''}

                <div class="form-group">
                    <label>Rol *</label>
                    <select name="rol" class="form-control" required id="rolSelect">
                        <option value="">Seleccionar rol</option>
                        <option value="${CONFIG.ROLES.ADMIN}" ${usuario && usuario.rol === CONFIG.ROLES.ADMIN ? 'selected' : ''}>Administrador</option>
                        <option value="${CONFIG.ROLES.SECRETARIO}" ${usuario && usuario.rol === CONFIG.ROLES.SECRETARIO ? 'selected' : ''}>Secretario</option>
                        <option value="${CONFIG.ROLES.MEDICO}" ${usuario && usuario.rol === CONFIG.ROLES.MEDICO ? 'selected' : ''}>Médico</option>
                        <option value="${CONFIG.ROLES.PACIENTE}" ${usuario && usuario.rol === CONFIG.ROLES.PACIENTE ? 'selected' : ''}>Paciente</option>
                    </select>
                </div>

                <div class="form-group" id="medicoSelectGroup" style="display: none;">
                    <label>Médico Asociado</label>
                    <select name="medicoId" class="form-control">
                        <option value="">Seleccionar médico</option>
                        ${medicos.map(m => `
                            <option value="${m.id}" ${usuario && usuario.medicoId === m.id ? 'selected' : ''}>
                                ${m.nombre} - ${m.especialidad}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group" id="pacienteSelectGroup" style="display: none;">
                    <label>Paciente Asociado</label>
                    <select name="pacienteId" class="form-control">
                        <option value="">Seleccionar paciente</option>
                        ${pacientes.map(p => `
                            <option value="${p.id}" ${usuario && usuario.pacienteId === p.id ? 'selected' : ''}>
                                ${p.nombre} ${p.apellido} - DNI: ${p.dni}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn-secondary" onclick="ModalManager.closeModal('usuarioModal')">Cancelar</button>
            <button type="button" class="btn-primary" onclick="ModalManager.saveUsuario(${usuario ? usuario.id : 'null'})">${isEdit ? 'Actualizar' : 'Guardar'} Usuario</button>
        `;

        const modal = this.openModal('usuarioModal', content, {
            title,
            footer,
            size: 'large'
        });

        // Mostrar/ocultar selects según rol
        const rolSelect = document.getElementById('rolSelect');
        const medicoGroup = document.getElementById('medicoSelectGroup');
        const pacienteGroup = document.getElementById('pacienteSelectGroup');

        const updateRoleFields = () => {
            const rol = rolSelect.value;
            medicoGroup.style.display = rol === CONFIG.ROLES.MEDICO ? 'block' : 'none';
            pacienteGroup.style.display = rol === CONFIG.ROLES.PACIENTE ? 'block' : 'none';
        };

        rolSelect.addEventListener('change', updateRoleFields);
        updateRoleFields(); // Inicial

        return modal;
    }

    static async saveUsuario(usuarioId) {
        const form = document.getElementById('usuarioForm');
        if (!form) return;

        const formData = new FormData(form);
        const { UsuariosManager } = await import('../modules/usuarios.js');

        const usuarioData = {
            nombre: formData.get('nombre').trim(),
            apellido: formData.get('apellido').trim(),
            email: formData.get('email').trim(),
            rol: formData.get('rol'),
            password: formData.get('password') || undefined
        };

        if (formData.get('medicoId')) {
            usuarioData.medicoId = parseInt(formData.get('medicoId'));
        }
        if (formData.get('pacienteId')) {
            usuarioData.pacienteId = parseInt(formData.get('pacienteId'));
        }

        // Validación
        if (!usuarioData.nombre || !usuarioData.apellido || !usuarioData.email || !usuarioData.rol) {
            NotificationManager.error('Por favor completa todos los campos requeridos');
            return;
        }

        if (!usuarioId && !usuarioData.password) {
            NotificationManager.error('La contraseña es requerida para nuevos usuarios');
            return;
        }

        let result;
        if (usuarioId) {
            result = await UsuariosManager.update(usuarioId, usuarioData);
        } else {
            result = await UsuariosManager.create(usuarioData);
        }

        if (result && result.success) {
            NotificationManager.success(usuarioId ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
            this.closeModal('usuarioModal');

            // Recargar vista
            if (window.dashboard && typeof window.dashboard.loadUsuarios === 'function') {
                window.dashboard.loadUsuarios();
                if (typeof window.dashboard.loadDashboard === 'function') {
                    window.dashboard.loadDashboard();
                }
            }
            setTimeout(() => {
                if (!window.dashboard || typeof window.dashboard.loadUsuarios !== 'function') {
                    window.location.reload();
                }
            }, 300);
        } else {
            NotificationManager.error(result.message || 'Error al guardar el usuario');
        }
    }

    // Modal de confirmación elegante
    static async confirm(title, message, onConfirm, onCancel = null) {
        let content = `
            <div style="text-align: center; padding: var(--spacing-lg);">
                <div style="font-size: 3rem; color: var(--warning); margin-bottom: var(--spacing-md);">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4 style="margin-bottom: var(--spacing-md);">${title}</h4>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl);">${message}</p>
            </div>
        `;

        // Guardar callbacks en el modal
        const modalId = 'confirmModal';
        this.confirmCallbacks = this.confirmCallbacks || {};
        this.confirmCallbacks[modalId] = { onConfirm, onCancel };

        const footer = `
            <button type="button" class="btn-secondary" onclick="ModalManager.closeConfirm()">Cancelar</button>
            <button type="button" class="btn-danger" onclick="ModalManager.executeConfirm()">Confirmar</button>
        `;

        return this.openModal(modalId, content, {
            title: '',
            footer,
            size: 'small'
        });
    }

    static closeConfirm() {
        const modalId = 'confirmModal';
        const callback = this.confirmCallbacks?.[modalId];
        if (callback?.onCancel) {
            callback.onCancel();
        }
        this.closeModal(modalId);
        if (this.confirmCallbacks) {
            delete this.confirmCallbacks[modalId];
        }
    }

    static executeConfirm() {
        const modalId = 'confirmModal';
        const callback = this.confirmCallbacks?.[modalId];
        if (callback?.onConfirm) {
            callback.onConfirm();
        }
        this.closeModal(modalId);
        if (this.confirmCallbacks) {
            delete this.confirmCallbacks[modalId];
        }
    }

    // Modal para cambiar estado de turno
    static async openEstadoTurnoModal(turnoId) {
        const { TurnosManager } = await import('../modules/turnos.js');
        const turno = await TurnosManager.getById(turnoId);

        if (!turno) {
            NotificationManager.error('Turno no encontrado');
            return;
        }

        const estados = [
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'en_curso', label: 'En Curso' },
            { value: 'confirmado', label: 'Confirmado' },
            { value: 'completado', label: 'Completado' },
            { value: 'no_asistio', label: 'No Asistió' },
            { value: 'cancelado', label: 'Cancelado' }
        ];

        let content = `
            <form id="estadoForm">
                <div class="form-group">
                    <label>Estado del Turno</label>
                    <select name="estado" class="form-control" required>
                        ${estados.map(e => `
                            <option value="${e.value}" ${turno.estado === e.value ? 'selected' : ''}>${e.label}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Notas (opcional)</label>
                    <textarea name="notas" class="form-control" rows="3" placeholder="Agregar notas sobre el cambio de estado...">${turno.notas || ''}</textarea>
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn-secondary" onclick="ModalManager.closeModal('estadoTurnoModal')">Cancelar</button>
            <button type="button" class="btn-primary" onclick="ModalManager.saveEstadoTurno(${turnoId})">Actualizar Estado</button>
        `;

        return this.openModal('estadoTurnoModal', content, {
            title: 'Cambiar Estado del Turno',
            footer,
            size: 'medium'
        });
    }

    static async saveEstadoTurno(turnoId) {
        const form = document.getElementById('estadoForm');
        if (!form) return;

        const formData = new FormData(form);
        const { TurnosManager } = await import('../modules/turnos.js');

        const updates = {
            estado: formData.get('estado'),
            notas: formData.get('notas') || ''
        };

        const result = await TurnosManager.update(turnoId, updates);

        if (result && result.success) {
            NotificationManager.success('Estado actualizado exitosamente');
            this.closeModal('estadoTurnoModal');

            // Recargar vista
            if (window.dashboard) {
                if (typeof window.dashboard.loadDashboard === 'function') {
                    window.dashboard.loadDashboard();
                }
                if (typeof window.dashboard.loadTurnos === 'function') {
                    window.dashboard.loadTurnos();
                }
            }
            setTimeout(() => {
                if (!window.dashboard || typeof window.dashboard.loadDashboard !== 'function') {
                    window.location.reload();
                }
            }, 300);
        } else {
            NotificationManager.error(result.message || 'Error al actualizar el estado');
        }
    }

    // ============================================
    // MODAL DE INFORMACIÓN REUTILIZABLE (LANDING)
    // ============================================

    static openInfoModal(type) {
        const modalId = 'infoModal';
        const contents = this.getInfoModalContent(type);

        if (!contents) {
            console.error(`Tipo de modal no válido: ${type}`);
            return;
        }

        const footer = `
            <button type="button" class="btn-primary" onclick="ModalManager.closeModal('${modalId}')">Cerrar</button>
        `;

        return this.openModal(modalId, contents.content, {
            title: contents.title,
            footer: footer,
            size: 'medium'
        });
    }

    static getInfoModalContent(type) {
        const contents = {
            acerca: {
                title: 'Acerca de MediTurnos',
                content: `
                    <div style="padding: var(--spacing-md);">
                        <div style="text-align: center; margin-bottom: var(--spacing-xl);">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary), var(--medical-blue)); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-lg);">
                                <i class="fas fa-stethoscope" style="font-size: 2.5rem; color: white;"></i>
                            </div>
                            <h3 style="margin: 0; color: var(--text-primary); margin-bottom: var(--spacing-sm);">MediTurnos</h3>
                            <p style="color: var(--text-secondary); margin: 0;">Sistema de Gestión de Turnos Médicos</p>
                        </div>
                        
                        <div style="margin-bottom: var(--spacing-xl);">
                            <h4 style="margin-bottom: var(--spacing-md); color: var(--text-primary); border-bottom: 2px solid var(--primary); padding-bottom: var(--spacing-sm);">
                                <i class="fas fa-info-circle" style="color: var(--primary);"></i> Nuestro Propósito
                            </h4>
                            <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: var(--spacing-md);">
                                <strong>MediTurnos</strong> es una plataforma integral diseñada para modernizar y simplificar la gestión de turnos médicos. 
                                Nuestro objetivo es conectar a pacientes, médicos y personal administrativo a través de una herramienta 
                                eficiente, segura y fácil de usar.
                            </p>
                            <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: var(--spacing-md);">
                                Creemos que el acceso a la atención médica debe ser sencillo y accesible para todos. Por eso, hemos desarrollado 
                                una solución que permite a los pacientes reservar sus turnos de manera rápida, a los médicos gestionar su 
                                disponibilidad eficientemente, y a los establecimientos médicos optimizar su administración.
                            </p>
                        </div>
                        
                        <div style="margin-bottom: var(--spacing-xl);">
                            <h4 style="margin-bottom: var(--spacing-md); color: var(--text-primary); border-bottom: 2px solid var(--primary); padding-bottom: var(--spacing-sm);">
                                <i class="fas fa-star" style="color: var(--primary);"></i> ¿Qué Ofrecemos?
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-md);">
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius); border-left: 4px solid var(--primary);">
                                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-calendar-check" style="color: var(--primary); font-size: 1.5rem;"></i>
                                        <strong style="color: var(--text-primary);">Gestión de Turnos</strong>
                                    </div>
                                    <p style="color: var(--text-secondary); margin: 0; font-size: var(--font-size-sm);">
                                        Sistema completo para reservar, gestionar y organizar turnos médicos de forma eficiente.
                                    </p>
                                </div>
                                
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius); border-left: 4px solid var(--primary);">
                                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-user-md" style="color: var(--primary); font-size: 1.5rem;"></i>
                                        <strong style="color: var(--text-primary);">Panel para Médicos</strong>
                                    </div>
                                    <p style="color: var(--text-secondary); margin: 0; font-size: var(--font-size-sm);">
                                        Herramientas profesionales para que los médicos gestionen su disponibilidad y pacientes.
                                    </p>
                                </div>
                                
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius); border-left: 4px solid var(--primary);">
                                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-shield-alt" style="color: var(--primary); font-size: 1.5rem;"></i>
                                        <strong style="color: var(--text-primary);">Seguridad</strong>
                                    </div>
                                    <p style="color: var(--text-secondary); margin: 0; font-size: var(--font-size-sm);">
                                        Protección de datos personales y médicos con los más altos estándares de seguridad.
                                    </p>
                                </div>
                                
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius); border-left: 4px solid var(--primary);">
                                    <div style="display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-mobile-alt" style="color: var(--primary); font-size: 1.5rem;"></i>
                                        <strong style="color: var(--text-primary);">Acceso Fácil</strong>
                                    </div>
                                    <p style="color: var(--text-secondary); margin: 0; font-size: var(--font-size-sm);">
                                        Interfaz intuitiva y accesible desde cualquier dispositivo, en cualquier momento.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: var(--spacing-xl);">
                            <h4 style="margin-bottom: var(--spacing-md); color: var(--text-primary); border-bottom: 2px solid var(--primary); padding-bottom: var(--spacing-sm);">
                                <i class="fas fa-users" style="color: var(--primary);"></i> Para Todos
                            </h4>
                            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <strong style="color: var(--primary); display: block; margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-user-injured"></i> Pacientes
                                    </strong>
                                    <p style="color: var(--text-secondary); margin: 0; font-size: var(--font-size-sm);">
                                        Reserva tus turnos médicos de forma rápida y sencilla. Accede a tu historial y gestiona tus citas desde un solo lugar.
                                    </p>
                                </div>
                                
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <strong style="color: var(--primary); display: block; margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-user-md"></i> Médicos
                                    </strong>
                                    <p style="color: var(--text-secondary); margin: 0; font-size: var(--font-size-sm);">
                                        Administra tu disponibilidad, gestiona tus pacientes y optimiza tu agenda profesional con herramientas diseñadas para ti.
                                    </p>
                                </div>
                                
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <strong style="color: var(--primary); display: block; margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-user-tie"></i> Personal Administrativo
                                    </strong>
                                    <p style="color: var(--text-secondary); margin: 0; font-size: var(--font-size-sm);">
                                        Control completo sobre la gestión de turnos, usuarios y reportes para una administración eficiente.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; padding: var(--spacing-md); background: linear-gradient(135deg, var(--primary), var(--medical-blue)); border-radius: var(--border-radius); color: white;">
                            <p style="margin: 0; font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-xs); color: white;">
                                ¿Listo para comenzar?
                            </p>
                            <p style="margin: 0; opacity: 0.9; font-size: var(--font-size-sm); color: white;">
                                Únete a MediTurnos y transforma la manera en que gestionas tus turnos médicos
                            </p>
                        </div>
                    </div>
                `
            },
            precios: {
                title: 'Precios',
                content: `
                    <div style="padding: var(--spacing-md);">
                        <div style="margin-bottom: var(--spacing-xl);">
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: var(--spacing-lg);">
                                <thead>
                                    <tr style="background: var(--bg-tertiary); border-bottom: 2px solid var(--border-color);">
                                        <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Plan</th>
                                        <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Precio</th>
                                        <th style="padding: var(--spacing-md); text-align: left; font-weight: 600;">Características</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: var(--spacing-md);"><strong>Gratis</strong></td>
                                        <td style="padding: var(--spacing-md);">$0/mes</td>
                                        <td style="padding: var(--spacing-md);">Hasta 50 pacientes, 1 médico</td>
                                    </tr>
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: var(--spacing-md);"><strong>Pro</strong></td>
                                        <td style="padding: var(--spacing-md);">$29/mes</td>
                                        <td style="padding: var(--spacing-md);">Hasta 500 pacientes, 10 médicos, reportes avanzados</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: var(--spacing-md);"><strong>Empresarial</strong></td>
                                        <td style="padding: var(--spacing-md);">Personalizado</td>
                                        <td style="padding: var(--spacing-md);">Pacientes ilimitados, médicos ilimitados, soporte prioritario</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p style="color: var(--text-secondary); font-size: var(--font-size-sm); text-align: center; margin-top: var(--spacing-lg);">
                            <i class="fas fa-info-circle"></i> Estos son precios orientativos. Contacta con nuestro equipo para más información.
                        </p>
                    </div>
                `
            },
            ayuda: {
                title: 'Centro de Ayuda',
                content: `
                    <div style="padding: var(--spacing-md);">
                        <div style="margin-bottom: var(--spacing-lg);">
                            <h4 style="margin-bottom: var(--spacing-md); color: var(--text-primary);">Preguntas Frecuentes</h4>
                            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <strong style="color: var(--primary);">¿Cómo creo mi cuenta?</strong>
                                    <p style="margin-top: var(--spacing-xs); color: var(--text-secondary);">
                                        Haz clic en "Registrarse" y completa el formulario con tus datos personales.
                                    </p>
                                </div>
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <strong style="color: var(--primary);">¿Cómo reservo un turno?</strong>
                                    <p style="margin-top: var(--spacing-xs); color: var(--text-secondary);">
                                        Una vez iniciada sesión, ve a "Reservar Turno", selecciona médico, fecha y hora disponible.
                                    </p>
                                </div>
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <strong style="color: var(--primary);">¿Puedo cancelar un turno?</strong>
                                    <p style="margin-top: var(--spacing-xs); color: var(--text-secondary);">
                                        Sí, puedes cancelar tus turnos desde la sección "Mis Turnos" con al menos 24 horas de anticipación.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--border-radius);">
                            <p style="margin-bottom: var(--spacing-sm); color: var(--text-secondary);">
                                ¿Necesitas más ayuda?
                            </p>
                            <a href="#" style="color: var(--primary); text-decoration: none; font-weight: 600;" 
                               onclick="event.preventDefault(); ModalManager.closeModal('infoModal'); ModalManager.openInfoModal('contacto'); return false;">
                                <i class="fas fa-envelope"></i> Contacta con soporte
                            </a>
                        </div>
                    </div>
                `
            },
            contacto: {
                title: 'Contacto',
                content: `
                    <div style="padding: var(--spacing-md);">
                        <div style="margin-bottom: var(--spacing-xl);">
                            <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg); text-align: center;">
                                Estamos aquí para ayudarte. Contáctanos a través de los siguientes medios:
                            </p>
                            <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                                <div style="display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: var(--font-size-lg);">
                                        <i class="fas fa-envelope"></i>
                                    </div>
                                    <div>
                                        <strong style="color: var(--text-primary); display: block; margin-bottom: var(--spacing-xs);">Email de Soporte</strong>
                                        <a href="mailto:soporte@mediturnos.com" style="color: var(--primary); text-decoration: none;">
                                            soporte@mediturnos.com
                                        </a>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: var(--font-size-lg);">
                                        <i class="fas fa-phone"></i>
                                    </div>
                                    <div>
                                        <strong style="color: var(--text-primary); display: block; margin-bottom: var(--spacing-xs);">Teléfono</strong>
                                        <a href="tel:+541112345678" style="color: var(--primary); text-decoration: none;">
                                            +54 11 1234-5678
                                        </a>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: var(--font-size-lg);">
                                        <i class="fas fa-clock"></i>
                                    </div>
                                    <div>
                                        <strong style="color: var(--text-primary); display: block; margin-bottom: var(--spacing-xs);">Horario de Atención</strong>
                                        <span style="color: var(--text-secondary);">Lunes a Viernes: 9:00 - 18:00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--border-radius);">
                            <p style="margin-bottom: var(--spacing-md); color: var(--text-secondary);">
                                También puedes completar nuestro formulario de contacto
                            </p>
                            <a href="#" style="color: var(--primary); text-decoration: none; font-weight: 600;" 
                               onclick="event.preventDefault(); NotificationManager.info('Formulario de contacto próximamente disponible'); return false;">
                                <i class="fas fa-external-link-alt"></i> Ir al formulario de contacto
                            </a>
                        </div>
                    </div>
                `
            },
            privacidad: {
                title: 'Política de Privacidad',
                content: `
                    <div style="padding: var(--spacing-md);">
                        <div style="margin-bottom: var(--spacing-xl);">
                            <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: var(--spacing-md);">
                                En MediTurnos, nos comprometemos a proteger tu privacidad y la seguridad de tus datos personales. 
                                Toda la información que nos proporcionas es tratada con la máxima confidencialidad y solo se utiliza 
                                para brindarte el mejor servicio posible.
                            </p>
                            <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: var(--spacing-md);">
                                Tus datos médicos y personales están protegidos mediante encriptación avanzada y cumplimos con todas 
                                las normativas de privacidad vigentes. No compartimos tu información con terceros sin tu consentimiento explícito.
                            </p>
                            <p style="color: var(--text-secondary); line-height: 1.8; margin-bottom: var(--spacing-md);">
                                Puedes acceder, modificar o eliminar tus datos personales en cualquier momento desde tu perfil de usuario. 
                                Si tienes alguna pregunta sobre cómo manejamos tu información, no dudes en contactarnos.
                            </p>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--border-radius);">
                            <button class="btn-secondary" onclick="event.preventDefault(); NotificationManager.info('Documento completo próximamente disponible'); return false;" 
                                    style="width: 100%;">
                                <i class="fas fa-file-pdf"></i> Ver política completa
                            </button>
                        </div>
                    </div>
                `
            },
            terminos: {
                title: 'Términos de Servicio',
                content: `
                    <div style="padding: var(--spacing-md);">
                        <div style="margin-bottom: var(--spacing-xl);">
                            <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius); border-left: 4px solid var(--primary);">
                                    <strong style="color: var(--primary); display: block; margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-check-circle"></i> Uso del Servicio
                                    </strong>
                                    <p style="color: var(--text-secondary); margin: 0;">
                                        Al utilizar MediTurnos, aceptas usar el servicio de manera responsable y conforme a la ley. 
                                        No está permitido el uso indebido de la plataforma.
                                    </p>
                                </div>
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius); border-left: 4px solid var(--primary);">
                                    <strong style="color: var(--primary); display: block; margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-check-circle"></i> Responsabilidades del Usuario
                                    </strong>
                                    <p style="color: var(--text-secondary); margin: 0;">
                                        Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. 
                                        Debes notificarnos inmediatamente cualquier uso no autorizado.
                                    </p>
                                </div>
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius); border-left: 4px solid var(--primary);">
                                    <strong style="color: var(--primary); display: block; margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-check-circle"></i> Disponibilidad del Servicio
                                    </strong>
                                    <p style="color: var(--text-secondary); margin: 0;">
                                        Nos esforzamos por mantener el servicio disponible 24/7, pero no garantizamos disponibilidad 
                                        ininterrumpida. Podemos realizar mantenimientos programados.
                                    </p>
                                </div>
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius); border-left: 4px solid var(--primary);">
                                    <strong style="color: var(--primary); display: block; margin-bottom: var(--spacing-xs);">
                                        <i class="fas fa-check-circle"></i> Modificaciones
                                    </strong>
                                    <p style="color: var(--text-secondary); margin: 0;">
                                        Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                                        Los cambios serán notificados a los usuarios.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div style="text-align: center; padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--border-radius);">
                            <button class="btn-secondary" onclick="event.preventDefault(); NotificationManager.info('Documento completo próximamente disponible'); return false;" 
                                    style="width: 100%;">
                                <i class="fas fa-file-pdf"></i> Ver términos completos
                            </button>
                        </div>
                    </div>
                `
            }
        };

        return contents[type] || null;
    }
}

// Hacer disponible globalmente
window.ModalManager = ModalManager;
window.NotificationManager = NotificationManager;

// Hacer métodos disponibles globalmente
window.saveEstadoTurno = (turnoId) => ModalManager.saveEstadoTurno(turnoId);
window.openInfoModal = (type) => {
    if (window.ModalManager) {
        return window.ModalManager.openInfoModal(type);
    } else {
        setTimeout(() => {
            if (window.ModalManager) {
                window.ModalManager.openInfoModal(type);
            } else {
                console.error('ModalManager no está disponible');
            }
        }, 100);
    }
};

