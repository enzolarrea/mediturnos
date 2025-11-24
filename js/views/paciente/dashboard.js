import { AuthManager } from '../../modules/auth.js';
import { TurnosManager } from '../../modules/turnos.js';
import { PacientesManager } from '../../modules/pacientes.js';
import { MedicosManager } from '../../modules/medicos.js';
import { NotificationManager } from '../../modules/notifications.js';
import { CONFIG } from '../../config.js';

class PacienteDashboard {
    constructor() {
        if (!AuthManager.hasRole(CONFIG.ROLES.PACIENTE)) {
            window.location.href = '../../landing.html';
            return;
        }
        this.user = AuthManager.getCurrentUser();
        this.paciente = null;
        // No llamar init() aquí, se llamará después
    }

    async loadPacienteData() {
        if (this.user && this.user.pacienteId) {
            this.paciente = await PacientesManager.getById(this.user.pacienteId);
        }
    }

    async init() {
        await this.loadPacienteData();
        this.setupNavigation();
        await this.loadDashboard();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', async () => {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                item.classList.add('active');
                const section = document.getElementById(item.getAttribute('data-section'));
                if (section) {
                    section.classList.add('active');
                    const sectionId = item.getAttribute('data-section');
                    if (sectionId === 'dashboard') await this.loadDashboard();
                    else if (sectionId === 'turnos') await this.loadTurnos();
                    else if (sectionId === 'reservar') await this.loadReservar();
                    else if (sectionId === 'historial') await this.loadHistorial();
                    else if (sectionId === 'perfil') this.loadPerfil();
                }
            });
        });
    }

    async loadDashboard() {
        if (!this.paciente) {
            await this.loadPacienteData();
            if (!this.paciente) return;
        }

        const div = document.getElementById('proximos-turnos');
        if (!div) return;

        try {
            const proximos = await TurnosManager.getProximosTurnos(5);
            const turnosPaciente = proximos.filter(t => 
                t.pacienteId === this.paciente.id || 
                t.pacienteId === parseInt(this.paciente.id)
            );

            if (turnosPaciente.length === 0) {
                div.innerHTML = '<p class="text-center">No tienes turnos próximos</p>';
            } else {
                // Obtener información de médicos
                const medicosMap = {};
                for (const t of turnosPaciente) {
                    if (t.medicoId && !medicosMap[t.medicoId]) {
                        medicosMap[t.medicoId] = await MedicosManager.getById(t.medicoId);
                    }
                }

                div.innerHTML = turnosPaciente.map(t => {
                    const medico = medicosMap[t.medicoId];
                    const estado = t.estado || t.estadoCodigo || 'pendiente';
                    const especialidad = medico?.especialidad || medico?.especialidades?.[0] || 'N/A';
                    return `<div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <div>
                            <strong>${t.fecha} ${t.hora}</strong><br>
                            ${medico ? medico.nombre + ' - ' + especialidad : 'N/A'}
                        </div>
                        <div>
                            <span class="badge badge-${estado === 'confirmado' ? 'success' : 'warning'}">${estado}</span>
                            <button class="btn-icon" onclick="cancelarTurno(${t.id})"><i class="fas fa-times"></i></button>
                        </div>
                    </div>`;
                }).join('');
            }
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            div.innerHTML = '<p class="text-center text-error">Error al cargar turnos</p>';
        }
    }

    async loadTurnos() {
        if (!this.paciente) {
            await this.loadPacienteData();
            if (!this.paciente) return;
        }
        
        const div = document.getElementById('mis-turnos');
        if (!div) return;

        try {
            const turnos = await TurnosManager.getAll({ pacienteId: this.paciente.id });
            
            if (turnos.length === 0) {
                div.innerHTML = '<p class="text-center">No tienes turnos registrados</p>';
                return;
            }

            // Obtener información de médicos
            const medicosMap = {};
            for (const t of turnos) {
                if (t.medicoId && !medicosMap[t.medicoId]) {
                    medicosMap[t.medicoId] = await MedicosManager.getById(t.medicoId);
                }
            }
            
            div.innerHTML = turnos.map(t => {
                const medico = medicosMap[t.medicoId];
                const estado = t.estado || t.estadoCodigo || 'pendiente';
                const especialidad = medico?.especialidad || medico?.especialidades?.[0] || 'N/A';
                return `<div class="card" style="margin-bottom: var(--spacing-md);">
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <strong>${t.fecha} ${t.hora}</strong><br>
                                ${medico ? medico.nombre + ' - ' + especialidad : 'N/A'}
                            </div>
                            <div>
                                <span class="badge badge-${estado === 'confirmado' ? 'success' : estado === 'cancelado' ? 'error' : 'warning'}">${estado}</span>
                                ${estado !== 'cancelado' && estado !== 'completado' ? 
                                    `<button class="btn-icon" onclick="cancelarTurno(${t.id})"><i class="fas fa-times"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } catch (error) {
            console.error('Error al cargar turnos:', error);
            div.innerHTML = '<p class="text-center text-error">Error al cargar turnos</p>';
        }
    }

    async loadReservar() {
        if (!this.paciente) {
            await this.loadPacienteData();
            if (!this.paciente) {
                NotificationManager.error('No se encontró información del paciente');
                return;
            }
        }

        const content = document.getElementById('reservar-content');
        if (!content) return;

        try {
            const medicos = await MedicosManager.getAll({ activo: true });
            const hoy = new Date().toISOString().split('T')[0];
            
            content.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <form id="reservarForm">
                            <div class="form-group">
                                <label>Médico / Especialidad *</label>
                                <select name="medicoId" class="form-control" required id="reservarMedicoSelect">
                                    <option value="">Seleccionar médico</option>
                                    ${medicos.map(m => {
                                        const especialidad = m.especialidad || (m.especialidades && m.especialidades[0]) || 'N/A';
                                        return `<option value="${m.id}">${m.nombre} - ${especialidad}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Fecha *</label>
                                    <input type="date" name="fecha" class="form-control" required 
                                        id="reservarFechaInput" min="${hoy}">
                                </div>
                                <div class="form-group">
                                    <label>Hora *</label>
                                    <select name="hora" class="form-control" required id="reservarHoraSelect">
                                        <option value="">Seleccionar hora</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Motivo de consulta</label>
                                <textarea name="motivo" class="form-control" rows="3" placeholder="Describir el motivo de la consulta..."></textarea>
                            </div>
                            <button type="submit" class="btn-primary" id="reservarSubmitBtn">
                                <i class="fas fa-calendar-plus"></i> Reservar Turno
                            </button>
                        </form>
                    </div>
                </div>
            `;

            // Actualizar horarios disponibles cuando cambia médico o fecha
            const medicoSelect = document.getElementById('reservarMedicoSelect');
            const fechaInput = document.getElementById('reservarFechaInput');
            const horaSelect = document.getElementById('reservarHoraSelect');

            const updateHorariosDisponibles = async () => {
                const medicoId = medicoSelect.value;
                const fecha = fechaInput.value;

                if (!medicoId || !fecha) {
                    horaSelect.innerHTML = '<option value="">Seleccionar hora</option>';
                    return;
                }

                try {
                    const horariosDisponibles = await MedicosManager.getHorariosDisponibles(parseInt(medicoId), fecha);
                    
                    horaSelect.innerHTML = '<option value="">Seleccionar hora</option>' +
                        CONFIG.HORARIOS.map(h => {
                            const disponible = horariosDisponibles.includes(h);
                            return `<option value="${h}" ${!disponible ? 'disabled' : ''}>
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

            const form = document.getElementById('reservarForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.reservarTurno(e.target);
                });
            }
        } catch (error) {
            console.error('Error al cargar formulario de reserva:', error);
            content.innerHTML = '<p class="text-error">Error al cargar el formulario de reserva</p>';
        }
    }

    async reservarTurno(form) {
        if (!this.paciente) {
            await this.loadPacienteData();
            if (!this.paciente) {
                NotificationManager.error('No se encontró información del paciente');
                return;
            }
        }

        const formData = new FormData(form);
        const turnoData = {
            pacienteId: this.paciente.id,
            medicoId: parseInt(formData.get('medicoId')),
            fecha: formData.get('fecha'),
            hora: formData.get('hora'),
            motivo: formData.get('motivo') || '',
            estado: 'pendiente'
        };

        // Validación
        if (!turnoData.medicoId || !turnoData.fecha || !turnoData.hora) {
            NotificationManager.error('Por favor completa todos los campos requeridos');
            return;
        }

        // Deshabilitar botón durante la petición
        const submitButton = document.getElementById('reservarSubmitBtn');
        const originalText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Reservando...';
        }

        try {
            const result = await TurnosManager.create(turnoData);
            if (result.success) {
                NotificationManager.success('Turno reservado exitosamente');
                form.reset();
                // Recargar secciones
                await this.loadDashboard();
                await this.loadTurnos();
                // Cambiar a la sección de turnos para ver el nuevo turno
                const turnosNav = document.querySelector('[data-section="turnos"]');
                if (turnosNav) {
                    turnosNav.click();
                }
            } else {
                NotificationManager.error(result.message || 'Error al reservar el turno');
            }
        } catch (error) {
            console.error('Error al reservar turno:', error);
            NotificationManager.error(error.message || 'Error al reservar el turno');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    }

    async loadHistorial() {
        if (!this.paciente) {
            await this.loadPacienteData();
            if (!this.paciente) return;
        }
        
        const content = document.getElementById('historial-content');
        if (!content) return;

        try {
            const historial = await PacientesManager.getHistorial(this.paciente.id);
            
            if (historial.length === 0) {
                content.innerHTML = '<p class="text-center">No hay historial disponible</p>';
            } else {
                // Obtener información de médicos
                const medicosMap = {};
                for (const t of historial) {
                    if (t.medicoId && !medicosMap[t.medicoId]) {
                        medicosMap[t.medicoId] = await MedicosManager.getById(t.medicoId);
                    }
                }

                content.innerHTML = historial.map(t => {
                    const medico = medicosMap[t.medicoId];
                    const estado = t.estado || t.estadoCodigo || 'pendiente';
                    return `<div class="card" style="margin-bottom: var(--spacing-md);">
                        <div class="card-body">
                            <strong>${t.fecha} ${t.hora}</strong> - ${medico ? medico.nombre : 'N/A'}<br>
                            <span class="badge badge-${estado === 'completado' ? 'success' : estado === 'cancelado' ? 'error' : 'warning'}">${estado}</span>
                        </div>
                    </div>`;
                }).join('');
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
            content.innerHTML = '<p class="text-center text-error">Error al cargar historial</p>';
        }
    }

    loadPerfil() {
        if (!this.paciente) return;
        const content = document.getElementById('perfil-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h4>Datos Personales</h4>
                    <p><strong>Nombre:</strong> ${this.paciente.nombre} ${this.paciente.apellido}</p>
                    <p><strong>DNI:</strong> ${this.paciente.dni}</p>
                    <p><strong>Teléfono:</strong> ${this.paciente.telefono}</p>
                    <p><strong>Email:</strong> ${this.user.email}</p>
                    <button class="btn-primary" onclick="editarPerfil()">
                        <i class="fas fa-edit"></i> Editar Perfil
                    </button>
                </div>
            </div>
        `;
    }
}

window.logout = async function() {
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.confirm(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        () => {
            AuthManager.logout();
            window.location.href = '../../landing.html';
        }
    );
};

window.irAReservar = () => {
    const reservarNav = document.querySelector('[data-section="reservar"]');
    if (reservarNav) {
        reservarNav.click();
    } else {
        console.error('No se encontró el elemento de navegación "reservar"');
    }
};

window.cancelarTurno = async function(id) {
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.confirm(
        'Cancelar Turno',
        '¿Estás seguro de que deseas cancelar este turno? Esta acción no se puede deshacer.',
        async () => {
            try {
                const result = await TurnosManager.cancel(id);
                if (result.success) {
                    NotificationManager.success('Turno cancelado exitosamente');
                    if (window.dashboard) {
                        await window.dashboard.loadDashboard();
                        await window.dashboard.loadTurnos();
                    } else {
                        const dashboard = new PacienteDashboard();
                        await dashboard.loadDashboard();
                        await dashboard.loadTurnos();
                    }
                } else {
                    NotificationManager.error(result.message || 'Error al cancelar el turno');
                }
            } catch (error) {
                console.error('Error al cancelar turno:', error);
                NotificationManager.error(error.message || 'Error al cancelar el turno');
            }
        }
    );
};

window.editarPerfil = async function() {
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    const { PacientesManager } = await import('../../modules/pacientes.js');
    
    const user = AuthManager.getCurrentUser();
    if (!user || !user.pacienteId) {
        NotificationManager.error('No se encontró información del paciente');
        return;
    }
    
    const paciente = PacientesManager.getById(user.pacienteId);
    if (!paciente) {
        NotificationManager.error('Paciente no encontrado');
        return;
    }
    
    await window.ModalManager.openPacienteModal(paciente);
};

// Inicializar dashboard cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        const pacienteDashboard = new PacienteDashboard();
        await pacienteDashboard.init();
        window.dashboard = pacienteDashboard; // Hacer disponible globalmente
    });
} else {
    (async () => {
        const pacienteDashboard = new PacienteDashboard();
        await pacienteDashboard.init();
        window.dashboard = pacienteDashboard; // Hacer disponible globalmente
    })();
}

