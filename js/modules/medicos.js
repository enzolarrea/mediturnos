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
            // Usar la API para crear
            const medico = await ApiClient.createMedico(medicoData);
            
            if (medico) {
                // Normalizar datos de respuesta
                const medicoNormalizado = {
                    ...medico,
                    especialidad: medico.especialidades || medico.especialidad || '',
                    especialidades: medico.especialidades ? 
                        (typeof medico.especialidades === 'string' 
                            ? medico.especialidades.split(', ') 
                            : medico.especialidades) 
                        : [medico.especialidad || '']
                };
                
                return { success: true, medico: medicoNormalizado };
            } else {
                return { success: false, message: 'No se pudo crear el médico' };
            }
        } catch (error) {
            console.error('Error al crear médico:', error);
            return { 
                success: false, 
                message: error.message || 'Error al crear el médico. Intente más tarde.' 
            };
        }
    }

    static async update(id, updates) {
        try {
            // Usar la API para actualizar
            const medico = await ApiClient.updateMedico(id, updates);
            
            if (medico) {
                // Normalizar datos de respuesta
                const medicoNormalizado = {
                    ...medico,
                    especialidad: medico.especialidades || medico.especialidad || '',
                    especialidades: medico.especialidades ? 
                        (typeof medico.especialidades === 'string' 
                            ? medico.especialidades.split(', ') 
                            : medico.especialidades) 
                        : [medico.especialidad || '']
                };
                
                return { success: true, medico: medicoNormalizado };
            } else {
                return { success: false, message: 'No se pudo actualizar el médico' };
            }
        } catch (error) {
            console.error('Error al actualizar médico:', error);
            return { 
                success: false, 
                message: error.message || 'Error al actualizar el médico. Intente más tarde.' 
            };
        }
    }

    static async delete(id) {
        try {
            // Usar la API para eliminar (soft delete)
            await ApiClient.delete(`/medico/${id}`);
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar médico:', error);
            return { 
                success: false, 
                message: error.message || 'Error al eliminar el médico. Intente más tarde.' 
            };
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

    static async getEspecialidades() {
        try {
            const medicos = await this.getAll({ activo: true });
            const especialidades = [...new Set(medicos.map(m => m.especialidad).filter(e => e))];
            return especialidades.sort();
        } catch (error) {
            console.error('Error al obtener especialidades:', error);
            return [];
        }
    }
}

