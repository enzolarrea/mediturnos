import { AuthManager } from '../../modules/auth.js';
import { TurnosManager } from '../../modules/turnos.js';
import { PacientesManager } from '../../modules/pacientes.js';
import { MedicosManager } from '../../modules/medicos.js';
import { NotificationManager } from '../../modules/notifications.js';
import { CONFIG } from '../../config.js';
import { formatDateToDMY, formatEstadoNombre } from '../../utils/formatters.js';

class PacienteDashboard {
    constructor() {
        if (!AuthManager.hasRole(CONFIG.ROLES.PACIENTE)) {
            window.location.href = '../../landing.html';
            return;
        }
        this.user = AuthManager.getCurrentUser();
        this.paciente = null;
        // Estado del calendario (mes/año actuales y caché de turnos)
        this.calendarDate = new Date();
        this.calendarData = {
            turnos: [],
            pacientes: [],
            medicos: [],
            turnosPorFecha: {}
        };
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
                    else if (sectionId === 'calendario') await this.loadCalendario();
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
                    const fechaLabel = formatDateToDMY(t.fecha);
                    return `<div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <div>
                            <strong>${fechaLabel} ${t.hora}</strong><br>
                            ${medico ? medico.nombre + ' - ' + especialidad : 'N/A'}
                        </div>
                        <div>
                            ${(() => {
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
                const fechaLabel = formatDateToDMY(t.fecha);
                return `<div class="card" style="margin-bottom: var(--spacing-md);">
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <strong>${fechaLabel} ${t.hora}</strong><br>
                                ${medico ? medico.nombre + ' - ' + especialidad : 'N/A'}
                            </div>
                            <div>
                                ${(() => {
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
                    const fechaLabel = formatDateToDMY(t.fecha);
                    return `<div class="card" style="margin-bottom: var(--spacing-md);">
                        <div class="card-body">
                            <strong>${fechaLabel} ${t.hora}</strong> - ${medico ? medico.nombre : 'N/A'}<br>
                            ${(() => {
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

    // =============================
    // CALENDARIO MENSUAL DE TURNOS
    // =============================
    async loadCalendario() {
        const container = document.getElementById('calendar-view');
        if (!container) return;

        if (!this.paciente) {
            await this.loadPacienteData();
            if (!this.paciente) {
                NotificationManager.error('No se encontró información del paciente');
                return;
            }
        }

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
            // Cargar turnos del rango de fechas filtrados por el paciente logueado
            const [turnos, pacientes, medicos] = await Promise.all([
                TurnosManager.getAll({ desde, hasta, pacienteId: this.paciente.id }),
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
                            ${estado !== 'cancelado' && estado !== 'completado' ? 
                                `<button class="btn-icon calendar-appointment-cancel" data-turno-id="${t.id}" title="Cancelar turno">
                                    <i class="fas fa-times"></i>
                                </button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

        // Click en botón de cancelar turno
        listaDiv.querySelectorAll('.calendar-appointment-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-turno-id'));
                if (!Number.isNaN(id) && typeof window.cancelarTurno === 'function') {
                    window.cancelarTurno(id);
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
    
    const paciente = await PacientesManager.getById(user.pacienteId);
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

