// Gestor de Turnos Médicos - Script Principal
// Este archivo contiene toda la lógica JavaScript para la aplicación

class MedicalAppointmentManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.appointments = [];
        this.patients = [];
        this.doctors = [];
        this.schedules = {};
        this.stats = {};
        
        this.init();
    }

    // Inicialización de la aplicación
    init() {
        try {
            this.loadData();
            this.loadInitialData();
            this.setupEventListeners();
            this.updateDashboard();
            console.log('Gestor de Turnos Médicos inicializado correctamente');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.showNotification('Error al inicializar la aplicación', 'error');
        }
    }

    // Cargar datos desde localStorage
    loadData() {
        try {
            this.appointments = JSON.parse(localStorage.getItem('medicalAppointments') || '[]');
            this.patients = JSON.parse(localStorage.getItem('medicalPatients') || '[]');
            this.doctors = JSON.parse(localStorage.getItem('medicalDoctors') || '[]');
            this.schedules = JSON.parse(localStorage.getItem('medicalSchedules') || '{}');
            this.stats = JSON.parse(localStorage.getItem('medicalStats') || '{}');
        } catch (error) {
            console.error('Error al cargar datos:', error);
            this.appointments = [];
            this.patients = [];
            this.doctors = [];
            this.schedules = {};
            this.stats = {};
        }
    }

    // Guardar datos en localStorage
    saveData() {
        try {
            localStorage.setItem('medicalAppointments', JSON.stringify(this.appointments));
            localStorage.setItem('medicalPatients', JSON.stringify(this.patients));
            localStorage.setItem('medicalDoctors', JSON.stringify(this.doctors));
            localStorage.setItem('medicalSchedules', JSON.stringify(this.schedules));
            localStorage.setItem('medicalStats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Error al guardar datos:', error);
            this.showNotification('Error al guardar datos', 'error');
        }
    }

    // Cargar datos iniciales si no existen
    loadInitialData() {
        if (this.patients.length === 0) {
            this.patients = [
                {
                    id: 1,
                    name: 'María González',
                    dni: '12.345.678',
                    phone: '(011) 1234-5678',
                    email: 'maria@email.com',
                    lastVisit: '15/11/2024',
                    birthDate: '1980-05-15',
                    address: 'Av. Corrientes 1234, CABA',
                    emergencyContact: 'Juan González - (011) 1234-5679'
                },
                {
                    id: 2,
                    name: 'Carlos Ruiz',
                    dni: '23.456.789',
                    phone: '(011) 2345-6789',
                    email: 'carlos@email.com',
                    lastVisit: '10/11/2024',
                    birthDate: '1975-08-22',
                    address: 'Av. Santa Fe 5678, CABA',
                    emergencyContact: 'Ana Ruiz - (011) 2345-6790'
                },
                {
                    id: 3,
                    name: 'Ana Silva',
                    dni: '34.567.890',
                    phone: '(011) 3456-7890',
                    email: 'ana@email.com',
                    lastVisit: '08/11/2024',
                    birthDate: '1990-12-10',
                    address: 'Av. Rivadavia 9012, CABA',
                    emergencyContact: 'Pedro Silva - (011) 3456-7891'
                }
            ];
        }

        if (this.doctors.length === 0) {
            this.doctors = [
                {
                    id: 1,
                    name: 'Dr. López',
                    specialty: 'Cardiología',
                    license: '12345',
                    schedule: '08:00 - 17:00',
                    status: 'disponible',
                    experience: '15 años',
                    education: 'Universidad de Buenos Aires',
                    languages: ['Español', 'Inglés']
                },
                {
                    id: 2,
                    name: 'Dr. Martínez',
                    specialty: 'Dermatología',
                    license: '23456',
                    schedule: '09:00 - 18:00',
                    status: 'ocupado',
                    experience: '12 años',
                    education: 'Universidad Nacional de La Plata',
                    languages: ['Español']
                },
                {
                    id: 3,
                    name: 'Dr. García',
                    specialty: 'Pediatría',
                    license: '34567',
                    schedule: '08:30 - 16:30',
                    status: 'disponible',
                    experience: '18 años',
                    education: 'Universidad de Buenos Aires',
                    languages: ['Español', 'Francés']
                }
            ];
        }

        if (this.appointments.length === 0) {
            this.appointments = [
                {
                    id: 1,
                    patientId: 1,
                    doctorId: 1,
                    date: '2024-12-01',
                    time: '09:00',
                    reason: 'Control cardiológico',
                    status: 'confirmado',
                    createdAt: '2024-11-25T10:30:00Z',
                    notes: 'Paciente con hipertensión'
                },
                {
                    id: 2,
                    patientId: 2,
                    doctorId: 2,
                    date: '2024-12-01',
                    time: '09:30',
                    reason: 'Revisión de lunares',
                    status: 'pendiente',
                    createdAt: '2024-11-26T14:20:00Z',
                    notes: 'Lunar sospechoso en brazo'
                },
                {
                    id: 3,
                    patientId: 3,
                    doctorId: 3,
                    date: '2024-12-01',
                    time: '10:00',
                    reason: 'Control pediátrico',
                    status: 'confirmado',
                    createdAt: '2024-11-27T09:15:00Z',
                    notes: 'Vacunación pendiente'
                }
            ];
        }

        this.saveData();
    }

    // Configurar event listeners
    setupEventListeners() {
        try {
            // Navegación del sidebar
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const section = e.currentTarget.dataset.section;
                    if (section) {
                        this.navigateToSection(section);
                    }
                });
            });

            // Toggle del sidebar
            const sidebarToggle = document.querySelector('.sidebar-toggle');
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', () => {
                    document.body.classList.toggle('sidebar-collapsed');
                });
            }

            // Botones de nuevo turno
            const newAppointmentBtns = document.querySelectorAll('#newAppointmentBtn, #addAppointmentBtn');
            newAppointmentBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.openAppointmentModal();
                });
            });

            // Modal de turnos
            this.setupModalEvents();

            // Búsqueda
            const searchInput = document.querySelector('.search-box input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.handleSearch(e.target.value);
                });
            }

            // Filtros
            this.setupFilters();

            // Botones de acción en tablas
            this.setupTableActions();
            
            console.log('Event listeners configurados correctamente');
        } catch (error) {
            console.error('Error al configurar event listeners:', error);
        }
    }

    // Configurar eventos del modal
    setupModalEvents() {
        const modal = document.getElementById('appointmentModal');
        const closeBtn = document.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelAppointment');
        const saveBtn = document.getElementById('saveAppointment');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveAppointment();
            });
        }

        // Cerrar modal al hacer clic fuera
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    // Configurar filtros
    setupFilters() {
        const filterInputs = document.querySelectorAll('.filter-input');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    // Configurar acciones de tabla
    setupTableActions() {
        // Botones de editar y cancelar en la tabla de turnos
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon[title="Editar"]')) {
                const row = e.target.closest('tr');
                const appointmentId = this.getAppointmentIdFromRow(row);
                this.editAppointment(appointmentId);
            }

            if (e.target.closest('.btn-icon[title="Cancelar"]')) {
                const row = e.target.closest('tr');
                const appointmentId = this.getAppointmentIdFromRow(row);
                this.cancelAppointment(appointmentId);
            }
        });
    }

    // Navegación entre secciones
    navigateToSection(section) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Mostrar sección correspondiente
        document.querySelectorAll('.content-section').forEach(sectionEl => {
            sectionEl.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        // Actualizar título de la página
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            const titles = {
                dashboard: 'Dashboard',
                appointments: 'Turnos',
                patients: 'Pacientes',
                doctors: 'Médicos',
                schedule: 'Horarios',
                reports: 'Reportes'
            };
            pageTitle.textContent = titles[section] || 'Dashboard';
        }

        this.currentSection = section;

        // Actualizar contenido específico de la sección
        this.updateSectionContent(section);
    }

    // Actualizar contenido de sección específica
    updateSectionContent(section) {
        switch (section) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'appointments':
                this.updateAppointmentsTable();
                break;
            case 'patients':
                this.updatePatientsGrid();
                break;
            case 'doctors':
                this.updateDoctorsGrid();
                break;
            case 'schedule':
                this.updateScheduleCalendar();
                break;
            case 'reports':
                this.updateReports();
                break;
        }
    }

    // Actualizar dashboard
    updateDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = this.appointments.filter(apt => apt.date === today);
        const confirmedToday = todayAppointments.filter(apt => apt.status === 'confirmado').length;
        const pendingToday = todayAppointments.filter(apt => apt.status === 'pendiente').length;

        // Actualizar estadísticas
        const statsCards = document.querySelectorAll('.stat-card');
        if (statsCards.length >= 3) {
            statsCards[0].querySelector('.stat-number').textContent = todayAppointments.length;
            statsCards[1].querySelector('.stat-number').textContent = this.patients.length;
            statsCards[2].querySelector('.stat-number').textContent = this.doctors.length;
        }

        // Actualizar lista de próximos turnos
        this.updateUpcomingAppointments();

        // Actualizar mini calendario
        this.updateMiniCalendar();
    }

    // Actualizar lista de próximos turnos
    updateUpcomingAppointments() {
        const appointmentsList = document.querySelector('.appointments-list');
        if (!appointmentsList) return;

        const today = new Date().toISOString().split('T')[0];
        const upcomingAppointments = this.appointments
            .filter(apt => apt.date >= today)
            .sort((a, b) => {
                if (a.date === b.date) {
                    return a.time.localeCompare(b.time);
                }
                return a.date.localeCompare(b.date);
            })
            .slice(0, 3);

        appointmentsList.innerHTML = upcomingAppointments.map(apt => {
            const patient = this.patients.find(p => p.id === apt.patientId);
            const doctor = this.doctors.find(d => d.id === apt.doctorId);
            
            return `
                <div class="appointment-item">
                    <div class="appointment-time">${apt.time}</div>
                    <div class="appointment-info">
                        <span class="patient-name">${patient ? patient.name : 'Paciente no encontrado'}</span>
                        <span class="doctor-name">${doctor ? doctor.name : 'Médico no encontrado'}</span>
                    </div>
                    <div class="appointment-status ${apt.status}">${this.getStatusText(apt.status)}</div>
                </div>
            `;
        }).join('');
    }

    // Actualizar mini calendario
    updateMiniCalendar() {
        const calendarDates = document.querySelectorAll('.calendar-date');
        const today = new Date().getDate();
        
        calendarDates.forEach((dateEl, index) => {
            const dateNumber = index + 1;
            dateEl.classList.remove('today', 'has-appointments');
            
            if (dateNumber === today) {
                dateEl.classList.add('today');
            }
            
            // Verificar si hay turnos en esta fecha
            const dateString = `2024-12-${dateNumber.toString().padStart(2, '0')}`;
            const hasAppointments = this.appointments.some(apt => apt.date === dateString);
            
            if (hasAppointments) {
                dateEl.classList.add('has-appointments');
            }
        });
    }

    // Actualizar tabla de turnos
    updateAppointmentsTable(filteredAppointments = null) {
        const tbody = document.querySelector('.appointments-table tbody');
        if (!tbody) return;

        const appointmentsToShow = filteredAppointments || this.appointments;
        
        tbody.innerHTML = appointmentsToShow.map(apt => {
            const patient = this.patients.find(p => p.id === apt.patientId);
            const doctor = this.doctors.find(d => d.id === apt.doctorId);
            
            return `
                <tr data-appointment-id="${apt.id}">
                    <td>${apt.time}</td>
                    <td>${patient ? patient.name : 'Paciente no encontrado'}</td>
                    <td>${doctor ? doctor.name : 'Médico no encontrado'}</td>
                    <td>${doctor ? doctor.specialty : 'N/A'}</td>
                    <td><span class="status-badge ${apt.status}">${this.getStatusText(apt.status)}</span></td>
                    <td>
                        <button class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" title="Cancelar"><i class="fas fa-times"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Actualizar grid de pacientes
    updatePatientsGrid(filteredPatients = null) {
        const patientsGrid = document.querySelector('.patients-grid');
        if (!patientsGrid) return;

        const patientsToShow = filteredPatients || this.patients;
        
        patientsGrid.innerHTML = patientsToShow.map(patient => `
            <div class="patient-card">
                <div class="patient-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="patient-info">
                    <h3>${patient.name}</h3>
                    <p>DNI: ${patient.dni}</p>
                    <p>Teléfono: ${patient.phone}</p>
                    <p>Última visita: ${patient.lastVisit}</p>
                </div>
                <div class="patient-actions">
                    <button class="btn-icon" title="Ver historial"><i class="fas fa-history"></i></button>
                    <button class="btn-icon" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" title="Nuevo turno"><i class="fas fa-calendar-plus"></i></button>
                </div>
            </div>
        `).join('');
    }

    // Actualizar grid de médicos
    updateDoctorsGrid(filteredDoctors = null) {
        const doctorsGrid = document.querySelector('.doctors-grid');
        if (!doctorsGrid) return;

        const doctorsToShow = filteredDoctors || this.doctors;
        
        doctorsGrid.innerHTML = doctorsToShow.map(doctor => `
            <div class="doctor-card">
                <div class="doctor-avatar">
                    <i class="fas fa-user-md"></i>
                </div>
                <div class="doctor-info">
                    <h3>${doctor.name}</h3>
                    <p>${doctor.specialty}</p>
                    <p>Matrícula: ${doctor.license}</p>
                    <p>Horario: ${doctor.schedule}</p>
                </div>
                <div class="doctor-status">
                    <span class="status-indicator ${doctor.status}"></span>
                    <span>${this.getDoctorStatusText(doctor.status)}</span>
                </div>
            </div>
        `).join('');
    }

    // Actualizar calendario de horarios
    updateScheduleCalendar() {
        // Implementar lógica del calendario de horarios
        console.log('Actualizando calendario de horarios');
    }

    // Actualizar reportes
    updateReports() {
        // Implementar lógica de reportes
        console.log('Actualizando reportes');
    }

    // Abrir modal de turno
    openAppointmentModal(appointment = null) {
        const modal = document.getElementById('appointmentModal');
        const form = document.querySelector('.appointment-form');
        
        if (!modal || !form) return;

        // Limpiar formulario
        form.reset();

        // Si es edición, llenar con datos existentes
        if (appointment) {
            form.querySelector('select[required]').value = appointment.patientId;
            form.querySelectorAll('select')[1].value = appointment.doctorId;
            form.querySelector('input[type="date"]').value = appointment.date;
            form.querySelector('#timeSelect').value = appointment.time;
            form.querySelector('textarea').value = appointment.reason || '';
        }

        // Llenar opciones de pacientes
        const patientSelect = form.querySelector('select[required]');
        if (patientSelect) {
            patientSelect.innerHTML = '<option value="">Seleccionar paciente</option>' +
                this.patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }

        // Llenar opciones de médicos
        const doctorSelect = form.querySelectorAll('select')[1];
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">Seleccionar médico</option>' +
                this.doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
        }

        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }

    // Cerrar modal
    closeModal() {
        const modal = document.getElementById('appointmentModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }

    // Guardar turno
    saveAppointment() {
        const form = document.querySelector('.appointment-form');
        if (!form) {
            this.showNotification('Error: formulario no encontrado', 'error');
            return;
        }

        try {
            const patientSelect = form.querySelector('select[required]');
            const doctorSelect = form.querySelectorAll('select')[1];
            const dateInput = form.querySelector('input[type="date"]');
            const timeSelect = form.querySelector('#timeSelect');
            const reasonTextarea = form.querySelector('textarea');

            const patientId = patientSelect ? parseInt(patientSelect.value) : null;
            const doctorId = doctorSelect ? parseInt(doctorSelect.value) : null;
            const date = dateInput ? dateInput.value : null;
            const time = timeSelect ? timeSelect.value : null;
            const reason = reasonTextarea ? reasonTextarea.value : '';

            // Validaciones
            if (!patientId || !doctorId || !date || !time) {
                this.showNotification('Por favor complete todos los campos obligatorios', 'error');
                return;
            }

            // Validar fecha (no puede ser en el pasado)
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                this.showNotification('No se pueden crear turnos en fechas pasadas', 'error');
                return;
            }

            // Verificar disponibilidad
            const existingAppointment = this.appointments.find(apt => 
                apt.doctorId === doctorId && apt.date === date && apt.time === time && apt.status !== 'cancelado'
            );

            if (existingAppointment) {
                this.showNotification('El médico ya tiene un turno en ese horario', 'error');
                return;
            }

            // Crear nuevo turno
            const newAppointment = {
                id: Date.now(),
                patientId: patientId,
                doctorId: doctorId,
                date: date,
                time: time,
                reason: reason,
                status: 'pendiente',
                createdAt: new Date().toISOString(),
                notes: ''
            };

            this.appointments.push(newAppointment);
            this.saveData();
            this.closeModal();
            this.updateSectionContent(this.currentSection);
            this.showNotification('Turno creado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al guardar turno:', error);
            this.showNotification('Error al guardar el turno', 'error');
        }
    }

    // Editar turno
    editAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            this.openAppointmentModal(appointment);
        }
    }

    // Cancelar turno
    cancelAppointment(appointmentId) {
        if (confirm('¿Está seguro de que desea cancelar este turno?')) {
            const appointment = this.appointments.find(apt => apt.id === appointmentId);
            if (appointment) {
                appointment.status = 'cancelado';
                this.saveData();
                this.updateSectionContent(this.currentSection);
                this.showNotification('Turno cancelado exitosamente', 'success');
            }
        }
    }

    // Manejar búsqueda
    handleSearch(query) {
        if (!query.trim()) {
            this.updateSectionContent(this.currentSection);
            return;
        }

        const lowerQuery = query.toLowerCase();
        
        switch (this.currentSection) {
            case 'appointments':
                this.filterAppointments(query);
                break;
            case 'patients':
                this.filterPatients(query);
                break;
            case 'doctors':
                this.filterDoctors(query);
                break;
        }
    }

    // Filtrar turnos
    filterAppointments(query) {
        const filteredAppointments = this.appointments.filter(apt => {
            const patient = this.patients.find(p => p.id === apt.patientId);
            const doctor = this.doctors.find(d => d.id === apt.doctorId);
            
            return (patient && patient.name.toLowerCase().includes(query.toLowerCase())) ||
                   (doctor && doctor.name.toLowerCase().includes(query.toLowerCase())) ||
                   (apt.reason && apt.reason.toLowerCase().includes(query.toLowerCase()));
        });

        this.updateAppointmentsTable(filteredAppointments);
    }

    // Filtrar pacientes
    filterPatients(query) {
        const filteredPatients = this.patients.filter(patient =>
            patient.name.toLowerCase().includes(query.toLowerCase()) ||
            patient.dni.includes(query) ||
            patient.phone.includes(query)
        );

        this.updatePatientsGrid(filteredPatients);
    }

    // Filtrar médicos
    filterDoctors(query) {
        const filteredDoctors = this.doctors.filter(doctor =>
            doctor.name.toLowerCase().includes(query.toLowerCase()) ||
            doctor.specialty.toLowerCase().includes(query.toLowerCase()) ||
            doctor.license.includes(query)
        );

        this.updateDoctorsGrid(filteredDoctors);
    }

    // Aplicar filtros
    applyFilters() {
        // Implementar lógica de filtros avanzados
        console.log('Aplicando filtros');
    }

    // Obtener ID de turno desde fila de tabla
    getAppointmentIdFromRow(row) {
        return parseInt(row.dataset.appointmentId);
    }

    // Obtener texto de estado
    getStatusText(status) {
        const statusMap = {
            'pendiente': 'Pendiente',
            'confirmado': 'Confirmado',
            'cancelado': 'Cancelado',
            'completado': 'Completado',
            'no-presento': 'No se presentó'
        };
        return statusMap[status] || status;
    }

    // Obtener texto de estado de médico
    getDoctorStatusText(status) {
        const statusMap = {
            'disponible': 'Disponible',
            'ocupado': 'Ocupado',
            'fuera-linea': 'Fuera de línea'
        };
        return statusMap[status] || status;
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${AppConfig.notifications.types[type].color};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <i class="${AppConfig.notifications.types[type].icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Remover notificación después del tiempo configurado
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, AppConfig.ui.notificationDuration);
    }

    // Métodos de utilidad
    formatDate(date) {
        return AppConfig.utils.formatDate(date);
    }

    formatTime(time) {
        return AppConfig.utils.formatTime(time);
    }

    generateId() {
        return AppConfig.utils.generateId();
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que todos los elementos necesarios estén disponibles
    const requiredElements = [
        '.sidebar',
        '.main-content',
        '.nav-item',
        '#appointmentModal',
        '.appointment-form'
    ];
    
    const missingElements = requiredElements.filter(selector => !document.querySelector(selector));
    
    if (missingElements.length > 0) {
        console.error('Elementos faltantes:', missingElements);
        return;
    }
    
    // Crear instancia global del gestor de turnos
    window.appointmentManager = new MedicalAppointmentManager();
    
    // Cargar datos de demostración si están disponibles
    if (window.DemoData && window.DemoData.loadDemoData) {
        // Opcional: cargar datos de demostración
        // window.DemoData.loadDemoData();
    }

    // --- Lógica para rotar vistas de rol ---
    // Definir roles y rolActual si no existen
    window.roles = ['paciente', 'medico', 'secretario'];
    let rolActual = localStorage.getItem('userRole') || 'paciente';
    mostrarVistaPorRol(rolActual);
    const btn = document.getElementById('btn-rol-toggle');
    if (btn) {
        btn.addEventListener('click', function() {
            let idx = window.roles.indexOf(rolActual);
            rolActual = window.roles[(idx + 1) % window.roles.length];
            localStorage.setItem('userRole', rolActual);
            mostrarVistaPorRol(rolActual);
        });
    }
});

// Funciones globales de utilidad
window.showNotification = function(message, type = 'info') {
    if (window.appointmentManager) {
        window.appointmentManager.showNotification(message, type);
    }
};

window.navigateToSection = function(section) {
    if (window.appointmentManager) {
        window.appointmentManager.navigateToSection(section);
    }
};

// Manejar errores globales
window.addEventListener('error', function(e) {
    console.error('Error en la aplicación:', e.error);
    if (window.appointmentManager) {
        window.appointmentManager.showNotification('Ha ocurrido un error inesperado', 'error');
    }
});

// Manejar errores de promesas no capturadas
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada:', e.reason);
    if (window.appointmentManager) {
        window.appointmentManager.showNotification('Error en operación asíncrona', 'error');
    }
});

// Función logout global para el botón del sidebar
window.logout = function() {
    console.log('Función logout llamada');
    
    if (window.authManager) {
        console.log('AuthManager disponible, cerrando sesión...');
        window.authManager.logout();
    } else {
        console.log('AuthManager no disponible, limpiando localStorage manualmente...');
        // Fallback: limpiar localStorage y redirigir
        localStorage.removeItem('mediturnos_user');
        window.location.href = 'landing.html';
    }
};

// Función global para borrar TODO el localStorage
window.clearLocalStorage = function() {
    localStorage.clear();
    console.log('LocalStorage borrado completamente');
    // Opcional: recargar la página
    // location.reload();
};

// Agregar estilos CSS para animaciones de notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .modal-open {
        overflow: hidden;
    }
    
    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
        margin-right: 6px;
    }
    
    .status-indicator.disponible {
        background-color: #22c55e;
    }
    
    .status-indicator.ocupado {
        background-color: #f59e0b;
    }
    
    .status-indicator.fuera-linea {
        background-color: #ef4444;
    }
    
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .status-badge.pendiente {
        background-color: #fef3c7;
        color: #92400e;
    }
    
    .status-badge.confirmado {
        background-color: #d1fae5;
        color: #065f46;
    }
    
    .status-badge.cancelado {
        background-color: #fee2e2;
        color: #991b1b;
    }
    
    .status-badge.completado {
        background-color: #e5e7eb;
        color: #374151;
    }
    
    .status-badge.no-presento {
        background-color: #fed7aa;
        color: #9a3412;
    }
    
    .appointment-status {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .appointment-status.pendiente {
        background-color: #fef3c7;
        color: #92400e;
    }
    
    .appointment-status.confirmado {
        background-color: #d1fae5;
        color: #065f46;
    }
    
    .appointment-status.cancelado {
        background-color: #fee2e2;
        color: #991b1b;
    }
    
    .calendar-date.today {
        background-color: #3b82f6;
        color: white;
        border-radius: 50%;
    }
    
    .calendar-date.has-appointments::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        background-color: #ef4444;
        border-radius: 50%;
    }
`;
document.head.appendChild(style);

// Función para mostrar vista por rol
function mostrarVistaPorRol(rol) {
    // Oculta todas las secciones y nav-items (sidebar)
    document.querySelectorAll('.nav-item').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    let btns = document.querySelectorAll('.section-actions .btn-primary');
    btns.forEach(btn => btn.style.display = 'none');

    // Mostrar según rol
    if (rol === 'paciente') {
        // Sidebar
        let navDashboard = document.querySelector('[data-section="dashboard"]');
        let navAppointments = document.querySelector('[data-section="appointments"]');
        if (navDashboard) navDashboard.style.display = '';
        if (navAppointments) navAppointments.style.display = '';
        // Secciones
        let secDashboard = document.getElementById('dashboard');
        let secAppointments = document.getElementById('appointments');
        if (secDashboard) secDashboard.style.display = '';
        if (secAppointments) secAppointments.style.display = '';
        // Botón crear turno
        let turnoBtn = document.getElementById('newAppointmentBtn');
        if (turnoBtn) turnoBtn.style.display = '';
    } else if (rol === 'medico') {
        // Sidebar
        let navDashboard = document.querySelector('[data-section="dashboard"]');
        let navAppointments = document.querySelector('[data-section="appointments"]');
        let navPatients = document.querySelector('[data-section="patients"]');
        if (navDashboard) navDashboard.style.display = '';
        if (navAppointments) navAppointments.style.display = '';
        if (navPatients) navPatients.style.display = '';
        // Secciones
        let secDashboard = document.getElementById('dashboard');
        let secAppointments = document.getElementById('appointments');
        let secPatients = document.getElementById('patients');
        if (secDashboard) secDashboard.style.display = '';
        if (secAppointments) secAppointments.style.display = '';
        if (secPatients) secPatients.style.display = '';
        // Botón crear turno y paciente
        let turnoBtn = document.getElementById('newAppointmentBtn');
        if (turnoBtn) turnoBtn.style.display = '';
        let pacienteBtns = Array.from(document.querySelectorAll('.section-actions .btn-primary')).filter(btn => btn.textContent.includes('Paciente'));
        pacienteBtns.forEach(btn => btn.style.display = '');
    } else if (rol === 'secretario') {
        // Sidebar y secciones
        document.querySelectorAll('.nav-item').forEach(el => el.style.display = '');
        document.querySelectorAll('.content-section').forEach(el => el.style.display = '');
        btns.forEach(btn => btn.style.display = '');
    }

    // Actualiza el texto del botón
    const btn = document.getElementById('btn-rol-toggle');
    if (btn) btn.textContent = 'Rol: ' + rol.charAt(0).toUpperCase() + rol.slice(1);
}
