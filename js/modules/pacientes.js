// ============================================
// MÓDULO DE GESTIÓN DE PACIENTES
// ============================================

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
            return { success: false, message: error.message || 'Error al crear paciente' };
        }
    }

    static async update(id, updates) {
        try {
            const paciente = await ApiClient.updatePaciente(id, updates);
            return { success: true, paciente };
        } catch (error) {
            console.error('Error al actualizar paciente:', error);
            return { success: false, message: error.message || 'Error al actualizar paciente' };
        }
    }

    static async delete(id) {
        try {
            await ApiClient.deletePaciente(id);
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar paciente:', error);
            return { success: false, message: error.message || 'Error al eliminar paciente' };
        }
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

    static async updateUltimaVisita(id) {
        try {
            await ApiClient.updatePaciente(id, { ultimaVisita: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error('Error al actualizar última visita del paciente:', error);
        }
    }
}

