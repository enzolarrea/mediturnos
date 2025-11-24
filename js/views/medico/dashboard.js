import { AuthManager } from '../../modules/auth.js';
import { TurnosManager } from '../../modules/turnos.js';
import { PacientesManager } from '../../modules/pacientes.js';
import { MedicosManager } from '../../modules/medicos.js';
import { NotificationManager } from '../../modules/notifications.js';
import { CONFIG } from '../../config.js';

class MedicoDashboard {
    constructor() {
        if (!AuthManager.hasRole(CONFIG.ROLES.MEDICO)) {
            window.location.href = '../../landing.html';
            return;
        }
        this.user = AuthManager.getCurrentUser();
        this.medico = this.user.medicoId ? MedicosManager.getById(this.user.medicoId) : null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.loadDashboard();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                item.classList.add('active');
                const section = document.getElementById(item.getAttribute('data-section'));
                if (section) {
                    section.classList.add('active');
                    if (item.getAttribute('data-section') === 'dashboard') this.loadDashboard();
                    else if (item.getAttribute('data-section') === 'turnos') this.loadTurnos();
                    else if (item.getAttribute('data-section') === 'pacientes') this.loadPacientes();
                    else if (item.getAttribute('data-section') === 'disponibilidad') this.loadDisponibilidad();
                }
            });
        });
    }

    loadDashboard() {
        if (!this.medico) {
            NotificationManager.warning('No se encontró información del médico');
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];
        const turnosHoy = TurnosManager.getAll({ medicoId: this.medico.id, fecha: hoy });

        document.getElementById('stats-grid').innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-content">
                    <h3>Turnos Hoy</h3>
                    <span class="stat-number">${turnosHoy.length}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-user-md"></i></div>
                <div class="stat-content">
                    <h3>${this.medico.especialidad}</h3>
                    <span class="stat-number">${this.medico.nombre}</span>
                </div>
            </div>
        `;

        const turnosHoyDiv = document.getElementById('turnos-hoy');
        if (turnosHoy.length === 0) {
            turnosHoyDiv.innerHTML = '<p class="text-center">No hay turnos programados para hoy</p>';
        } else {
            turnosHoyDiv.innerHTML = turnosHoy.map(t => {
                const paciente = PacientesManager.getById(t.pacienteId);
                return `<div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                    <div><strong>${t.hora}</strong> - ${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'}</div>
                    <div>
                        <span class="badge badge-${t.estado === 'confirmado' ? 'success' : 'warning'}">${t.estado}</span>
                        <button class="btn-icon" onclick="cambiarEstado(${t.id})"><i class="fas fa-edit"></i></button>
                    </div>
                </div>`;
            }).join('');
        }
    }

    loadTurnos() {
        const turnos = TurnosManager.getAll({ medicoId: this.medico.id });
        const div = document.getElementById('mis-turnos');
        if (!div) return;
        
        div.innerHTML = turnos.map(t => {
            const paciente = PacientesManager.getById(t.pacienteId);
            return `<div class="card" style="margin-bottom: var(--spacing-md);">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <strong>${t.fecha} ${t.hora}</strong><br>
                            ${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'}
                        </div>
                        <div>
                            <span class="badge badge-${t.estado === 'confirmado' ? 'success' : 'warning'}">${t.estado}</span>
                            <button class="btn-icon" onclick="cambiarEstado(${t.id})"><i class="fas fa-edit"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    loadPacientes() {
        const turnos = TurnosManager.getAll({ medicoId: this.medico.id });
        const pacientesIds = [...new Set(turnos.map(t => t.pacienteId))];
        const pacientes = pacientesIds.map(id => PacientesManager.getById(id)).filter(p => p);
        
        const list = document.getElementById('pacientes-list');
        if (!list) return;
        
        list.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg);">
            ${pacientes.map(p => `
                <div class="card">
                    <div class="card-body">
                        <h4>${p.nombre} ${p.apellido}</h4>
                        <p>DNI: ${p.dni}</p>
                        <button class="btn-primary btn-sm" onclick="verHistorial(${p.id})">
                            <i class="fas fa-history"></i> Ver Historial
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    }

    loadDisponibilidad() {
        const content = document.getElementById('disponibilidad-content');
        if (!content || !this.medico) return;
        
        content.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h4>Horario Actual</h4>
                    <p>${this.medico.horario}</p>
                    <h4>Especialidad</h4>
                    <p>${this.medico.especialidad}</p>
                    <button class="btn-primary" onclick="editarDisponibilidad()">
                        <i class="fas fa-edit"></i> Editar Disponibilidad
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

window.cambiarEstado = async function(id) {
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.openEstadoTurnoModal(id);
};

window.verHistorial = async function(id) {
    const { ModalManager } = await import('../../components/modals.js');
    await ModalManager.openHistorialModal(id);
};

window.editarDisponibilidad = async function() {
    const { ModalManager } = await import('../../components/modals.js');
    const { MedicosManager } = await import('../../modules/medicos.js');
    
    const user = AuthManager.getCurrentUser();
    if (!user || !user.medicoId) {
        NotificationManager.error('No se encontró información del médico');
        return;
    }
    
    const medico = MedicosManager.getById(user.medicoId);
    if (!medico) {
        NotificationManager.error('Médico no encontrado');
        return;
    }
    
    await ModalManager.openMedicoModal(medico);
};

const medicoDashboard = new MedicoDashboard();
window.dashboard = medicoDashboard; // Hacer disponible globalmente

