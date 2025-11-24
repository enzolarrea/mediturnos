// ============================================
// MÓDULO DE GESTIÓN DE STORAGE
// ============================================

import { CONFIG } from '../config.js';

export class StorageManager {
    static init() {
        // Inicializar usuarios
        if (!localStorage.getItem(CONFIG.STORAGE.USERS)) {
            this.createDefaultUsers();
        }

        // Inicializar turnos
        if (!localStorage.getItem(CONFIG.STORAGE.TURNOS)) {
            localStorage.setItem(CONFIG.STORAGE.TURNOS, JSON.stringify([]));
        }

        // Inicializar médicos
        if (!localStorage.getItem(CONFIG.STORAGE.MEDICOS)) {
            this.createDefaultMedicos();
        }

        // Inicializar pacientes
        if (!localStorage.getItem(CONFIG.STORAGE.PACIENTES)) {
            this.createDefaultPacientes();
        }

        // Inicializar notificaciones
        if (!localStorage.getItem(CONFIG.STORAGE.NOTIFICACIONES)) {
            localStorage.setItem(CONFIG.STORAGE.NOTIFICACIONES, JSON.stringify([]));
        }
    }

    static createDefaultUsers() {
        const defaultUsers = [
            {
                id: 1,
                nombre: 'Admin',
                apellido: 'Sistema',
                email: 'admin@mediturnos.com',
                password: 'Admin123',
                rol: CONFIG.ROLES.ADMIN,
                activo: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                id: 2,
                nombre: 'María',
                apellido: 'González',
                email: 'secretario@mediturnos.com',
                password: 'Secret123',
                rol: CONFIG.ROLES.SECRETARIO,
                activo: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                id: 3,
                nombre: 'Dr. Carlos',
                apellido: 'López',
                email: 'medico@mediturnos.com',
                password: 'Medico123',
                rol: CONFIG.ROLES.MEDICO,
                medicoId: 1,
                activo: true,
                fechaCreacion: new Date().toISOString()
            },
            {
                id: 4,
                nombre: 'Juan',
                apellido: 'Pérez',
                email: 'paciente@mediturnos.com',
                password: 'Paciente123',
                rol: CONFIG.ROLES.PACIENTE,
                pacienteId: 1,
                activo: true,
                fechaCreacion: new Date().toISOString()
            }
        ];
        localStorage.setItem(CONFIG.STORAGE.USERS, JSON.stringify(defaultUsers));
    }

    static createDefaultMedicos() {
        const medicos = [
            {
                id: 1,
                nombre: 'Dr. Carlos López',
                especialidad: 'Cardiología',
                matricula: '12345',
                horario: '08:00 - 17:00',
                email: 'carlos.lopez@mediturnos.com',
                telefono: '(011) 1234-5678',
                activo: true,
                disponibilidad: {
                    lunes: { inicio: '08:00', fin: '17:00' },
                    martes: { inicio: '08:00', fin: '17:00' },
                    miercoles: { inicio: '08:00', fin: '17:00' },
                    jueves: { inicio: '08:00', fin: '17:00' },
                    viernes: { inicio: '08:00', fin: '17:00' }
                }
            },
            {
                id: 2,
                nombre: 'Dra. Ana Martínez',
                especialidad: 'Dermatología',
                matricula: '23456',
                horario: '09:00 - 18:00',
                email: 'ana.martinez@mediturnos.com',
                telefono: '(011) 2345-6789',
                activo: true,
                disponibilidad: {
                    lunes: { inicio: '09:00', fin: '18:00' },
                    martes: { inicio: '09:00', fin: '18:00' },
                    miercoles: { inicio: '09:00', fin: '18:00' },
                    jueves: { inicio: '09:00', fin: '18:00' },
                    viernes: { inicio: '09:00', fin: '18:00' }
                }
            },
            {
                id: 3,
                nombre: 'Dr. Luis García',
                especialidad: 'Pediatría',
                matricula: '34567',
                horario: '08:30 - 16:30',
                email: 'luis.garcia@mediturnos.com',
                telefono: '(011) 3456-7890',
                activo: true,
                disponibilidad: {
                    lunes: { inicio: '08:30', fin: '16:30' },
                    martes: { inicio: '08:30', fin: '16:30' },
                    miercoles: { inicio: '08:30', fin: '16:30' },
                    jueves: { inicio: '08:30', fin: '16:30' },
                    viernes: { inicio: '08:30', fin: '16:30' }
                }
            }
        ];
        localStorage.setItem(CONFIG.STORAGE.MEDICOS, JSON.stringify(medicos));
    }

    static createDefaultPacientes() {
        const pacientes = [
            {
                id: 1,
                nombre: 'Juan',
                apellido: 'Pérez',
                dni: '12.345.678',
                telefono: '(011) 1111-2222',
                email: 'juan.perez@email.com',
                fechaNacimiento: '1985-05-15',
                direccion: 'Av. Corrientes 1234',
                ultimaVisita: new Date().toISOString().split('T')[0],
                activo: true
            },
            {
                id: 2,
                nombre: 'María',
                apellido: 'González',
                dni: '23.456.789',
                telefono: '(011) 2222-3333',
                email: 'maria.gonzalez@email.com',
                fechaNacimiento: '1990-08-20',
                direccion: 'Av. Santa Fe 5678',
                ultimaVisita: new Date().toISOString().split('T')[0],
                activo: true
            },
            {
                id: 3,
                nombre: 'Carlos',
                apellido: 'Ruiz',
                dni: '34.567.890',
                telefono: '(011) 3333-4444',
                email: 'carlos.ruiz@email.com',
                fechaNacimiento: '1988-12-10',
                direccion: 'Av. Córdoba 9012',
                ultimaVisita: new Date().toISOString().split('T')[0],
                activo: true
            }
        ];
        localStorage.setItem(CONFIG.STORAGE.PACIENTES, JSON.stringify(pacientes));
    }

    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error al leer de localStorage:', e);
            return null;
        }
    }

    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        Object.values(CONFIG.STORAGE).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

