// ============================================
// DASHBOARD ADMINISTRADOR
// ============================================

import { AuthManager } from '../../modules/auth.js';
import { TurnosManager } from '../../modules/turnos.js';
import { PacientesManager } from '../../modules/pacientes.js';
import { MedicosManager } from '../../modules/medicos.js';
import { UsuariosManager } from '../../modules/usuarios.js';
import { NotificationManager } from '../../modules/notifications.js';
import { CONFIG } from '../../config.js';

class AdminDashboard {
    constructor() {
        this.init();
    }

    init() {
        // Verificar permisos
        if (!AuthManager.hasRole(CONFIG.ROLES.ADMIN)) {
            window.location.href = '../../landing.html';
            return;
        }

        this.setupNavigation();
        this.loadDashboard();
        this.setupEventListeners();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.content-section');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.getAttribute('data-section');
                
                navItems.forEach(nav => nav.classList.remove('active'));
                sections.forEach(sec => sec.classList.remove('active'));
                
                item.classList.add('active');
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    document.querySelector('.page-title').textContent = 
                        this.getSectionTitle(sectionId);
                    
                    // Cargar contenido según sección
                    if (sectionId === 'dashboard') this.loadDashboard();
                    else if (sectionId === 'turnos') this.loadTurnos();
                    else if (sectionId === 'pacientes') this.loadPacientes();
                    else if (sectionId === 'medicos') this.loadMedicos();
                    else if (sectionId === 'usuarios') this.loadUsuarios();
                    else if (sectionId === 'reportes') this.loadReportes();
                }
            });
        });
    }

    getSectionTitle(sectionId) {
        const titles = {
            dashboard: 'Dashboard',
            turnos: 'Turnos',
            pacientes: 'Pacientes',
            medicos: 'Médicos',
            usuarios: 'Usuarios',
            reportes: 'Reportes'
        };
        return titles[sectionId] || 'Dashboard';
    }

    loadDashboard() {
        const turnos = TurnosManager.getAll();
        const pacientes = PacientesManager.getAll();
        const medicos = MedicosManager.getAll();
        const usuarios = UsuariosManager.getAll();
        
        const hoy = new Date().toISOString().split('T')[0];
        const turnosHoy = turnos.filter(t => t.fecha === hoy && t.estado !== 'cancelado');

        // Stats
        const statsGrid = document.getElementById('stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="stat-content">
                        <h3>Turnos Hoy</h3>
                        <span class="stat-number">${turnosHoy.length}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-user-injured"></i></div>
                    <div class="stat-content">
                        <h3>Pacientes</h3>
                        <span class="stat-number">${pacientes.filter(p => p.activo).length}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-user-md"></i></div>
                    <div class="stat-content">
                        <h3>Médicos</h3>
                        <span class="stat-number">${medicos.filter(m => m.activo).length}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <h3>Usuarios</h3>
                        <span class="stat-number">${usuarios.filter(u => u.activo).length}</span>
                    </div>
                </div>
            `;
        }

        // Turnos recientes
        const recentAppointments = document.getElementById('recent-appointments');
        if (recentAppointments) {
            const proximos = TurnosManager.getProximosTurnos(5);
            if (proximos.length === 0) {
                recentAppointments.innerHTML = '<p class="text-muted">No hay turnos próximos</p>';
            } else {
                recentAppointments.innerHTML = proximos.map(t => {
                    const paciente = PacientesManager.getById(t.pacienteId);
                    const medico = MedicosManager.getById(t.medicoId);
                    return `
                        <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'}</strong>
                                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                    ${medico ? medico.nombre : 'N/A'} - ${t.fecha} ${t.hora}
                                </div>
                            </div>
                            <span class="badge badge-${t.estado === 'confirmado' ? 'success' : 'warning'}">${t.estado}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    loadTurnos() {
        const turnos = TurnosManager.getAll();
        const medicos = MedicosManager.getAll();
        const pacientes = PacientesManager.getAll();

        // Llenar filtros
        const medicoFilter = document.getElementById('filter-medico');
        if (medicoFilter) {
            medicoFilter.innerHTML = '<option value="">Todos</option>' +
                medicos.filter(m => m.activo).map(m => 
                    `<option value="${m.id}">${m.nombre}</option>`
                ).join('');
        }

        this.renderTurnosTable(turnos, medicos, pacientes);
    }

    renderTurnosTable(turnos, medicos, pacientes) {
        const table = document.getElementById('appointments-table');
        if (!table) return;

        if (turnos.length === 0) {
            table.innerHTML = '<p class="text-center">No hay turnos registrados</p>';
            return;
        }

        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-tertiary);">
                        <th style="padding: var(--spacing-md); text-align: left;">Fecha/Hora</th>
                        <th style="padding: var(--spacing-md); text-align: left;">Paciente</th>
                        <th style="padding: var(--spacing-md); text-align: left;">Médico</th>
                        <th style="padding: var(--spacing-md); text-align: left;">Estado</th>
                        <th style="padding: var(--spacing-md); text-align: left;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${turnos.map(t => {
                        const paciente = pacientes.find(p => p.id === t.pacienteId);
                        const medico = medicos.find(m => m.id === t.medicoId);
                        return `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: var(--spacing-md);">${t.fecha} ${t.hora}</td>
                                <td style="padding: var(--spacing-md);">${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'}</td>
                                <td style="padding: var(--spacing-md);">${medico ? medico.nombre : 'N/A'}</td>
                                <td style="padding: var(--spacing-md);">
                                    <span class="badge badge-${t.estado === 'confirmado' ? 'success' : t.estado === 'cancelado' ? 'error' : 'warning'}">${t.estado}</span>
                                </td>
                                <td style="padding: var(--spacing-md);">
                                    <button class="btn-icon" onclick="editTurno(${t.id})" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="cancelTurno(${t.id})" title="Cancelar">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    loadPacientes() {
        const pacientes = PacientesManager.getAll({ activo: true });
        const grid = document.getElementById('pacientes-grid');
        if (!grid) return;

        if (pacientes.length === 0) {
            grid.innerHTML = '<p class="text-center">No hay pacientes registrados</p>';
            return;
        }

        grid.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg);">
                ${pacientes.map(p => `
                    <div class="card">
                        <div class="card-body">
                            <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                                <div style="width: 50px; height: 50px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div>
                                    <h4 style="margin: 0;">${p.nombre} ${p.apellido}</h4>
                                    <p style="margin: 0; font-size: var(--font-size-sm); color: var(--text-secondary);">DNI: ${p.dni}</p>
                                </div>
                            </div>
                            <p style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);"><i class="fas fa-phone"></i> ${p.telefono}</p>
                            <p style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-md);"><i class="fas fa-calendar"></i> Última visita: ${p.ultimaVisita || 'Nunca'}</p>
                            <div style="display: flex; gap: var(--spacing-sm);">
                                <button class="btn-secondary btn-sm" onclick="editPaciente(${p.id})">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn-primary btn-sm" onclick="verHistorial(${p.id})">
                                    <i class="fas fa-history"></i> Historial
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadMedicos() {
        const medicos = MedicosManager.getAll({ activo: true });
        const grid = document.getElementById('medicos-grid');
        if (!grid) return;

        if (medicos.length === 0) {
            grid.innerHTML = '<p class="text-center">No hay médicos registrados</p>';
            return;
        }

        grid.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg);">
                ${medicos.map(m => `
                    <div class="card">
                        <div class="card-body">
                            <div style="display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md);">
                                <div style="width: 50px; height: 50px; background: var(--medical-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                                    <i class="fas fa-user-md"></i>
                                </div>
                                <div>
                                    <h4 style="margin: 0;">${m.nombre}</h4>
                                    <p style="margin: 0; font-size: var(--font-size-sm); color: var(--text-secondary);">${m.especialidad}</p>
                                </div>
                            </div>
                            <p style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-sm);"><i class="fas fa-id-card"></i> Matrícula: ${m.matricula}</p>
                            <p style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-md);"><i class="fas fa-clock"></i> ${m.horario}</p>
                            <button class="btn-secondary btn-sm" onclick="editMedico(${m.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadUsuarios() {
        const usuarios = UsuariosManager.getAll({ activo: true });
        const table = document.getElementById('usuarios-table');
        if (!table) return;

        if (usuarios.length === 0) {
            table.innerHTML = '<p class="text-center">No hay usuarios registrados</p>';
            return;
        }

        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg-tertiary);">
                        <th style="padding: var(--spacing-md); text-align: left;">Nombre</th>
                        <th style="padding: var(--spacing-md); text-align: left;">Email</th>
                        <th style="padding: var(--spacing-md); text-align: left;">Rol</th>
                        <th style="padding: var(--spacing-md); text-align: left;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${usuarios.map(u => `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: var(--spacing-md);">${u.nombre} ${u.apellido || ''}</td>
                            <td style="padding: var(--spacing-md);">${u.email}</td>
                            <td style="padding: var(--spacing-md);">
                                <span class="badge badge-primary">${u.rol}</span>
                            </td>
                            <td style="padding: var(--spacing-md);">
                                <button class="btn-icon" onclick="editUsuario(${u.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    loadReportes() {
        const content = document.getElementById('reports-content');
        if (!content) return;

        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const stats = TurnosManager.getEstadisticas(inicioMes, finMes);

        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg);">
                <div class="card">
                    <div class="card-body">
                        <h4>Total Turnos</h4>
                        <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--primary);">${stats.total}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h4>Confirmados</h4>
                        <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--success);">${stats.confirmados}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h4>Completados</h4>
                        <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--info);">${stats.completados}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h4>Cancelados</h4>
                        <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--error);">${stats.cancelados}</div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Botones nuevo turno
        document.getElementById('newAppointmentBtn')?.addEventListener('click', () => this.openAppointmentModal());
        document.getElementById('addAppointmentBtn2')?.addEventListener('click', () => this.openAppointmentModal());

        // Botones nuevo paciente
        document.getElementById('addPacienteBtn')?.addEventListener('click', async () => {
            if (!window.ModalManager) {
                const { ModalManager } = await import('../../components/modals.js');
                window.ModalManager = ModalManager;
            }
            await window.ModalManager.openPacienteModal();
        });

        // Botones nuevo médico
        document.getElementById('addMedicoBtn')?.addEventListener('click', async () => {
            if (!window.ModalManager) {
                const { ModalManager } = await import('../../components/modals.js');
                window.ModalManager = ModalManager;
            }
            await window.ModalManager.openMedicoModal();
        });

        // Botones nuevo usuario
        document.getElementById('addUsuarioBtn')?.addEventListener('click', async () => {
            if (!window.ModalManager) {
                const { ModalManager } = await import('../../components/modals.js');
                window.ModalManager = ModalManager;
            }
            await window.ModalManager.openUsuarioModal();
        });

        // Filtros
        document.getElementById('filter-fecha')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-medico')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-estado')?.addEventListener('change', () => this.applyFilters());
    }

    applyFilters() {
        const fecha = document.getElementById('filter-fecha')?.value;
        const medicoId = document.getElementById('filter-medico')?.value;
        const estado = document.getElementById('filter-estado')?.value;

        const filters = {};
        if (fecha) filters.fecha = fecha;
        if (medicoId) filters.medicoId = medicoId;
        if (estado) filters.estado = estado;

        const turnos = TurnosManager.getAll(filters);
        const medicos = MedicosManager.getAll();
        const pacientes = PacientesManager.getAll();
        this.renderTurnosTable(turnos, medicos, pacientes);
    }

    async openAppointmentModal() {
        if (!window.ModalManager) {
            const { ModalManager } = await import('../../components/modals.js');
            window.ModalManager = ModalManager;
        }
        await window.ModalManager.openTurnoModal();
    }
}

// Funciones globales
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

// Funciones movidas a ModalManager

window.editTurno = async function(id) {
    const turno = TurnosManager.getById(id);
    if (!turno) {
        NotificationManager.error('Turno no encontrado');
        return;
    }
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.openTurnoModal(turno);
};

window.cancelTurno = async function(id) {
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.confirm(
        'Cancelar Turno',
        '¿Estás seguro de que deseas cancelar este turno? Esta acción no se puede deshacer.',
        () => {
            const result = TurnosManager.cancel(id);
            if (result.success) {
                NotificationManager.success('Turno cancelado exitosamente');
                dashboard.loadTurnos();
                dashboard.loadDashboard();
            } else {
                NotificationManager.error(result.message || 'Error al cancelar el turno');
            }
        }
    );
};

window.editPaciente = async function(id) {
    const paciente = PacientesManager.getById(id);
    if (!paciente) {
        NotificationManager.error('Paciente no encontrado');
        return;
    }
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.openPacienteModal(paciente);
};

window.verHistorial = async function(id) {
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.openHistorialModal(id);
};

window.editMedico = async function(id) {
    const medico = MedicosManager.getById(id);
    if (!medico) {
        NotificationManager.error('Médico no encontrado');
        return;
    }
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.openMedicoModal(medico);
};

window.editUsuario = async function(id) {
    const usuario = UsuariosManager.getById(id);
    if (!usuario) {
        NotificationManager.error('Usuario no encontrado');
        return;
    }
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.openUsuarioModal(usuario);
};

// Inicializar
const dashboard = new AdminDashboard();
window.dashboard = dashboard; // Hacer disponible globalmente para recargas

