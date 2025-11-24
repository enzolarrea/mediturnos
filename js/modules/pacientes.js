// ============================================
// MÓDULO DE GESTIÓN DE PACIENTES
// ============================================

import { CONFIG } from '../config.js';
import { ApiClient } from './api.js';

export class PacientesManager {
    static async getAll(filters = {}) {
        try {
            // Preparar filtros para la API
            const apiFilters = {};
            
            if (filters.activo !== undefined) apiFilters.activo = filters.activo;
            if (filters.search) apiFilters.search = filters.search;

            const pacientes = await ApiClient.getPacientes(apiFilters);
            return pacientes || [];
        } catch (error) {
            console.error('Error al obtener pacientes:', error);
            return [];
        }
    }

    static async getById(id) {
        try {
            return await ApiClient.getPaciente(id);
        } catch (error) {
            console.error('Error al obtener paciente:', error);
            return null;
        }
    }

    static create(pacienteData) {
        const pacientes = StorageManager.get(CONFIG.STORAGE.PACIENTES) || [];

        // Validar DNI único
        if (pacienteData.dni && pacientes.find(p => p.dni === pacienteData.dni)) {
            return { success: false, message: 'Ya existe un paciente con este DNI' };
        }

        const newPaciente = {
            id: Date.now(),
            nombre: pacienteData.nombre,
            apellido: pacienteData.apellido,
            dni: pacienteData.dni || '',
            telefono: pacienteData.telefono || '',
            email: pacienteData.email || '',
            fechaNacimiento: pacienteData.fechaNacimiento || '',
            direccion: pacienteData.direccion || '',
            ultimaVisita: null,
            activo: true,
            fechaCreacion: new Date().toISOString()
        };

        pacientes.push(newPaciente);
        StorageManager.set(CONFIG.STORAGE.PACIENTES, pacientes);

        return { success: true, paciente: newPaciente };
    }

    static update(id, updates) {
        const pacientes = StorageManager.get(CONFIG.STORAGE.PACIENTES) || [];
        const index = pacientes.findIndex(p => p.id === parseInt(id));

        if (index === -1) {
            return { success: false, message: 'Paciente no encontrado' };
        }

        // Validar DNI único si se cambia
        if (updates.dni && updates.dni !== pacientes[index].dni) {
            const existe = pacientes.find(p => p.dni === updates.dni && p.id !== parseInt(id));
            if (existe) {
                return { success: false, message: 'Ya existe un paciente con este DNI' };
            }
        }

        pacientes[index] = {
            ...pacientes[index],
            ...updates,
            fechaActualizacion: new Date().toISOString()
        };

        StorageManager.set(CONFIG.STORAGE.PACIENTES, pacientes);
        return { success: true, paciente: pacientes[index] };
    }

    static delete(id) {
        const pacientes = StorageManager.get(CONFIG.STORAGE.PACIENTES) || [];
        const index = pacientes.findIndex(p => p.id === parseInt(id));

        if (index === -1) {
            return { success: false, message: 'Paciente no encontrado' };
        }

        // Soft delete
        pacientes[index].activo = false;
        StorageManager.set(CONFIG.STORAGE.PACIENTES, pacientes);

        return { success: true };
    }

    static async getHistorial(id) {
        try {
            const historial = await ApiClient.getPacienteHistorial(id);
            return Array.isArray(historial) ? historial : [];
        } catch (error) {
            console.error('Error al obtener historial:', error);
            return [];
        }
    }

    static updateUltimaVisita(id) {
        const pacientes = StorageManager.get(CONFIG.STORAGE.PACIENTES) || [];
        const index = pacientes.findIndex(p => p.id === parseInt(id));

        if (index !== -1) {
            pacientes[index].ultimaVisita = new Date().toISOString().split('T')[0];
            StorageManager.set(CONFIG.STORAGE.PACIENTES, pacientes);
        }
    }
}

