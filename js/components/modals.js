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

        const pacientes = await PacientesManager.getAll({ activo: true });
        const medicos = await MedicosManager.getAll({ activo: true });

        const isEdit = !!turno;
        const title = isEdit ? 'Editar Turno' : 'Nuevo Turno';

        // Obtener paciente preseleccionado si existe
        let pacientePreseleccionado = null;
        if (pacienteIdPreseleccionado) {
            pacientePreseleccionado = await PacientesManager.getById(pacienteIdPreseleccionado);
        } else if (turno && turno.pacienteId) {
            pacientePreseleccionado = await PacientesManager.getById(turno.pacienteId);
        }

        let content = `
            <form id="turnoForm" class="appointment-form">
                <div class="form-group">
                    <label>Buscar Paciente por DNI *</label>
                    <div style="position: relative;">
                        <input type="text" 
                               id="pacienteSearchInput" 
                               class="form-control" 
                               placeholder="Ingrese el DNI del paciente (ej: 12.345.678)"
                               value="${pacientePreseleccionado ? pacientePreseleccionado.dni || '' : ''}"
                               autocomplete="off">
                        <div id="pacienteDropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid var(--border-color); border-radius: var(--border-radius); max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: var(--shadow-lg); margin-top: 4px;"></div>
                    </div>
                    <input type="hidden" name="pacienteId" id="pacienteIdInput" value="${pacientePreseleccionado ? pacientePreseleccionado.id : ''}" required>
                    <div id="pacienteSeleccionado" style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background: var(--bg-tertiary); border-radius: var(--border-radius); ${pacientePreseleccionado ? '' : 'display: none;'}">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <strong>${pacientePreseleccionado ? `${pacientePreseleccionado.nombre} ${pacientePreseleccionado.apellido}` : ''}</strong>
                                ${pacientePreseleccionado ? `<span style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-left: var(--spacing-sm);">DNI: ${pacientePreseleccionado.dni || 'N/A'}</span>` : ''}
                            </div>
                            <button type="button" class="clear-paciente-btn btn-icon" style="display: ${pacientePreseleccionado ? 'inline-block' : 'none'}; cursor: pointer;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <small style="color: var(--text-secondary); margin-top: var(--spacing-xs); display: block;">Escriba el DNI para buscar pacientes</small>
                </div>

                <div class="form-group">
                    <label>Médico *</label>
                    <select name="medicoId" class="form-control" required id="medicoSelect">
                        <option value="">Seleccionar médico</option>
                        ${medicos.map(m => {
                            const especialidad = m.especialidad || (m.especialidades && Array.isArray(m.especialidades) ? m.especialidades[0] : (m.especialidades || 'N/A'));
                            return `<option value="${m.id}" ${turno && turno.medicoId === m.id ? 'selected' : ''}>
                                ${m.nombre} - ${especialidad}
                            </option>`;
                        }).join('')}
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

            if (!medicoId || !fecha) {
                horaSelect.innerHTML = '<option value="">Seleccionar hora</option>';
                return;
            }

            try {
                const horariosDisponibles = await MedicosManager.getHorariosDisponibles(parseInt(medicoId), fecha);
                const horaActual = horaSelect.value;

                horaSelect.innerHTML = '<option value="">Seleccionar hora</option>' +
                    CONFIG.HORARIOS.map(h => {
                        const disponible = Array.isArray(horariosDisponibles) ? horariosDisponibles.includes(h) : false;
                        return `<option value="${h}" ${h === horaActual ? 'selected' : ''} ${!disponible ? 'disabled' : ''}>
                            ${h} ${!disponible ? '(Ocupado)' : ''}
                        </option>`;
                    }).join('');
            } catch (error) {
                console.error('Error al obtener horarios disponibles:', error);
                horaSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
            }
        };

        medicoSelect?.addEventListener('change', updateHorariosDisponibles);
        fechaInput?.addEventListener('change', updateHorariosDisponibles);

        // Funcionalidad de búsqueda de pacientes por DNI
        const pacienteSearchInput = document.getElementById('pacienteSearchInput');
        const pacienteDropdown = document.getElementById('pacienteDropdown');
        const pacienteIdInput = document.getElementById('pacienteIdInput');
        const pacienteSeleccionado = document.getElementById('pacienteSeleccionado');
        
        let searchTimeout = null;

        const buscarPacientes = async (dni) => {
            if (!dni || dni.length < 2) {
                pacienteDropdown.style.display = 'none';
                return;
            }

            try {
                const resultados = await PacientesManager.getAll({ 
                    activo: true, 
                    search: dni.replace(/\./g, '') // Quitar puntos del DNI para búsqueda
                });

                if (resultados.length === 0) {
                    pacienteDropdown.innerHTML = '<div style="padding: var(--spacing-md); color: var(--text-secondary); text-align: center;">No se encontraron pacientes</div>';
                    pacienteDropdown.style.display = 'block';
                    return;
                }

                pacienteDropdown.innerHTML = resultados.map(p => `
                    <div class="paciente-result-item" 
                         style="padding: var(--spacing-md); cursor: pointer; border-bottom: 1px solid var(--border-color); transition: background var(--transition-fast);"
                         onmouseover="this.style.background='var(--bg-secondary)'"
                         onmouseout="this.style.background='white'"
                         data-paciente-id="${p.id}"
                         data-paciente-nombre="${p.nombre} ${p.apellido}"
                         data-paciente-dni="${p.dni || ''}">
                        <div style="font-weight: 600; color: var(--text-primary);">${p.nombre} ${p.apellido}</div>
                        <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">DNI: ${p.dni || 'N/A'} ${p.telefono ? '| Tel: ' + p.telefono : ''}</div>
                    </div>
                `).join('');

                // Agregar eventos de clic a los resultados
                pacienteDropdown.querySelectorAll('.paciente-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const pacienteId = item.getAttribute('data-paciente-id');
                        const pacienteNombre = item.getAttribute('data-paciente-nombre');
                        const pacienteDni = item.getAttribute('data-paciente-dni');

                        pacienteIdInput.value = pacienteId;
                        pacienteSearchInput.value = pacienteDni;
                        pacienteSeleccionado.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <strong>${pacienteNombre}</strong>
                                    <span style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-left: var(--spacing-sm);">DNI: ${pacienteDni || 'N/A'}</span>
                                </div>
                                <button type="button" class="clear-paciente-btn btn-icon" style="cursor: pointer;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                        pacienteSeleccionado.style.display = 'block';
                        pacienteDropdown.style.display = 'none';
                        
                        // Agregar evento al nuevo botón de limpiar
                        pacienteSeleccionado.querySelector('.clear-paciente-btn')?.addEventListener('click', limpiarPaciente);
                    });
                });

                pacienteDropdown.style.display = 'block';
            } catch (error) {
                console.error('Error al buscar pacientes:', error);
                pacienteDropdown.innerHTML = '<div style="padding: var(--spacing-md); color: var(--error); text-align: center;">Error al buscar pacientes</div>';
                pacienteDropdown.style.display = 'block';
            }
        };

        const limpiarPaciente = () => {
            pacienteIdInput.value = '';
            pacienteSearchInput.value = '';
            pacienteSeleccionado.style.display = 'none';
            pacienteDropdown.style.display = 'none';
            pacienteSearchInput.focus();
        };

        pacienteSearchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const dni = e.target.value.trim();
            
            if (dni.length >= 2) {
                searchTimeout = setTimeout(() => {
                    buscarPacientes(dni);
                }, 300); // Debounce de 300ms
            } else {
                pacienteDropdown.style.display = 'none';
            }
        });

        pacienteSearchInput?.addEventListener('focus', () => {
            const dni = pacienteSearchInput.value.trim();
            if (dni.length >= 2) {
                buscarPacientes(dni);
            }
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!pacienteSearchInput?.contains(e.target) && !pacienteDropdown?.contains(e.target)) {
                pacienteDropdown.style.display = 'none';
            }
        });

        // Agregar evento al botón de limpiar inicial si existe
        pacienteSeleccionado?.querySelector('.clear-paciente-btn')?.addEventListener('click', limpiarPaciente);

        // Si hay paciente preseleccionado, actualizar horarios si hay médico y fecha
        if (pacientePreseleccionado && turno) {
            setTimeout(() => {
                updateHorariosDisponibles();
            }, 100);
        }

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
        try {
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
                        await window.dashboard.loadTurnos();
                    }
                    if (typeof window.dashboard.loadDashboard === 'function') {
                        await window.dashboard.loadDashboard();
                    }
                }
                // Si no hay dashboard, recargar página
                setTimeout(() => {
                    if (!window.dashboard || typeof window.dashboard.loadTurnos !== 'function') {
                        window.location.reload();
                    }
                }, 300);
            } else {
                NotificationManager.error(result?.message || 'Error al guardar el turno');
            }
        } catch (error) {
            console.error('Error al guardar turno:', error);
            NotificationManager.error(error.message || 'Error al guardar el turno');
        }
    }

    // Modal para crear/editar paciente
    static async openPacienteModal(paciente = null, pacienteId = null, userId = null) {
        const { ApiClient } = await import('../modules/api.js');
        const { AuthManager } = await import('../modules/auth.js');

        // Si se pasa un userId (para editar perfil), cargar datos completos desde usuarios
        if (userId && !paciente) {
            try {
                paciente = await ApiClient.getUsuarioCompleto(userId);
                if (!paciente) {
                    NotificationManager.error('No se pudo cargar la información del usuario');
                    return;
                }
            } catch (error) {
                console.error('Error al cargar usuario:', error);
                NotificationManager.error('Error al cargar la información del usuario');
                return;
            }
        } 
        // Si se pasa un pacienteId pero no el objeto paciente, cargar desde la API (para otros casos)
        else if (pacienteId && !paciente) {
            const { PacientesManager } = await import('../modules/pacientes.js');
            try {
                paciente = await PacientesManager.getById(pacienteId);
                if (!paciente) {
                    NotificationManager.error('No se pudo cargar la información del paciente');
                    return;
                }
            } catch (error) {
                console.error('Error al cargar paciente:', error);
                NotificationManager.error('Error al cargar la información del paciente');
                return;
            }
        }

        const isEdit = !!paciente;
        const title = isEdit ? 'Editar Perfil' : 'Nuevo Paciente';

        // Formatear fecha de nacimiento para el input date (YYYY-MM-DD)
        const fechaNacimiento = paciente?.fechaNacimiento 
            ? (paciente.fechaNacimiento.includes('T') 
                ? paciente.fechaNacimiento.split('T')[0] 
                : paciente.fechaNacimiento)
            : '';

        let content = `
            <form id="pacienteForm">
                <div id="pacienteFormLoading" style="text-align: center; padding: var(--spacing-xl); display: none;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
                    <p style="margin-top: var(--spacing-md);">Cargando datos...</p>
                </div>
                <div id="pacienteFormContent">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre *</label>
                            <input type="text" name="nombre" class="form-control" required 
                                value="${paciente ? (paciente.nombre || '') : ''}"
                                placeholder="Juan">
                        </div>
                        <div class="form-group">
                            <label>Apellido *</label>
                            <input type="text" name="apellido" class="form-control" required 
                                value="${paciente ? (paciente.apellido || '') : ''}"
                                placeholder="Pérez">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>DNI *</label>
                            <input type="text" name="dni" class="form-control" required 
                                pattern="[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}" 
                                placeholder="12.345.678"
                                maxlength="11"
                                value="${paciente ? (paciente.dni || '') : ''}">
                        </div>
                        <div class="form-group">
                            <label>Fecha de Nacimiento</label>
                            <input type="date" name="fechaNacimiento" class="form-control" 
                                value="${fechaNacimiento}"
                                max="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" id="pacienteEmail" class="form-control" required
                                value="${paciente ? (paciente.email || '') : ''}"
                                placeholder="ejemplo@email.com">
                            ${isEdit ? '' : '<small style="color: var(--text-secondary); margin-top: var(--spacing-xs); display: block;">El paciente usará este email para iniciar sesión</small>'}
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" name="telefono" class="form-control" 
                                value="${paciente ? (paciente.telefono || '') : ''}"
                                placeholder="(011) 1234-5678">
                        </div>
                    </div>

                    ${!isEdit ? `
                    <div class="form-row">
                        <div class="form-group">
                            <label>Contraseña *</label>
                            <input type="password" name="password" id="pacientePassword" class="form-control" required
                                minlength="8" maxlength="32"
                                pattern="(?=.*[A-Z])(?=.*\\d).{8,32}"
                                placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número">
                            <small style="color: var(--text-secondary); margin-top: var(--spacing-xs); display: block;">
                                Al menos 8 caracteres, 1 mayúscula y 1 número. El paciente usará esta contraseña para iniciar sesión.
                            </small>
                        </div>
                        <div class="form-group">
                            <label>Confirmar Contraseña *</label>
                            <input type="password" name="confirmPassword" id="pacienteConfirmPassword" class="form-control" required
                                maxlength="32"
                                placeholder="Repita la contraseña">
                            <small style="color: var(--text-secondary); margin-top: var(--spacing-xs); display: block;">
                                Debe coincidir con la contraseña ingresada
                            </small>
                        </div>
                    </div>
                    ` : ''}

                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" name="direccion" class="form-control" 
                            value="${paciente ? (paciente.direccion || '') : ''}"
                            placeholder="Av. Principal 123">
                    </div>
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn-secondary" onclick="ModalManager.closeModal('pacienteModal')">Cancelar</button>
            <button type="button" class="btn-primary" id="savePacienteBtn" onclick="ModalManager.savePaciente(${paciente ? (paciente.id || null) : 'null'}, ${userId || 'null'})">${isEdit ? 'Actualizar' : 'Guardar'} Paciente</button>
        `;

        const modal = this.openModal('pacienteModal', content, {
            title,
            footer,
            size: 'large'
        });

        // Formatear DNI mientras se escribe (solo para nuevo paciente)
        if (!isEdit) {
            const dniInput = document.querySelector('#pacienteForm input[name="dni"]');
            if (dniInput) {
                dniInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, ''); // Solo números
                    if (value.length > 0) {
                        if (value.length <= 2) {
                            value = value;
                        } else if (value.length <= 5) {
                            value = value.substring(0, 2) + '.' + value.substring(2);
                        } else {
                            value = value.substring(0, 2) + '.' + value.substring(2, 5) + '.' + value.substring(5, 8);
                        }
                    }
                    e.target.value = value;
                });
            }
        }

        return modal;
    }

    static async savePaciente(pacienteId, userId = null) {
        const form = document.getElementById('pacienteForm');
        if (!form) return;

        const formData = new FormData(form);
        const { ApiClient } = await import('../modules/api.js');
        const { AuthManager } = await import('../modules/auth.js');

        const isNuevo = !pacienteId && !userId;

        // Si es nuevo paciente, SIEMPRE crear paciente + usuario (email y contraseña obligatorios)
        if (isNuevo) {
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            const email = formData.get('email')?.trim();

            // Validaciones para nuevo paciente
            if (!formData.get('nombre')?.trim() || !formData.get('apellido')?.trim() || 
                !formData.get('dni')?.trim()) {
                NotificationManager.error('Por favor completa todos los campos requeridos (Nombre, Apellido, DNI, Email y Contraseña)');
                return;
            }

            // Validar email obligatorio
            if (!email) {
                NotificationManager.error('El email es obligatorio para crear un paciente');
                return;
            }

            // Validar contraseña obligatoria
            if (!password) {
                NotificationManager.error('La contraseña es obligatoria');
                return;
            }

            if (password.length < 8) {
                NotificationManager.error('La contraseña debe tener al menos 8 caracteres');
                return;
            }

            if (!/(?=.*[A-Z])(?=.*\d)/.test(password)) {
                NotificationManager.error('La contraseña debe contener al menos 1 mayúscula y 1 número');
                return;
            }

            if (password !== confirmPassword) {
                NotificationManager.error('Las contraseñas no coinciden');
                return;
            }

            // Convertir DNI de formato con puntos a solo números
            let dni = formData.get('dni').trim().replace(/\./g, '');

            // Preparar datos para registro (siempre crear paciente + usuario)
            const registerData = {
                nombre: formData.get('nombre').trim(),
                apellido: formData.get('apellido').trim(),
                email: email,
                password: password,
                confirmPassword: confirmPassword,
                rol: 'paciente',
                dni: dni,
                telefono: formData.get('telefono')?.trim() || null,
                fechaNacimiento: formData.get('fechaNacimiento') || null,
                direccion: formData.get('direccion')?.trim() || null
            };

            // Mostrar loading
            const saveButton = document.getElementById('savePacienteBtn');
            const originalText = saveButton?.textContent;
            const formContent = document.getElementById('pacienteFormContent');
            
            if (saveButton) {
                saveButton.disabled = true;
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            }
            
            if (formContent) {
                formContent.style.opacity = '0.6';
                formContent.style.pointerEvents = 'none';
            }

            try {
                // Siempre usar endpoint de registro (crea paciente + usuario)
                const response = await ApiClient.register(registerData);
                
                if (response && response.success && response.user) {
                    NotificationManager.success('Paciente registrado exitosamente. El paciente podrá iniciar sesión con su email y contraseña.');
                    this.closeModal('pacienteModal');
                    
                    // Recargar vista
                    if (window.dashboard) {
                        if (typeof window.dashboard.loadPacientes === 'function') {
                            await window.dashboard.loadPacientes();
                        }
                        if (typeof window.dashboard.loadDashboard === 'function') {
                            await window.dashboard.loadDashboard();
                        }
                    }
                } else {
                    NotificationManager.error(response?.message || 'Error al registrar el paciente');
                    if (saveButton) {
                        saveButton.disabled = false;
                        saveButton.innerHTML = originalText || 'Guardar';
                    }
                    if (formContent) {
                        formContent.style.opacity = '1';
                        formContent.style.pointerEvents = 'auto';
                    }
                }
            } catch (error) {
                console.error('Error al guardar paciente:', error);
                NotificationManager.error(error.message || 'Error al guardar el paciente');
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.innerHTML = originalText || 'Guardar';
                }
                if (formContent) {
                    formContent.style.opacity = '1';
                    formContent.style.pointerEvents = 'auto';
                }
            }
            return; // Salir aquí ya que manejamos el caso de nuevo paciente
        }

        // Continuar con la lógica de edición existente
        const pacienteData = {
            nombre: formData.get('nombre').trim(),
            apellido: formData.get('apellido').trim(),
            dni: formData.get('dni').trim(),
            telefono: formData.get('telefono').trim(),
            email: formData.get('email').trim() || null,
            fechaNacimiento: formData.get('fechaNacimiento') || null,
            direccion: formData.get('direccion').trim() || null
        };

        // Validación (para edición: nombre, apellido y DNI son obligatorios; teléfono y dirección opcionales)
        if (!pacienteData.nombre || !pacienteData.apellido || !pacienteData.dni) {
            NotificationManager.error('Por favor completa todos los campos requeridos (Nombre, Apellido, DNI)');
            return;
        }

        // Mostrar loading
        const saveButton = document.getElementById('savePacienteBtn');
        const originalText = saveButton?.textContent;
        const formContent = document.getElementById('pacienteFormContent');
        
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        if (formContent) {
            formContent.style.opacity = '0.6';
            formContent.style.pointerEvents = 'none';
        }

        try {
            // Crear un timeout de 10 segundos
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('TIMEOUT'));
                }, 10000); // 10 segundos
            });

            let result;
            let usuarioActualizado = null;
            
            // Si hay userId, actualizar usando el endpoint de usuarios (para editar perfil)
            if (userId) {
                try {
                    // Competir entre la petición y el timeout
                    usuarioActualizado = await Promise.race([
                        ApiClient.updateUsuario(userId, pacienteData),
                        timeoutPromise
                    ]);
                    result = { success: true, user: usuarioActualizado, paciente: usuarioActualizado };
                } catch (error) {
                    // Detectar timeout de diferentes formas
                    if (error.message === 'TIMEOUT' || 
                        error.message?.includes('TIMEOUT') || 
                        error.message === 'No se pudo actualizar el perfil. Intente más tarde.') {
                        result = { success: false, message: 'No se pudo actualizar el perfil. Intente más tarde.' };
                    } else {
                        result = { success: false, message: error.message || 'No se pudo actualizar el perfil. Intente más tarde.' };
                    }
                }
            } 
            // Si hay pacienteId pero no userId, usar el endpoint de pacientes (para otros casos)
            else if (pacienteId) {
                const { PacientesManager } = await import('../modules/pacientes.js');
                try {
                    result = await Promise.race([
                        PacientesManager.update(pacienteId, pacienteData),
                        timeoutPromise
                    ]);
                } catch (error) {
                    if (error.message === 'TIMEOUT' || error.message?.includes('TIMEOUT')) {
                        result = { success: false, message: 'No se pudo actualizar el perfil. Intente más tarde.' };
                    } else {
                        result = { success: false, message: error.message || 'No se pudo actualizar el perfil. Intente más tarde.' };
                    }
                }
            } 
            // Si no hay ID, crear nuevo paciente
            else {
                const { PacientesManager } = await import('../modules/pacientes.js');
                try {
                    result = await Promise.race([
                        PacientesManager.create(pacienteData),
                        timeoutPromise
                    ]);
                } catch (error) {
                    if (error.message === 'TIMEOUT' || error.message?.includes('TIMEOUT')) {
                        result = { success: false, message: 'No se pudo crear el paciente. Intente más tarde.' };
                    } else {
                        result = { success: false, message: error.message || 'No se pudo crear el paciente. Intente más tarde.' };
                    }
                }
            }
            
            // Si result no está definido o no tiene success, es un error
            if (!result || result.success === undefined) {
                result = { success: false, message: 'No se pudo actualizar el perfil. Intente más tarde.' };
            }

            // Verificar si hubo éxito o error
            if (result && result.success) {
                NotificationManager.success(userId || pacienteId ? 'Perfil actualizado exitosamente' : 'Paciente creado exitosamente');
                this.closeModal('pacienteModal');
                
                // Si es el usuario actual, actualizar información del usuario en el sistema
                const currentUser = AuthManager.getCurrentUser();
                if (currentUser && (userId && parseInt(currentUser.id) === parseInt(userId) || 
                    currentUser.pacienteId && parseInt(currentUser.pacienteId) === parseInt(pacienteId))) {
                    // Actualizar datos del usuario actual
                    if (result.user || result.paciente) {
                        const datosActualizados = result.user || result.paciente;
                        currentUser.nombre = datosActualizados.nombre;
                        currentUser.apellido = datosActualizados.apellido;
                        if (datosActualizados.email) {
                            currentUser.email = datosActualizados.email;
                        }
                        // Guardar usuario actualizado (si usas storage)
                        const { StorageManager } = await import('../modules/storage.js');
                        const { CONFIG } = await import('../config.js');
                        StorageManager.set(CONFIG.STORAGE.CURRENT_USER, currentUser);
                    }
                }
                
                // Actualizar nombre en el sidebar
                const userName = document.querySelector('.user-name');
                if (userName && (result.user || result.paciente)) {
                    const datos = result.user || result.paciente;
                    userName.textContent = `${datos.nombre} ${datos.apellido || ''}`.trim();
                }
                
                // Recargar vista del dashboard
                if (window.dashboard) {
                    // Si es el dashboard de paciente, recargar perfil
                    if (typeof window.dashboard.loadPerfil === 'function') {
                        window.dashboard.loadPerfil();
                    }
                    // Recargar otras secciones si existen
                    if (typeof window.dashboard.loadPacientes === 'function') {
                        window.dashboard.loadPacientes();
                    }
                    if (typeof window.dashboard.loadDashboard === 'function') {
                        window.dashboard.loadDashboard();
                    }
                } else {
                    // Si no hay dashboard, recargar página
                    setTimeout(() => {
                        window.location.reload();
                    }, 300);
                }
            } else {
                // Cualquier error o timeout: cerrar modal y mostrar error
                const errorMessage = result?.message || 'No se pudo actualizar el perfil. Intente más tarde.';
                this.closeModal('pacienteModal');
                NotificationManager.error(errorMessage);
            }
        } catch (error) {
            console.error('Error al guardar paciente:', error);
            // Cualquier error no manejado: cerrar modal y mostrar error
            this.closeModal('pacienteModal');
            const errorMessage = error.message === 'TIMEOUT' 
                ? 'No se pudo actualizar el perfil. Intente más tarde.' 
                : (error.message || 'No se pudo actualizar el perfil. Intente más tarde.');
            NotificationManager.error(errorMessage);
        } finally {
            // Siempre restaurar el botón y el formulario, por si acaso
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = originalText || 'Guardar';
            }
            if (formContent) {
                formContent.style.opacity = '1';
                formContent.style.pointerEvents = 'auto';
            }
        }
    }

    // Modal para crear/editar médico
    static async openMedicoModal(medico = null, medicoId = null) {
        const { ApiClient } = await import('../modules/api.js');
        const { MedicosManager } = await import('../modules/medicos.js');

        // PRIMERO: Resolver cualquier Promise que pueda venir en el objeto medico
        if (medico && typeof medico.then === 'function') {
            console.log('Resolviendo Promise en objeto medico...');
            try {
                medico = await medico;
            } catch (error) {
                console.error('Error al resolver Promise de medico:', error);
                medico = null;
            }
        }

        // Convertir medicoId a número si es necesario
        if (medicoId && typeof medicoId === 'string') {
            medicoId = parseInt(medicoId);
        }
        
        console.log('=== INICIO MODAL ===');
        console.log('medicoId recibido:', medicoId, '(tipo:', typeof medicoId, ')');
        console.log('medico recibido inicial:', medico);
        
        // Si se pasa un medicoId, SIEMPRE cargar desde la API para asegurar datos actualizados
        // Ignoramos el objeto medico pasado si hay medicoId
        let isLoading = false;
        if (medicoId && !isNaN(medicoId)) {
            isLoading = true;
            try {
                console.log('Cargando médico desde API con ID:', medicoId);
                // Siempre cargar desde la API para asegurar datos actualizados
                const medicoCargado = await MedicosManager.getById(medicoId);
                console.log('Resultado de getById:', medicoCargado);
                
                // Asegurarse de que el objeto no sea una Promise
                if (medicoCargado && typeof medicoCargado.then === 'function') {
                    console.log('Resultado es una Promise, resolviendo...');
                    medico = await medicoCargado;
                } else {
                    medico = medicoCargado;
                }
                
                if (!medico) {
                    NotificationManager.error('No se pudo cargar la información del médico');
                    return;
                }
                
                console.log('Médico cargado desde API (final):', medico);
                isLoading = false;
            } catch (error) {
                console.error('Error al cargar médico desde API:', error);
                NotificationManager.error('Error al cargar la información del médico: ' + (error.message || 'Error desconocido'));
                isLoading = false;
                return;
            }
        }

        const isEdit = !!medico;
        const title = isEdit ? 'Editar Información' : 'Nuevo Médico';

        // Debug: Log del objeto médico recibido
        console.log('=== DEBUG MODAL MÉDICO ===');
        console.log('Médico recibido en modal:', medico);
        console.log('MedicoId recibido:', medicoId);
        console.log('Tipo de médico:', typeof medico);
        console.log('Es Promise?', medico && typeof medico.then === 'function');
        
        if (medico && typeof medico === 'object' && typeof medico.then !== 'function') {
            console.log('Nombre:', medico.nombre);
            console.log('Matrícula:', medico.matricula);
            console.log('Horario:', medico.horario);
            console.log('Email:', medico.email);
            console.log('Teléfono:', medico.telefono);
            console.log('Especialidad:', medico.especialidad);
            console.log('Especialidades:', medico.especialidades);
            console.log('Todas las propiedades:', Object.keys(medico));
        } else if (medico && typeof medico.then === 'function') {
            console.error('ERROR: médico es una Promise no resuelta!');
        } else {
            console.warn('medico es null o undefined');
        }
        console.log('===========================');

        // Formatear especialidad: si es array, tomar el primero, si es string, usar directamente
        let especialidadValue = '';
        if (medico) {
            if (medico.especialidad) {
                especialidadValue = Array.isArray(medico.especialidad) ? medico.especialidad[0] : String(medico.especialidad);
            } else if (medico.especialidades) {
                if (Array.isArray(medico.especialidades)) {
                    especialidadValue = medico.especialidades.length > 0 ? String(medico.especialidades[0]) : '';
                } else if (typeof medico.especialidades === 'string') {
                    especialidadValue = medico.especialidades.split(', ')[0] || '';
                }
            }
        }

        // Preparar valores para el formulario con valores por defecto
        // Usar String() para asegurar que nunca sea undefined o null
        const nombreValue = medico?.nombre ? String(medico.nombre) : '';
        const matriculaValue = medico?.matricula ? String(medico.matricula) : '';
        const horarioValue = medico?.horario ? String(medico.horario) : '';
        const telefonoValue = medico?.telefono ? String(medico.telefono) : '';
        const emailValue = medico?.email ? String(medico.email) : '';

        let content = `
            <form id="medicoForm">
                <div id="medicoFormLoading" style="text-align: center; padding: var(--spacing-xl); ${isLoading ? '' : 'display: none;'}">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
                    <p style="margin-top: var(--spacing-md);">Cargando datos...</p>
                </div>
                <div id="medicoFormContent" style="${isLoading ? 'display: none;' : ''}">
                    <div class="form-group">
                        <label>Nombre Completo *</label>
                        <input type="text" name="nombre" class="form-control" required 
                            value="${nombreValue}" 
                            placeholder="Dr. Juan Pérez">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Especialidad *</label>
                            <input type="text" name="especialidad" class="form-control" required 
                                value="${especialidadValue}" 
                                placeholder="Cardiología">
                        </div>
                        <div class="form-group">
                            <label>Matrícula *</label>
                            <input type="text" name="matricula" class="form-control" required 
                                value="${matriculaValue}" 
                                placeholder="12345">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Horario *</label>
                            <input type="text" name="horario" class="form-control" required 
                                value="${horarioValue}" 
                                placeholder="08:00 - 17:00">
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" name="telefono" class="form-control" 
                                value="${telefonoValue}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" class="form-control" 
                            value="${emailValue}">
                    </div>
                </div>
            </form>
        `;

        // Determinar el ID a usar para guardar (prioridad: medico.id si existe, sino medicoId)
        const idParaGuardar = medico?.id || medicoId || null;
        
        const footer = `
            <button type="button" class="btn-secondary" onclick="ModalManager.closeModal('medicoModal')">Cancelar</button>
            <button type="button" class="btn-primary" id="saveMedicoBtn" onclick="ModalManager.saveMedico(${idParaGuardar || 'null'}, ${medicoId || 'null'})">${isEdit ? 'Actualizar' : 'Guardar'} Información</button>
        `;

        return this.openModal('medicoModal', content, {
            title,
            footer,
            size: 'large'
        });
    }

    static async saveMedico(medicoId, medicoIdParam = null) {
        const form = document.getElementById('medicoForm');
        if (!form) return;

        const formData = new FormData(form);
        const { ApiClient } = await import('../modules/api.js');
        const { MedicosManager } = await import('../modules/medicos.js');
        const { AuthManager } = await import('../modules/auth.js');

        const medicoData = {
            nombre: formData.get('nombre').trim(),
            especialidad: formData.get('especialidad').trim(),
            matricula: formData.get('matricula').trim(),
            horario: formData.get('horario').trim(),
            telefono: formData.get('telefono').trim() || null,
            email: formData.get('email').trim() || null
        };

        // Validación
        if (!medicoData.nombre || !medicoData.especialidad || !medicoData.matricula || !medicoData.horario) {
            NotificationManager.error('Por favor completa todos los campos requeridos');
            return;
        }

        // Mostrar loading
        const saveButton = document.getElementById('saveMedicoBtn');
        const originalText = saveButton?.textContent;
        const formContent = document.getElementById('medicoFormContent');
        
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }
        
        if (formContent) {
            formContent.style.opacity = '0.6';
            formContent.style.pointerEvents = 'none';
        }

        try {
            // Crear un timeout de 10 segundos
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('TIMEOUT'));
                }, 10000); // 10 segundos
            });

            let result;
            let medicoActualizado = null;
            
            // Si hay medicoId, actualizar usando el endpoint de médicos
            if (medicoId || medicoIdParam) {
                const idToUpdate = medicoId || medicoIdParam;
                try {
                    // Competir entre la petición y el timeout
                    result = await Promise.race([
                        MedicosManager.update(idToUpdate, medicoData),
                        timeoutPromise
                    ]);
                    // result ya tiene la estructura { success: true, medico: {...} }
                } catch (error) {
                    // Detectar timeout de diferentes formas
                    if (error.message === 'TIMEOUT' || 
                        error.message?.includes('TIMEOUT') || 
                        error.message === 'No se pudo actualizar la disponibilidad. Intente más tarde.') {
                        result = { success: false, message: 'No se pudo actualizar la disponibilidad. Intente más tarde.' };
                    } else {
                        result = { success: false, message: error.message || 'No se pudo actualizar la disponibilidad. Intente más tarde.' };
                    }
                }
            } 
            // Si no hay ID, crear nuevo médico
            else {
                const { MedicosManager } = await import('../modules/medicos.js');
                try {
                    result = await Promise.race([
                        MedicosManager.create(medicoData),
                        timeoutPromise
                    ]);
                } catch (error) {
                    if (error.message === 'TIMEOUT' || error.message?.includes('TIMEOUT')) {
                        result = { success: false, message: 'No se pudo crear el médico. Intente más tarde.' };
                    } else {
                        result = { success: false, message: error.message || 'No se pudo crear el médico. Intente más tarde.' };
                    }
                }
            }
            
            // Si result no está definido o no tiene success, es un error
            if (!result || result.success === undefined) {
                result = { success: false, message: 'No se pudo actualizar la disponibilidad. Intente más tarde.' };
            }

            // Verificar si hubo éxito o error
            if (result && result.success) {
                NotificationManager.success(medicoId || medicoIdParam ? 'Disponibilidad actualizada exitosamente' : 'Médico creado exitosamente');
                this.closeModal('medicoModal');
                
                // Si es el médico actual, actualizar información en el sistema
                const currentUser = AuthManager.getCurrentUser();
                if (currentUser && currentUser.medicoId && 
                    (parseInt(currentUser.medicoId) === parseInt(medicoId || medicoIdParam))) {
                    // Actualizar datos del médico actual
                    if (result.medico) {
                        // Actualizar médico en el objeto del dashboard si existe
                        if (window.dashboard && window.dashboard.medico) {
                            window.dashboard.medico = { ...window.dashboard.medico, ...result.medico };
                        }
                    }
                }
                
                // Recargar vista del dashboard
                if (window.dashboard) {
                    // Si es el dashboard de médico, recargar disponibilidad
                    if (typeof window.dashboard.loadDisponibilidad === 'function') {
                        try {
                            await window.dashboard.loadDisponibilidad();
                        } catch (error) {
                            console.error('Error al recargar disponibilidad:', error);
                        }
                    }
                    // Recargar otras secciones solo si estamos en el dashboard correcto
                    // Para admin dashboard
                    if (typeof window.dashboard.loadMedicos === 'function' && 
                        document.getElementById('medicos-grid')) {
                        try {
                            const loadMedicosResult = window.dashboard.loadMedicos();
                            // Si devuelve una Promise, esperarla
                            if (loadMedicosResult && typeof loadMedicosResult.then === 'function') {
                                await loadMedicosResult;
                            }
                        } catch (error) {
                            console.error('Error al recargar médicos:', error);
                        }
                    }
                    // Recargar dashboard general
                    if (typeof window.dashboard.loadDashboard === 'function') {
                        try {
                            const loadDashboardResult = window.dashboard.loadDashboard();
                            // Si devuelve una Promise, esperarla
                            if (loadDashboardResult && typeof loadDashboardResult.then === 'function') {
                                await loadDashboardResult;
                            }
                        } catch (error) {
                            console.error('Error al recargar dashboard:', error);
                        }
                    }
                } else {
                    // Si no hay dashboard, recargar página
                    setTimeout(() => {
                        window.location.reload();
                    }, 300);
                }
            } else {
                // Cualquier error o timeout: cerrar modal y mostrar error
                const errorMessage = result?.message || 'No se pudo actualizar la disponibilidad. Intente más tarde.';
                this.closeModal('medicoModal');
                NotificationManager.error(errorMessage);
            }
        } catch (error) {
            console.error('Error al guardar médico:', error);
            // Cualquier error no manejado: cerrar modal y mostrar error
            this.closeModal('medicoModal');
            const errorMessage = error.message === 'TIMEOUT' 
                ? 'No se pudo actualizar la disponibilidad. Intente más tarde.' 
                : (error.message || 'No se pudo actualizar la disponibilidad. Intente más tarde.');
            NotificationManager.error(errorMessage);
        } finally {
            // Siempre restaurar el botón y el formulario, por si acaso
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = originalText || 'Guardar';
            }
            if (formContent) {
                formContent.style.opacity = '1';
                formContent.style.pointerEvents = 'auto';
            }
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


    // Modal de información del footer (reutilizable)
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
                                <div style="padding: var(--spacing-md); background: var(--bg-tertiary); border-radius: var(--border-radius);">
                                    <strong style="color: var(--primary);">¿Cómo cambio mi contraseña?</strong>
                                    <p style="margin-top: var(--spacing-xs); color: var(--text-secondary);">
                                        Ve a "Mi Perfil" y haz clic en "Editar Perfil" para actualizar tus datos y contraseña.
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
        // Si ModalManager no está cargado aún, esperar un poco
        setTimeout(() => {
            if (window.ModalManager) {
                window.ModalManager.openInfoModal(type);
            } else {
                console.error('ModalManager no está disponible');
            }
        }, 100);
    }
};

