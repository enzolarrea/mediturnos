// ============================================
// MÓDULO DE GESTIÓN DE TURNOS
// ============================================

import { CONFIG } from '../config.js';
import { ApiClient } from './api.js';
import { AuthManager } from './auth.js';

export class TurnosManager {
    static async getAll(filters = {}) {
        try {
            // Preparar filtros para la API
            const apiFilters = {};
            
            if (filters.fecha) apiFilters.fecha = filters.fecha;
            if (filters.medicoId) apiFilters.medicoId = filters.medicoId;
            if (filters.pacienteId) apiFilters.pacienteId = filters.pacienteId;
            if (filters.estado) apiFilters.estado = filters.estado;
            if (filters.desde) apiFilters.desde = filters.desde;
            if (filters.hasta) apiFilters.hasta = filters.hasta;

            const turnos = await ApiClient.getTurnos(apiFilters);
            
            // Normalizar datos (asegurar que estado sea consistente)
            return turnos.map(t => ({
                ...t,
                estado: t.estado || t.estadoCodigo || CONFIG.TURNO_ESTADOS.PENDIENTE
            }));
        } catch (error) {
            console.error('Error al obtener turnos:', error);
            return [];
        }
    }

    static async getById(id) {
        try {
            return await ApiClient.getTurno(id);
        } catch (error) {
            console.error('Error al obtener turno:', error);
            return null;
        }
    }

    static async create(turnoData) {
        try {
            // Preparar datos para la API
            const data = {
                pacienteId: parseInt(turnoData.pacienteId),
                medicoId: parseInt(turnoData.medicoId),
                fecha: turnoData.fecha,
                hora: turnoData.hora,
                motivo: turnoData.motivo || '',
                notas: turnoData.notas || '',
                estado: turnoData.estado || CONFIG.TURNO_ESTADOS.PENDIENTE
            };

            const turno = await ApiClient.createTurno(data);
            return { success: true, turno };
        } catch (error) {
            console.error('Error al crear turno:', error);
            return { success: false, message: error.message || 'Error al crear turno' };
        }
    }

    static async update(id, updates) {
        try {
            // Preparar datos para la API
            const data = {};
            
            if (updates.pacienteId) data.pacienteId = parseInt(updates.pacienteId);
            if (updates.medicoId) data.medicoId = parseInt(updates.medicoId);
            if (updates.fecha) data.fecha = updates.fecha;
            if (updates.hora) data.hora = updates.hora;
            if (updates.estado) data.estado = updates.estado;
            if (updates.motivo !== undefined) data.motivo = updates.motivo;
            if (updates.notas !== undefined) data.notas = updates.notas;

            const turno = await ApiClient.updateTurno(id, data);
            return { success: true, turno };
        } catch (error) {
            console.error('Error al actualizar turno:', error);
            return { success: false, message: error.message || 'Error al actualizar turno' };
        }
    }

    static async cancel(id) {
        try {
            await ApiClient.cancelTurno(id);
            return { success: true };
        } catch (error) {
            console.error('Error al cancelar turno:', error);
            return { success: false, message: error.message || 'Error al cancelar turno' };
        }
    }

    static async getTurnosDelDia(fecha = null) {
        try {
            return await ApiClient.getTurnosDelDia(fecha);
        } catch (error) {
            console.error('Error al obtener turnos del día:', error);
            return [];
        }
    }

    static async getProximosTurnos(limit = 5) {
        try {
            return await ApiClient.getProximosTurnos(limit);
        } catch (error) {
            console.error('Error al obtener próximos turnos:', error);
            return [];
        }
    }

    static async getEstadisticas(fechaInicio, fechaFin) {
        try {
            return await ApiClient.getEstadisticas(fechaInicio, fechaFin);
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return {
                total: 0,
                pendientes: 0,
                confirmados: 0,
                completados: 0,
                cancelados: 0,
                noAsistio: 0
            };
        }
    }
}

