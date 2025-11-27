import { AuthManager } from '../../modules/auth.js';
import { TurnosManager } from '../../modules/turnos.js';
import { PacientesManager } from '../../modules/pacientes.js';
import { MedicosManager } from '../../modules/medicos.js';
import { NotificationManager } from '../../modules/notifications.js';
import { CONFIG } from '../../config.js';
import { formatDateToDMY, formatEstadoNombre } from '../../utils/formatters.js';

class MedicoDashboard {
    constructor() {
        if (!AuthManager.hasRole(CONFIG.ROLES.MEDICO)) {
            window.location.href = '../../landing.html';
            return;
        }
        this.user = AuthManager.getCurrentUser();
        this.medico = null;
        // Estado del calendario (mes/año actuales y caché de turnos)
        this.calendarDate = new Date();
        this.calendarData = {
            turnos: [],
            pacientes: [],
            medicos: [],
            turnosPorFecha: {}
        };
        this.init();
    }

    async init() {
        if (this.user && this.user.medicoId) {
            this.medico = await MedicosManager.getById(this.user.medicoId);
        }
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
                    else if (item.getAttribute('data-section') === 'calendario') this.loadCalendario();
                    else if (item.getAttribute('data-section') === 'pacientes') this.loadPacientes();
                    else if (item.getAttribute('data-section') === 'disponibilidad') this.loadDisponibilidad();
                }
            });
        });
    }

    async loadDashboard() {
        if (!this.medico) {
            NotificationManager.warning('No se encontró información del médico');
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];
        const turnosHoy = await TurnosManager.getAll({ medicoId: this.medico.id, fecha: hoy });

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
            // Resolver pacientes por ID antes de renderizar para evitar uso incorrecto de Promesas
            const pacientesPorId = {};
            turnosHoyDiv.innerHTML = turnosHoy.map(t => {
                if (t.pacienteId && !pacientesPorId[t.pacienteId]) {
                    pacientesPorId[t.pacienteId] = null;
                }
                return '';
            }).join('');

            const pacientesIds = Object.keys(pacientesPorId).map(id => parseInt(id));
            const pacientesCargados = [];
            // Cargar pacientes secuencialmente para mantener compatibilidad con la API actual
            for (const id of pacientesIds) {
                if (!Number.isNaN(id)) {
                    // eslint-disable-next-line no-await-in-loop
                    const p = await PacientesManager.getById(id);
                    if (p) pacientesCargados.push(p);
                }
            }

            pacientesCargados.forEach(p => {
                pacientesPorId[p.id] = p;
            });

            turnosHoyDiv.innerHTML = turnosHoy.map(t => {
                const paciente = pacientesPorId[t.pacienteId] || null;
                return `<div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                    <div><strong>${t.hora}</strong> - ${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'}</div>
                    <div>
                        ${(() => {
                            const estado = t.estado || t.estadoCodigo || 'pendiente';
                            let estadoClass = 'warning';
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
                            return `<span class="badge badge-${estadoClass}">${estadoNombre}</span>`;
                        })()}
                        <button class="btn-icon" onclick="cambiarEstado(${t.id})"><i class="fas fa-edit"></i></button>
                    </div>
                </div>`;
            }).join('');
        }
    }

    async loadTurnos() {
        const turnos = await TurnosManager.getAll({ medicoId: this.medico.id });
        // Resolver pacientes asociados a los turnos
        const pacientesIds = [...new Set(turnos.map(t => t.pacienteId).filter(id => id))];
        const pacientesPorId = {};
        for (const id of pacientesIds) {
            // eslint-disable-next-line no-await-in-loop
            const p = await PacientesManager.getById(id);
            if (p) pacientesPorId[p.id] = p;
        }
        const div = document.getElementById('mis-turnos');
        if (!div) return;
        
        div.innerHTML = turnos.map(t => {
            const paciente = pacientesPorId[t.pacienteId] || null;
            const fechaLabel = formatDateToDMY(t.fecha);
            return `<div class="card" style="margin-bottom: var(--spacing-md);">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between;">
                        <div>
                            <strong>${fechaLabel} ${t.hora}</strong><br>
                            ${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'}
                        </div>
                        <div>
                            ${(() => {
                                const estado = t.estado || t.estadoCodigo || 'pendiente';
                                let estadoClass = 'warning';
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
                                return `<span class="badge badge-${estadoClass}">${estadoNombre}</span>`;
                            })()}
                            <button class="btn-icon" onclick="cambiarEstado(${t.id})"><i class="fas fa-edit"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    async loadPacientes() {
        const turnos = await TurnosManager.getAll({ medicoId: this.medico.id });
        const pacientesIds = [...new Set(turnos.map(t => t.pacienteId))];
        const pacientes = [];
        for (const id of pacientesIds) {
            const p = await PacientesManager.getById(id);
            if (p) pacientes.push(p);
        }
        
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

    // =============================
    // CALENDARIO MENSUAL DE TURNOS
    // =============================
    async loadCalendario() {
        const container = document.getElementById('calendar-view');
        if (!container || !this.medico) return;

        // Normalizar fecha de referencia al primer día del mes
        const current = this.calendarDate instanceof Date ? this.calendarDate : new Date();
        const year = current.getFullYear();
        const month = current.getMonth(); // 0-11
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const toISO = (d) => d.toISOString().split('T')[0];
        const desde = toISO(firstDay);
        const hasta = toISO(lastDay);

        try {
            // Cargar turnos del rango de fechas filtrados por el médico logueado
            const [turnos, pacientes, medicos] = await Promise.all([
                TurnosManager.getAll({ desde, hasta, medicoId: this.medico.id }),
                PacientesManager.getAll({ activo: true }),
                MedicosManager.getAll({ activo: true })
            ]);

            // Agrupar turnos por fecha (YYYY-MM-DD)
            const turnosPorFecha = {};
            turnos.forEach(t => {
                const fecha = t.fecha;
                if (!turnosPorFecha[fecha]) turnosPorFecha[fecha] = [];
                turnosPorFecha[fecha].push(t);
            });

            this.calendarData = {
                turnos,
                pacientes,
                medicos,
                turnosPorFecha
            };

            this.renderCalendarMonth(container, year, month);
        } catch (error) {
            console.error('Error al cargar calendario de turnos:', error);
            NotificationManager.error('Error al cargar el calendario de turnos');
        }
    }

    renderCalendarMonth(container, year, month) {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstWeekDay = (firstDay.getDay() || 7); // 1-7 (Lun=1)
        const daysInMonth = lastDay.getDate();

        const today = new Date();
        const todayISO = today.toISOString().split('T')[0];

        // Construir celdas del calendario
        const cells = [];
        // Celdas vacías antes del día 1
        for (let i = 1; i < firstWeekDay; i++) {
            cells.push({ empty: true });
        }
        // Celdas de días reales
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const iso = dateObj.toISOString().split('T')[0];
            const turnosDelDia = this.calendarData.turnosPorFecha[iso] || [];
            cells.push({
                empty: false,
                day,
                iso,
                turnosCount: turnosDelDia.length,
                hasTurnos: turnosDelDia.length > 0,
                isToday: iso === todayISO
            });
        }

        const monthLabel = `${monthNames[month]} ${year}`;

        container.innerHTML = `
            <div class="calendar-container card">
                <div class="card-header calendar-header">
                    <div class="calendar-header-left">
                        <h3>${monthLabel}</h3>
                        <p class="calendar-subtitle">Seleccioná un día para ver los turnos</p>
                    </div>
                    <div class="calendar-header-right">
                        <button class="btn-icon calendar-nav-btn" data-cal-action="prev"><i class="fas fa-chevron-left"></i></button>
                        <button class="btn-secondary calendar-nav-today" data-cal-action="today">Hoy</button>
                        <button class="btn-icon calendar-nav-btn" data-cal-action="next"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="card-body calendar-body">
                    <div class="calendar-main">
                        <div class="calendar-weekdays">
                            ${weekDays.map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
                        </div>
                        <div class="calendar-grid">
                            ${cells.map(cell => {
                                if (cell.empty) {
                                    return '<div class="calendar-day calendar-day--empty"></div>';
                                }
                                const classes = [
                                    'calendar-day',
                                    cell.isToday ? 'calendar-day--today' : '',
                                    cell.hasTurnos ? 'calendar-day--has-turnos' : ''
                                ].filter(Boolean).join(' ');
                                const badge = cell.hasTurnos
                                    ? `<span class="calendar-day-badge">${cell.turnosCount}</span>`
                                    : '';
                                return `<button class="${classes}" data-date="${cell.iso}">
                                    <span class="calendar-day-number">${cell.day}</span>
                                    ${badge}
                                </button>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="calendar-sidebar">
                        <div class="calendar-sidebar-header">
                            <h4 id="calendar-selected-date-title">Seleccioná un día</h4>
                            <p class="calendar-sidebar-subtitle" id="calendar-selected-date-subtitle">Los turnos aparecerán aquí</p>
                        </div>
                        <div id="calendar-day-appointments" class="calendar-day-appointments">
                            <p class="text-muted text-center">No hay día seleccionado</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eventos de navegación
        container.querySelectorAll('[data-cal-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-cal-action');
                if (action === 'prev') {
                    this.calendarDate = new Date(year, month - 1, 1);
                } else if (action === 'next') {
                    this.calendarDate = new Date(year, month + 1, 1);
                } else if (action === 'today') {
                    this.calendarDate = new Date();
                }
                this.loadCalendario();
            });
        });

        // Eventos para seleccionar días
        container.querySelectorAll('.calendar-day[data-date]').forEach(btn => {
            btn.addEventListener('click', () => {
                const date = btn.getAttribute('data-date');
                container.querySelectorAll('.calendar-day--selected').forEach(d => d.classList.remove('calendar-day--selected'));
                btn.classList.add('calendar-day--selected');
                this.renderDayAppointments(date);
            });
        });
    }

    renderDayAppointments(dateISO) {
        const listaDiv = document.getElementById('calendar-day-appointments');
        const titleEl = document.getElementById('calendar-selected-date-title');
        const subtitleEl = document.getElementById('calendar-selected-date-subtitle');
        if (!listaDiv || !titleEl || !subtitleEl) return;

        const turnosDelDia = this.calendarData.turnosPorFecha[dateISO] || [];
        const fechaObj = new Date(dateISO);
        const weekdayLabel = fechaObj.toLocaleDateString('es-AR', { weekday: 'long' });
        const fechaLabel = formatDateToDMY(dateISO);

        // Ejemplo: "miércoles 26-11-2025"
        const titulo = `${weekdayLabel} ${fechaLabel}`.trim();
        titleEl.textContent = titulo.charAt(0).toUpperCase() + titulo.slice(1);

        if (turnosDelDia.length === 0) {
            subtitleEl.textContent = 'No hay turnos para este día';
            listaDiv.innerHTML = '<p class="text-center text-muted" style="padding: var(--spacing-lg);">No hay turnos registrados en esta fecha.</p>';
            return;
        }

        subtitleEl.textContent = `${turnosDelDia.length} turno${turnosDelDia.length > 1 ? 's' : ''} en esta fecha`;

        const { pacientes, medicos } = this.calendarData;

        listaDiv.innerHTML = turnosDelDia
            .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
            .map(t => {
                const paciente = pacientes.find(p => p.id === t.pacienteId || p.id === parseInt(t.pacienteId));
                const medico = medicos.find(m => m.id === t.medicoId || m.id === parseInt(t.medicoId));
                const estado = t.estado || t.estadoCodigo || CONFIG.TURNO_ESTADOS?.PENDIENTE || 'pendiente';
                let estadoClass = 'warning'; // default para pendiente
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

                const pacienteLabel = paciente
                    ? `${paciente.nombre} ${paciente.apellido}`
                    : 'Paciente no encontrado';
                const medicoLabel = medico
                    ? medico.nombre
                    : 'Médico no encontrado';

                return `
                    <div class="calendar-appointment-card" data-turno-id="${t.id}">
                        <div class="calendar-appointment-main">
                            <div class="calendar-appointment-time">
                                <i class="fas fa-clock"></i>
                                <span>${t.hora || '--:--'}</span>
                            </div>
                            <div class="calendar-appointment-info">
                                <div class="calendar-appointment-paciente">${pacienteLabel}</div>
                                <div class="calendar-appointment-medico">${medicoLabel}</div>
                                ${t.motivo ? `<div class="calendar-appointment-motivo">${t.motivo}</div>` : ''}
                            </div>
                        </div>
                        <div class="calendar-appointment-meta">
                            <span class="badge badge-${estadoClass}">${estadoNombre}</span>
                            <button class="btn-icon calendar-appointment-edit" data-turno-id="${t.id}" title="Ver / Editar turno">
                                <i class="fas fa-pen"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

        // Click en tarjeta de turno para ver / editar usando la lógica existente
        listaDiv.querySelectorAll('.calendar-appointment-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-turno-id'));
                if (!Number.isNaN(id) && typeof window.cambiarEstado === 'function') {
                    window.cambiarEstado(id);
                }
            });
        });
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
    
    const medico = await MedicosManager.getById(user.medicoId);
    if (!medico) {
        NotificationManager.error('Médico no encontrado');
        return;
    }
    
    await ModalManager.openMedicoModal(medico);
};

const medicoDashboard = new MedicoDashboard();
window.dashboard = medicoDashboard; // Hacer disponible globalmente

