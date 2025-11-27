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
import { formatDateToDMY, formatEstadoNombre } from '../../utils/formatters.js';

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

    async loadDashboard() {
        const turnos = await TurnosManager.getAll();
        const pacientes = await PacientesManager.getAll();
        const medicos = await MedicosManager.getAll();
        const usuarios = await UsuariosManager.getAll();
        
        // Contar turnos por estado desde la base de datos
        const totalTurnos = turnos.length;
        const turnosConfirmados = turnos.filter(t => t.estado === 'confirmado' || t.estadoCodigo === 'confirmado').length;
        const turnosCompletados = turnos.filter(t => t.estado === 'completado' || t.estadoCodigo === 'completado').length;
        const turnosPendientes = turnos.filter(t => t.estado === 'pendiente' || t.estadoCodigo === 'pendiente').length;

        // Stats - Mostrar estadísticas dinámicas de turnos
        const statsGrid = document.getElementById('stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-content">
                        <h3>Total de Turnos</h3>
                        <span class="stat-number">${totalTurnos}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="stat-content">
                        <h3>Turnos Confirmados</h3>
                        <span class="stat-number">${turnosConfirmados}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content">
                        <h3>Turnos Completados</h3>
                        <span class="stat-number">${turnosCompletados}</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-content">
                        <h3>Turnos Pendientes</h3>
                        <span class="stat-number">${turnosPendientes}</span>
                    </div>
                </div>
            `;
        }

        // Turnos recientes
        const recentAppointments = document.getElementById('recent-appointments');
        if (recentAppointments) {
            const proximos = await TurnosManager.getProximosTurnos(5);
            if (proximos.length === 0) {
                recentAppointments.innerHTML = '<p class="text-muted">No hay turnos próximos</p>';
            } else {
                // Resolver datos relacionados usando los arrays ya cargados para evitar Promesas y undefined
                recentAppointments.innerHTML = proximos.map(t => {
                    const paciente = pacientes.find(p => p.id === t.pacienteId || p.id === parseInt(t.pacienteId));
                    const medico = medicos.find(m => m.id === t.medicoId || m.id === parseInt(t.medicoId));

                    const pacienteNombre = paciente
                        ? `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim() || '—'
                        : '—';
                    const medicoNombre = medico
                        ? (medico.nombre || '—')
                        : '—';
                    const fechaLabel = formatDateToDMY(t.fecha);
                    const fechaHora = `${fechaLabel} ${t.hora || ''}`.trim();

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

                    return `
                        <div style="padding: var(--spacing-md); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${pacienteNombre}</strong>
                                <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                    ${medicoNombre} - ${fechaHora || '—'}
                                </div>
                            </div>
                            <span class="badge badge-${estadoClass}">${estadoNombre}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    async loadTurnos() {
        const turnos = await TurnosManager.getAll();
        const medicos = await MedicosManager.getAll();
        const pacientes = await PacientesManager.getAll();

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
                        const fechaLabel = formatDateToDMY(t.fecha);
                        return `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: var(--spacing-md);">${fechaLabel} ${t.hora}</td>
                                <td style="padding: var(--spacing-md);">${paciente ? paciente.nombre + ' ' + paciente.apellido : 'N/A'}</td>
                                <td style="padding: var(--spacing-md);">${medico ? medico.nombre : 'N/A'}</td>
                                <td style="padding: var(--spacing-md);">
                                    ${(() => {
                                        const estado = t.estado || t.estadoCodigo || 'pendiente';
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
                                        return `<span class="badge badge-${estadoClass}">${estadoNombre}</span>`;
                                    })()}
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

    async loadPacientes() {
        const pacientes = await PacientesManager.getAll({ activo: true });
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

    async loadMedicos() {
        const medicos = await MedicosManager.getAll({ activo: true });
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

    async loadUsuarios() {
        const usuarios = await UsuariosManager.getAll({ activo: true });
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

    async loadReportes() {
        // Obtener todos los turnos desde la base de datos
        const turnos = await TurnosManager.getAll();
        
        // Fechas para filtros
        const hoy = new Date();
        const hoyStr = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
        
        // Nombres de meses en español
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const nombreMes = meses[hoy.getMonth()];
        
        // Función helper para contar turnos por estado
        const contarPorEstado = (turnosArray) => {
            return {
                total: turnosArray.length,
                confirmados: turnosArray.filter(t => t.estado === 'confirmado' || t.estadoCodigo === 'confirmado').length,
                completados: turnosArray.filter(t => t.estado === 'completado' || t.estadoCodigo === 'completado').length,
                cancelados: turnosArray.filter(t => t.estado === 'cancelado' || t.estadoCodigo === 'cancelado').length
            };
        };
        
        // 1. REPORTE TOTALES - Todos los turnos
        const statsTotales = contarPorEstado(turnos);
        const contentTotales = document.getElementById('reports-totales');
        if (contentTotales) {
            contentTotales.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg);">
                    <div class="card">
                        <div class="card-body">
                            <h4>Total de Turnos</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--primary);">${statsTotales.total}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Total Confirmados</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--success);">${statsTotales.confirmados}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Total de Completados</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: rgb(118, 32, 180);">${statsTotales.completados}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Total de Cancelados</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--error);">${statsTotales.cancelados}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 2. REPORTE MENSUALES - Turnos del mes actual
        const turnosMensuales = turnos.filter(t => {
            const fechaTurno = t.fecha;
            return fechaTurno >= inicioMes && fechaTurno <= finMes;
        });
        const statsMensuales = contarPorEstado(turnosMensuales);
        
        // Actualizar título dinámico del mes
        const titleMensuales = document.getElementById('reports-mensuales-title');
        if (titleMensuales) {
            titleMensuales.innerHTML = `Turnos Mensuales <span style="color: var(--primary);">${nombreMes}</span>`;
        }
        
        const contentMensuales = document.getElementById('reports-mensuales');
        if (contentMensuales) {
            contentMensuales.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg);">
                    <div class="card">
                        <div class="card-body">
                            <h4>Total del Mes</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--primary);">${statsMensuales.total}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Confirmados del Mes</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--success);">${statsMensuales.confirmados}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Completados del Mes</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: rgb(118, 32, 180);">${statsMensuales.completados}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Cancelados del Mes</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--error);">${statsMensuales.cancelados}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 3. REPORTE DIARIAS - Turnos del día actual
        const turnosDiarias = turnos.filter(t => t.fecha === hoyStr);
        const statsDiarias = contarPorEstado(turnosDiarias);
        
        const contentDiarias = document.getElementById('reports-diarias');
        if (contentDiarias) {
            contentDiarias.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg);">
                    <div class="card">
                        <div class="card-body">
                            <h4>Total del Día</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--primary);">${statsDiarias.total}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Confirmados del Día</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--success);">${statsDiarias.confirmados}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Completados del Día</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: rgb(118, 32, 180);">${statsDiarias.completados}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Cancelados del Día</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--error);">${statsDiarias.cancelados}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // ============================================
        // REPORTES DE USUARIOS REGISTRADOS
        // ============================================
        
        // Obtener todos los usuarios desde la base de datos
        const usuarios = await UsuariosManager.getAll();
        
        // Función helper para contar usuarios por fecha
        const contarUsuariosPorFecha = (usuariosArray, fechaInicio = null, fechaFin = null) => {
            let usuariosFiltrados = usuariosArray;
            
            if (fechaInicio && fechaFin) {
                usuariosFiltrados = usuariosArray.filter(u => {
                    if (!u.fechaCreacion) return false;
                    // Extraer solo la fecha (YYYY-MM-DD) del timestamp
                    const fechaCreacion = u.fechaCreacion.split(' ')[0].split('T')[0];
                    return fechaCreacion >= fechaInicio && fechaCreacion <= fechaFin;
                });
            } else if (fechaInicio) {
                usuariosFiltrados = usuariosArray.filter(u => {
                    if (!u.fechaCreacion) return false;
                    // Extraer solo la fecha (YYYY-MM-DD) del timestamp
                    const fechaCreacion = u.fechaCreacion.split(' ')[0].split('T')[0];
                    return fechaCreacion === fechaInicio;
                });
            }
            
            return usuariosFiltrados.length;
        };
        
        // 1. REPORTE USUARIOS TOTALES - Todos los usuarios
        const usuariosTotales = usuarios.length;
        const contentUsuariosTotales = document.getElementById('reports-usuarios-totales');

        // 2. REPORTE USUARIOS MENSUALES - Usuarios del mes actual
        const usuariosMensuales = contarUsuariosPorFecha(usuarios, inicioMes, finMes);
        const contentUsuariosMensuales = document.getElementById('reports-usuarios-mensuales');

        // 3. REPORTE USUARIOS DIARIAS - Usuarios del día actual
        const usuariosDiarias = contarUsuariosPorFecha(usuarios, hoyStr);
        const contentUsuariosDiarias = document.getElementById('reports-usuarios-diarias');

        if (contentUsuariosTotales, contentUsuariosMensuales, contentUsuariosDiarias) {
            contentUsuariosTotales.innerHTML, contentUsuariosMensuales.innerHTML, contentUsuariosDiarias.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg);">
                    <div class="card">
                        <div class="card-body">
                            <h4>Usuarios Totales</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--primary);">${usuariosTotales}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Usuarios del Mes <span style="color: var(--primary);">${nombreMes}</span></h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--primary);">${usuariosMensuales}</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <h4>Usuarios del Día</h4>
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--primary);">${usuariosDiarias}</div>
                        </div>
                    </div>
                </div>
            `;
        }
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

    async applyFilters() {
        const fecha = document.getElementById('filter-fecha')?.value;
        const medicoId = document.getElementById('filter-medico')?.value;
        const estado = document.getElementById('filter-estado')?.value;

        const filters = {};
        if (fecha) filters.fecha = fecha;
        if (medicoId) filters.medicoId = medicoId;
        if (estado) filters.estado = estado;

        const turnos = await TurnosManager.getAll(filters);
        const medicos = await MedicosManager.getAll();
        const pacientes = await PacientesManager.getAll();
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
        '¿Estás seguro de que deseas cancelar este turno? Esta acción no se puede deshacer.',
        async () => {
            const result = await TurnosManager.cancel(id);
            if (result && result.success) {
                NotificationManager.success('Turno cancelado exitosamente');
                await dashboard.loadTurnos();
                await dashboard.loadDashboard();
            } else {
                NotificationManager.error(result?.message || 'Error al cancelar el turno');
            }
        }
    );
};

window.editPaciente = async function(id) {
    const paciente = await PacientesManager.getById(id);
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
    const medico = await MedicosManager.getById(id);
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
    const usuario = await UsuariosManager.getById(id);
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

