// ============================================
// SISTEMA COMPLETO DE MODALES FUNCIONALES
// ============================================

import { Modal } from './modal.js';
import { NotificationManager } from '../modules/notifications.js';

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

        const pacientes = PacientesManager.getAll({ activo: true });
        const medicos = MedicosManager.getAll({ activo: true });

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
                        <option value="confirmado" ${turno && turno.estado === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                        <option value="en_curso" ${turno && turno.estado === 'en_curso' ? 'selected' : ''}>En Curso</option>
                        <option value="completado" ${turno && turno.estado === 'completado' ? 'selected' : ''}>Completado</option>
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

            const horariosDisponibles = MedicosManager.getHorariosDisponibles(parseInt(medicoId), fecha);
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
            result = TurnosManager.update(turnoId, turnoData);
        } else {
            result = TurnosManager.create(turnoData);
        }

        if (result.success) {
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

        return this.openModal('pacienteModal', content, {
            title,
            footer,
            size: 'large'
        });
    }

    static async savePaciente(pacienteId) {
        const form = document.getElementById('pacienteForm');
        if (!form) return;

        const formData = new FormData(form);
        const { PacientesManager } = await import('../modules/pacientes.js');

        const pacienteData = {
            nombre: formData.get('nombre').trim(),
            apellido: formData.get('apellido').trim(),
            dni: formData.get('dni').trim(),
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
            result = PacientesManager.update(pacienteId, pacienteData);
        } else {
            result = PacientesManager.create(pacienteData);
        }

        if (result.success) {
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
            result = MedicosManager.update(medicoId, medicoData);
        } else {
            result = MedicosManager.create(medicoData);
        }

        if (result.success) {
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

        const paciente = PacientesManager.getById(pacienteId);
        if (!paciente) {
            NotificationManager.error('Paciente no encontrado');
            return;
        }

        const historial = PacientesManager.getHistorial(pacienteId);
        const medicos = MedicosManager.getAll();

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
                        const estadoClass = t.estado === 'completado' ? 'success' : 
                                          t.estado === 'cancelado' ? 'error' : 
                                          t.estado === 'confirmado' ? 'info' : 'warning';
                        
                        return `
                            <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-xs);">
                                    <div>
                                        <strong>${fechaCompleta.toLocaleDateString('es-AR')} ${t.hora}</strong>
                                        <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--spacing-xs);">
                                            ${medico ? medico.nombre + ' - ' + medico.especialidad : 'Médico no encontrado'}
                                        </div>
                                        ${t.motivo ? `<div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--spacing-xs);">
                                            <i class="fas fa-info-circle"></i> ${t.motivo}
                                        </div>` : ''}
                                    </div>
                                    <span class="badge badge-${estadoClass}">${t.estado}</span>
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

        const medicos = MedicosManager.getAll({ activo: true });
        const pacientes = PacientesManager.getAll({ activo: true });

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
            result = UsuariosManager.update(usuarioId, usuarioData);
        } else {
            result = UsuariosManager.create(usuarioData);
        }

        if (result.success) {
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
        const turno = TurnosManager.getById(turnoId);
        
        if (!turno) {
            NotificationManager.error('Turno no encontrado');
            return;
        }

        const estados = [
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'confirmado', label: 'Confirmado' },
            { value: 'en_curso', label: 'En Curso' },
            { value: 'completado', label: 'Completado' },
            { value: 'no_asistio', label: 'No Asistió' }
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

        const result = TurnosManager.update(turnoId, updates);
        
        if (result.success) {
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
}

// Hacer disponible globalmente
window.ModalManager = ModalManager;

// Hacer métodos disponibles globalmente
window.saveEstadoTurno = (turnoId) => ModalManager.saveEstadoTurno(turnoId);

