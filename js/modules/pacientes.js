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

    static async create(pacienteData) {
        try {
            const paciente = await ApiClient.createPaciente(pacienteData);
            return { success: true, paciente };
        } catch (error) {
            console.error('Error al crear paciente:', error);
            return { success: false, message: error.message || 'Error al crear el paciente' };
        }
    }

    static async update(id, updates) {
        try {
            const paciente = await ApiClient.updatePaciente(id, updates);
            return { success: true, paciente };
        } catch (error) {
            console.error('Error al actualizar paciente:', error);
            return { success: false, message: error.message || 'Error al actualizar el paciente' };
        }
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

