// ============================================
// MÓDULO DE GESTIÓN DE MÉDICOS
// ============================================

import { CONFIG } from '../config.js';
import { ApiClient } from './api.js';

export class MedicosManager {
    static async getAll(filters = {}) {
        try {
            // Preparar filtros para la API
            const apiFilters = {};
            
            if (filters.activo !== undefined) apiFilters.activo = filters.activo;
            if (filters.especialidad) apiFilters.especialidad = filters.especialidad;
            if (filters.search) apiFilters.search = filters.search;

            const medicos = await ApiClient.getMedicos(apiFilters);
            
            // Normalizar datos (convertir especialidades de string a array si es necesario)
            return medicos.map(m => ({
                ...m,
                especialidad: m.especialidades || m.especialidad || '',
                especialidades: m.especialidades ? m.especialidades.split(', ') : [m.especialidad || '']
            }));
        } catch (error) {
            console.error('Error al obtener médicos:', error);
            return [];
        }
    }

    static async getById(id) {
        try {
            const medico = await ApiClient.getMedico(id);
            
            // Normalizar datos
            if (medico) {
                return {
                    ...medico,
                    especialidad: medico.especialidades || medico.especialidad || '',
                    especialidades: medico.especialidades ? medico.especialidades.split(', ') : [medico.especialidad || '']
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error al obtener médico:', error);
            return null;
        }
    }

    static async create(medicoData) {
        try {
            const payload = {
                ...medicoData,
                // compat: si viene especialidad como string, backend la acepta
            };
            const medico = await ApiClient.post('/medico', payload);
            // ApiClient.request devuelve el wrapper; extraer medico si es necesario
            const medicoDataResp = medico.medico || medico;
            return { success: true, medico: medicoDataResp };
        } catch (error) {
            console.error('Error al crear médico:', error);
            return { success: false, message: error.message || 'Error al crear médico' };
        }
    }

    static async update(id, updates) {
        try {
            const medico = await ApiClient.put(`/medico/${id}`, updates);
            const medicoDataResp = medico.medico || medico;
            return { success: true, medico: medicoDataResp };
        } catch (error) {
            console.error('Error al actualizar médico:', error);
            return { success: false, message: error.message || 'Error al actualizar médico' };
        }
    }

    static async delete(id) {
        try {
            await ApiClient.delete(`/medico/${id}`);
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar médico:', error);
            return { success: false, message: error.message || 'Error al eliminar médico' };
        }
    }

    static async getDisponibilidad(id, fecha) {
        try {
            const disponibilidad = await ApiClient.getMedicoDisponibilidad(id, fecha);
            return disponibilidad;
        } catch (error) {
            console.error('Error al obtener disponibilidad:', error);
            return { disponible: false, turnosOcupados: 0, turnos: [] };
        }
    }

    static async getHorariosDisponibles(id, fecha) {
        try {
            const horarios = await ApiClient.getMedicoHorariosDisponibles(id, fecha);
            // Si la API devuelve un array, usarlo; si no, usar horarios del sistema
            if (Array.isArray(horarios) && horarios.length > 0) {
                return horarios;
            }
            // Fallback: usar horarios del sistema
            return CONFIG.HORARIOS;
        } catch (error) {
            console.error('Error al obtener horarios disponibles:', error);
            return CONFIG.HORARIOS;
        }
    }

    static getEspecialidades() {
        // Nota: método legacy; idealmente usar API específica de especialidades
        console.warn('MedicosManager.getEspecialidades() usa getAll(); considerar migrar a API /medico/especialidades');
        const medicosPromise = this.getAll({ activo: true });
        // Devolver promesa para compatibilidad
        return medicosPromise.then(medicos => {
            const especialidades = [...new Set(medicos.map(m => m.especialidad))];
            return especialidades.sort();
        });
    }
}

