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
        this.medico = null; // Se cargará asíncronamente cuando sea necesario
        this.init();
    }

    async init() {
        this.setupNavigation();
        await this.loadDashboard();
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

    async loadDashboard() {
        // Cargar médico desde la API si no está cargado
        if (!this.medico && this.user && this.user.medicoId) {
            try {
                this.medico = await MedicosManager.getById(this.user.medicoId);
            } catch (error) {
                console.error('Error al cargar médico en dashboard:', error);
            }
        }
        
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

    async loadDisponibilidad() {
        const content = document.getElementById('disponibilidad-content');
        if (!content) return;
        
        // Mostrar loading mientras se cargan los datos
        content.innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align: center; padding: var(--spacing-xl);">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
                    <p style="margin-top: var(--spacing-md);">Cargando información...</p>
                </div>
            </div>
        `;
        
        // Obtener usuario actual desde la API si no está disponible
        if (!this.user || !this.user.medicoId) {
            const { ApiClient } = await import('../../modules/api.js');
            try {
                this.user = await ApiClient.getCurrentUser();
                if (!this.user) {
                    // Fallback a localStorage
                    this.user = AuthManager.getCurrentUser();
                }
            } catch (error) {
                console.error('Error al obtener usuario desde API:', error);
                // Fallback a localStorage
                this.user = AuthManager.getCurrentUser();
            }
        }
        
        // Recargar datos del médico desde la API para asegurar datos actualizados
        if (this.user && this.user.medicoId) {
            try {
                const medicoActualizado = await MedicosManager.getById(this.user.medicoId);
                if (medicoActualizado) {
                    this.medico = medicoActualizado;
                }
            } catch (error) {
                console.error('Error al cargar médico:', error);
            }
        }
        
        if (!this.medico) {
            content.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <p class="text-error">No se pudo cargar la información del médico</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Formatear especialidad
        const especialidad = this.medico.especialidad || 
                           (this.medico.especialidades 
                               ? (Array.isArray(this.medico.especialidades) 
                                   ? this.medico.especialidades.join(', ')
                                   : this.medico.especialidades)
                               : 'No especificada');
        
        content.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h4>Información Profesional y Disponibilidad</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                        <div>
                            <p><strong>Nombre:</strong> ${this.medico.nombre || 'N/A'}</p>
                            <p><strong>Especialidad:</strong> ${especialidad || 'N/A'}</p>
                            <p><strong>Matrícula:</strong> ${this.medico.matricula || 'N/A'}</p>
                        </div>
                        <div>
                            <p><strong>Horario:</strong> ${this.medico.horario || 'No especificado'}</p>
                            ${this.medico.telefono ? `<p><strong>Teléfono:</strong> ${this.medico.telefono}</p>` : ''}
                            ${this.medico.email ? `<p><strong>Email:</strong> ${this.medico.email}</p>` : ''}
                        </div>
                    </div>
                    <button class="btn-primary" onclick="editarDisponibilidad()">
                        <i class="fas fa-edit"></i> Editar Información
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
    const { ApiClient } = await import('../../modules/api.js');
    
    // Obtener usuario actual desde la API para asegurar datos actualizados
    let user = null;
    try {
        user = await ApiClient.getCurrentUser();
        if (!user) {
            // Fallback a localStorage
            user = AuthManager.getCurrentUser();
        }
    } catch (error) {
        console.error('Error al obtener usuario desde API:', error);
        // Fallback a localStorage
        user = AuthManager.getCurrentUser();
    }
    
    console.log('Usuario obtenido:', user);
    console.log('Tipo de usuario:', typeof user);
    console.log('medicoId del usuario:', user?.medicoId);
    console.log('Tipo de medicoId:', typeof user?.medicoId);
    
    if (!user) {
        NotificationManager.error('No se encontró información del usuario. Por favor, inicie sesión nuevamente.');
        console.error('Usuario es null o undefined');
        return;
    }
    
    // Convertir medicoId a número si es necesario
    const medicoId = user.medicoId ? parseInt(user.medicoId) : null;
    
    if (!medicoId || isNaN(medicoId)) {
        NotificationManager.error('No se encontró información del médico. Por favor, inicie sesión nuevamente.');
        console.error('Usuario sin medicoId válido:', user);
        return;
    }
    
    // Abrir modal pasando solo el medicoId - el modal cargará los datos desde la API
    console.log('Abriendo modal con medicoId:', medicoId, '(tipo:', typeof medicoId, ')');
    await ModalManager.openMedicoModal(null, medicoId);
};

const medicoDashboard = new MedicoDashboard();
window.dashboard = medicoDashboard; // Hacer disponible globalmente

