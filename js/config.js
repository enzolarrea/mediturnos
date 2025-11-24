// ============================================
// CONFIGURACIÓN GLOBAL DEL SISTEMA
// ============================================

export const CONFIG = {
    // Claves de localStorage
    STORAGE: {
        USERS: 'mediturnos_users',
        CURRENT_USER: 'mediturnos_current_user',
        TURNOS: 'mediturnos_turnos',
        MEDICOS: 'mediturnos_medicos',
        PACIENTES: 'mediturnos_pacientes',
        NOTIFICACIONES: 'mediturnos_notificaciones',
        CONFIG: 'mediturnos_config'
    },

    // Roles del sistema
    ROLES: {
        ADMIN: 'administrador',
        SECRETARIO: 'secretario',
        MEDICO: 'medico',
        PACIENTE: 'paciente'
    },

    // Permisos por rol
    PERMISSIONS: {
        administrador: [
            'view_dashboard',
            'manage_users',
            'manage_medicos',
            'manage_pacientes',
            'manage_turnos',
            'view_reports',
            'manage_config',
            'view_audit'
        ],
        secretario: [
            'view_dashboard',
            'manage_turnos',
            'manage_pacientes',
            'view_medicos',
            'view_calendar'
        ],
        medico: [
            'view_dashboard',
            'view_own_turnos',
            'update_turno_status',
            'view_patient_history',
            'manage_notes',
            'manage_availability'
        ],
        paciente: [
            'view_dashboard',
            'book_turno',
            'view_own_turnos',
            'cancel_own_turno',
            'edit_own_data',
            'view_own_history'
        ]
    },

    // Estados de turnos
    TURNO_ESTADOS: {
        PENDIENTE: 'pendiente',
        CONFIRMADO: 'confirmado',
        EN_CURSO: 'en_curso',
        COMPLETADO: 'completado',
        CANCELADO: 'cancelado',
        NO_ASISTIO: 'no_asistio'
    },

    // Horarios del sistema
    HORARIOS: [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00'
    ],

    // Configuración de UI
    UI: {
        ANIMATION_DURATION: 300,
        NOTIFICATION_DURATION: 5000,
        DEBOUNCE_DELAY: 300
    }
};

