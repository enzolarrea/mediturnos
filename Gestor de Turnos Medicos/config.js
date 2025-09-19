// Configuración del Gestor de Turnos Médicos
const AppConfig = {
    // Configuración general
    app: {
        name: 'MediTurnos',
        version: '1.0.0',
        description: 'Gestor Profesional de Turnos Médicos',
        author: 'Sistema de Gestión Médica',
        lastUpdate: '2024-12-01'
    },

    // Configuración de la interfaz
    ui: {
        theme: 'medical',
        language: 'es',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        itemsPerPage: 10,
        autoRefresh: 30000, // 30 segundos
        notificationDuration: 5000 // 5 segundos
    },

    // Configuración de horarios
    schedule: {
        startHour: 8,
        endHour: 18,
        slotDuration: 30, // minutos
        breakDuration: 15, // minutos
        lunchStart: 12,
        lunchEnd: 13,
        workingDays: [1, 2, 3, 4, 5], // Lunes a Viernes
        timezone: 'America/Argentina/Buenos_Aires',
        // Horarios estándar de 30 minutos
        timeSlots: [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
            '17:00', '17:30', '18:00'
        ]
    },

    // Configuración de especialidades médicas
    specialties: [
        { id: 1, name: 'Cardiología', color: '#ef4444', icon: 'fas fa-heart' },
        { id: 2, name: 'Dermatología', color: '#f59e0b', icon: 'fas fa-hand-paper' },
        { id: 3, name: 'Pediatría', color: '#22c55e', icon: 'fas fa-child' },
        { id: 4, name: 'Ginecología', color: '#8b5cf6', icon: 'fas fa-female' },
        { id: 5, name: 'Traumatología', color: '#06b6d4', icon: 'fas fa-bone' },
        { id: 6, name: 'Neurología', color: '#84cc16', icon: 'fas fa-brain' },
        { id: 7, name: 'Oftalmología', color: '#f97316', icon: 'fas fa-eye' },
        { id: 8, name: 'Otorrinolaringología', color: '#ec4899', icon: 'fas fa-ear-listen' },
        { id: 9, name: 'Psiquiatría', color: '#6366f1', icon: 'fas fa-brain' },
        { id: 10, name: 'Medicina General', color: '#64748b', icon: 'fas fa-user-md' }
    ],

    // Estados de turnos
    appointmentStatuses: [
        { id: 'pendiente', name: 'Pendiente', color: '#f59e0b', icon: 'fas fa-clock' },
        { id: 'confirmado', name: 'Confirmado', color: '#22c55e', icon: 'fas fa-check' },
        { id: 'cancelado', name: 'Cancelado', color: '#ef4444', icon: 'fas fa-times' },
        { id: 'completado', name: 'Completado', color: '#64748b', icon: 'fas fa-check-circle' },
        { id: 'no-presento', name: 'No se presentó', color: '#f97316', icon: 'fas fa-user-times' }
    ],

    // Configuración de notificaciones
    notifications: {
        enabled: true,
        types: {
            success: { color: '#22c55e', icon: 'fas fa-check-circle' },
            error: { color: '#ef4444', icon: 'fas fa-exclamation-circle' },
            warning: { color: '#f59e0b', icon: 'fas fa-exclamation-triangle' },
            info: { color: '#3b82f6', icon: 'fas fa-info-circle' }
        },
        positions: {
            top: 'top-4',
            right: 'right-4',
            bottom: 'bottom-4',
            left: 'left-4'
        }
    },

    // Configuración de validaciones
    validation: {
        patient: {
            name: { required: true, minLength: 2, maxLength: 50 },
            dni: { required: true, pattern: /^\d{2}\.\d{3}\.\d{3}$/ },
            phone: { required: true, pattern: /^\(\d{3}\) \d{4}-\d{4}$/ },
            email: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        },
        doctor: {
            name: { required: true, minLength: 2, maxLength: 50 },
            specialty: { required: true },
            license: { required: true, minLength: 5, maxLength: 10 },
            schedule: { required: true }
        },
        appointment: {
            patientId: { required: true },
            doctorId: { required: true },
            date: { required: true, minDate: 'today' },
            time: { required: true },
            reason: { required: false, maxLength: 500 }
        }
    },

    // Configuración de reportes
    reports: {
        defaultPeriod: 30, // días
        chartColors: [
            '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
        ],
        exportFormats: ['pdf', 'excel', 'csv'],
        autoGenerate: false
    },

    // Configuración de backup
    backup: {
        enabled: true,
        frequency: 'daily',
        maxBackups: 7,
        includeImages: false,
        compression: true
    },

    // Configuración de seguridad
    security: {
        sessionTimeout: 3600000, // 1 hora
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireSpecialChars: true,
        encryptLocalData: false
    },

    // Configuración de integración
    integration: {
        calendar: {
            enabled: false,
            provider: 'google', // google, outlook, apple
            syncFrequency: 'hourly'
        },
        sms: {
            enabled: false,
            provider: 'twilio',
            templates: {
                reminder: 'Recordatorio: Tienes una cita médica el {date} a las {time} con {doctor}',
                confirmation: 'Tu cita médica ha sido confirmada para el {date} a las {time}',
                cancellation: 'Tu cita médica del {date} a las {time} ha sido cancelada'
            }
        },
        email: {
            enabled: false,
            provider: 'smtp',
            templates: {
                reminder: 'template_reminder.html',
                confirmation: 'template_confirmation.html',
                cancellation: 'template_cancellation.html'
            }
        }
    },

    // Configuración de desarrollo
    development: {
        debug: false,
        logLevel: 'info', // debug, info, warn, error
        mockData: true,
        apiEndpoint: 'http://localhost:3000/api',
        version: 'development'
    },

    // Configuración de producción
    production: {
        debug: false,
        logLevel: 'error',
        mockData: false,
        apiEndpoint: 'https://api.mediturnos.com',
        version: 'production'
    },

    // Métodos de utilidad
    utils: {
        // Obtener configuración según el entorno
        getConfig: function() {
            return window.location.hostname === 'localhost' ? 
                { ...this, ...this.development } : 
                { ...this, ...this.production };
        },

        // Obtener especialidad por ID
        getSpecialty: function(id) {
            return this.specialties.find(s => s.id === id);
        },

        // Obtener estado por ID
        getStatus: function(id) {
            return this.appointmentStatuses.find(s => s.id === id);
        },

        // Validar formato de fecha
        isValidDate: function(dateString) {
            const date = new Date(dateString);
            return date instanceof Date && !isNaN(date);
        },

        // Validar formato de hora
        isValidTime: function(timeString) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
        },

        // Formatear fecha
        formatDate: function(date, format = this.ui.dateFormat) {
            const d = new Date(date);
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            
            switch(format) {
                case 'DD/MM/YYYY':
                    return `${day}/${month}/${year}`;
                case 'MM/DD/YYYY':
                    return `${month}/${day}/${year}`;
                case 'YYYY-MM-DD':
                    return `${year}-${month}-${day}`;
                default:
                    return d.toLocaleDateString();
            }
        },

        // Formatear hora
        formatTime: function(time, format = this.ui.timeFormat) {
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours);
            
            if (format === '12h') {
                const period = h >= 12 ? 'PM' : 'AM';
                const displayHours = h === 0 ? 12 : h > 12 ? h - 12 : h;
                return `${displayHours}:${minutes} ${period}`;
            }
            
            return time;
        },

        // Generar ID único
        generateId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        // Limpiar datos para exportación
        sanitizeForExport: function(data) {
            return JSON.parse(JSON.stringify(data, (key, value) => {
                if (typeof value === 'string') {
                    return value.replace(/[<>]/g, '');
                }
                return value;
            }));
        }
    }
};

// Exportar configuración globalmente
window.AppConfig = AppConfig;

// Configuración específica del entorno
const currentConfig = AppConfig.utils.getConfig();

// Aplicar configuración al DOM
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar título de la página
    document.title = `${currentConfig.app.name} - ${currentConfig.app.description}`;
    
    // Actualizar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = currentConfig.app.description;
    
    // Configurar tema
    document.documentElement.setAttribute('data-theme', currentConfig.ui.theme);
    document.documentElement.setAttribute('data-language', currentConfig.ui.language);
    
    // Configurar auto-refresh si está habilitado
    if (currentConfig.ui.autoRefresh > 0) {
        setInterval(() => {
            if (window.appointmentManager) {
                window.appointmentManager.updateDashboard();
            }
        }, currentConfig.ui.autoRefresh);
    }
    
    // Configurar notificaciones
    if (currentConfig.notifications.enabled) {
        // Crear contenedor de notificaciones
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = `fixed z-50 ${currentConfig.notifications.positions.top} ${currentConfig.notifications.positions.right}`;
        notificationContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 300px;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    console.log(`${currentConfig.app.name} v${currentConfig.app.version} inicializado correctamente`);
});

// Funciones de utilidad globales
window.formatDate = AppConfig.utils.formatDate;
window.formatTime = AppConfig.utils.formatTime;
window.generateId = AppConfig.utils.generateId;
window.getSpecialty = AppConfig.utils.getSpecialty;
window.getStatus = AppConfig.utils.getStatus;


