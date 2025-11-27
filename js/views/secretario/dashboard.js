import { AuthManager } from '../../modules/auth.js';
import { TurnosManager } from '../../modules/turnos.js';
import { PacientesManager } from '../../modules/pacientes.js';
import { MedicosManager } from '../../modules/medicos.js';
import { NotificationManager } from '../../modules/notifications.js';
import { CONFIG } from '../../config.js';
import { formatDateToDMY, formatEstadoNombre } from '../../utils/formatters.js';

class SecretarioDashboard {
    constructor() {
        if (!AuthManager.hasRole(CONFIG.ROLES.SECRETARIO)) {
            window.location.href = '../../landing.html';
            return;
        }
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

    init() {
        this.setupNavigation();
        this.loadDashboard();
        document.getElementById('newAppointmentBtn')?.addEventListener('click', () => this.openAppointmentModal());
        document.getElementById('addAppointmentBtn2')?.addEventListener('click', () => this.openAppointmentModal());
        document.getElementById('addPacienteBtn')?.addEventListener('click', async () => {
            if (!window.ModalManager) {
                const { ModalManager } = await import('../../components/modals.js');
                window.ModalManager = ModalManager;
            }
            await window.ModalManager.openPacienteModal();
        });
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
                    const sectionId = item.getAttribute('data-section');
                    if (sectionId === 'dashboard') this.loadDashboard();
                    else if (sectionId === 'turnos') this.loadTurnos();
                    else if (sectionId === 'pacientes') this.loadPacientes();
                    else if (sectionId === 'calendario') this.loadCalendario();
                }
            });
        });
    }

    async loadDashboard() {
        const hoy = new Date().toISOString().split('T')[0];
        const turnosHoy = await TurnosManager.getTurnosDelDia(hoy);
        // Cargar listas completas para poder resolver nombres sin llamadas async dentro del render
        const [pacientes, medicos] = await Promise.all([
            PacientesManager.getAll({ activo: true }),
            MedicosManager.getAll({ activo: true })
        ]);

        document.getElementById('stats-grid').innerHTML = `
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
                    <span class="stat-number">${pacientes.length}</span>
                </div>
            </div>
        `;

        const turnosHoyDiv = document.getElementById('turnos-hoy');
        if (turnosHoy.length === 0) {
            turnosHoyDiv.innerHTML = '<p class="text-center">No hay turnos programados para hoy</p>';
        } else {
            turnosHoyDiv.innerHTML = turnosHoy.map(t => {
                const paciente = pacientes.find(p => p.id === t.pacienteId || p.id === parseInt(t.pacienteId));
                const medico = medicos.find(m => m.id === t.medicoId || m.id === parseInt(t.medicoId));
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
                return `<div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                    <div><strong>${t.hora}</strong> - ${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'} - ${medico ? medico.nombre : 'N/A'}</div>
                    <span class="badge badge-${estadoClass}">${estadoNombre}</span>
                </div>`;
            }).join('');
        }
    }

    async loadTurnos() {
        const [turnos, pacientes, medicos] = await Promise.all([
            TurnosManager.getAll(),
            PacientesManager.getAll({ activo: true }),
            MedicosManager.getAll({ activo: true })
        ]);
        const table = document.getElementById('turnos-table');
        if (!table) return;
        
        if (turnos.length === 0) {
            table.innerHTML = '<p class="text-center">No hay turnos</p>';
            return;
        }

        table.innerHTML = turnos.map(t => {
            const paciente = pacientes.find(p => p.id === t.pacienteId || p.id === parseInt(t.pacienteId));
            const medico = medicos.find(m => m.id === t.medicoId || m.id === parseInt(t.medicoId));
            const fechaLabel = formatDateToDMY(t.fecha);
            return `<div class="card" style="margin-bottom: var(--spacing-md);">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${fechaLabel} ${t.hora}</strong><br>
                            ${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'} - ${medico ? medico.nombre : 'N/A'}
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
                            <button class="btn-icon" onclick="editTurno(${t.id})"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon" onclick="cancelTurno(${t.id})"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    async loadPacientes() {
        const pacientes = await PacientesManager.getAll({ activo: true });
        const list = document.getElementById('pacientes-list');
        if (!list) return;
        
        list.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg);">
            ${pacientes.map(p => `
                <div class="card">
                    <div class="card-body">
                        <h4>${p.nombre} ${p.apellido}</h4>
                        <p>DNI: ${p.dni}</p>
                        <p>Tel: ${p.telefono}</p>
                        <button class="btn-primary btn-sm" onclick="nuevoTurnoPaciente(${p.id})">
                            <i class="fas fa-calendar-plus"></i> Nuevo Turno
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    }

    // =============================
    // CALENDARIO MENSUAL DE TURNOS
    // =============================
    async loadCalendario() {
        const container = document.getElementById('calendar-view');
        if (!container) return;

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
            // Cargar turnos del rango de fechas y datos relacionados
            const [turnos, pacientes, medicos] = await Promise.all([
                TurnosManager.getAll({ desde, hasta }),
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
                if (!Number.isNaN(id) && typeof window.editTurno === 'function') {
                    window.editTurno(id);
                }
            });
        });
    }

    async openAppointmentModal() {
        // Asegurar que ModalManager esté disponible
        if (!window.ModalManager) {
            const { ModalManager } = await import('../../components/modals.js');
            window.ModalManager = ModalManager;
        }
        await window.ModalManager.openTurnoModal();
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

window.editTurno = async function(id) {
    const turno = await TurnosManager.getById(id);
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
        '¿Estás seguro de que deseas cancelar este turno?',
        async () => {
            const result = await TurnosManager.cancel(id);
            if (result && result.success) {
                NotificationManager.success('Turno cancelado exitosamente');
                if (window.dashboard) {
                    await window.dashboard.loadTurnos();
                    await window.dashboard.loadDashboard();
                } else {
                    const d = new SecretarioDashboard();
                    await d.loadTurnos();
                }
            } else {
                NotificationManager.error(result?.message || 'Error al cancelar el turno');
            }
        }
    );
};

window.nuevoTurnoPaciente = async function(id) {
    if (!window.ModalManager) {
        const { ModalManager } = await import('../../components/modals.js');
        window.ModalManager = ModalManager;
    }
    await window.ModalManager.openTurnoModal(null, id);
};

const secretarioDashboard = new SecretarioDashboard();
window.dashboard = secretarioDashboard; // Hacer disponible globalmente

