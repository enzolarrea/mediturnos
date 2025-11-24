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

    static create(medicoData) {
        const medicos = StorageManager.get(CONFIG.STORAGE.MEDICOS) || [];

        // Validar matrícula única
        if (medicos.find(m => m.matricula === medicoData.matricula)) {
            return { success: false, message: 'Ya existe un médico con esta matrícula' };
        }

        const newMedico = {
            id: Date.now(),
            nombre: medicoData.nombre,
            especialidad: medicoData.especialidad,
            matricula: medicoData.matricula,
            horario: medicoData.horario || '',
            email: medicoData.email || '',
            telefono: medicoData.telefono || '',
            activo: true,
            disponibilidad: medicoData.disponibilidad || {},
            fechaCreacion: new Date().toISOString()
        };

        medicos.push(newMedico);
        StorageManager.set(CONFIG.STORAGE.MEDICOS, medicos);

        return { success: true, medico: newMedico };
    }

    static update(id, updates) {
        const medicos = StorageManager.get(CONFIG.STORAGE.MEDICOS) || [];
        const index = medicos.findIndex(m => m.id === parseInt(id));

        if (index === -1) {
            return { success: false, message: 'Médico no encontrado' };
        }

        // Validar matrícula única si se cambia
        if (updates.matricula && updates.matricula !== medicos[index].matricula) {
            const existe = medicos.find(m => m.matricula === updates.matricula && m.id !== parseInt(id));
            if (existe) {
                return { success: false, message: 'Ya existe un médico con esta matrícula' };
            }
        }

        medicos[index] = {
            ...medicos[index],
            ...updates,
            fechaActualizacion: new Date().toISOString()
        };

        StorageManager.set(CONFIG.STORAGE.MEDICOS, medicos);
        return { success: true, medico: medicos[index] };
    }

    static delete(id) {
        const medicos = StorageManager.get(CONFIG.STORAGE.MEDICOS) || [];
        const index = medicos.findIndex(m => m.id === parseInt(id));

        if (index === -1) {
            return { success: false, message: 'Médico no encontrado' };
        }

        // Soft delete
        medicos[index].activo = false;
        StorageManager.set(CONFIG.STORAGE.MEDICOS, medicos);

        return { success: true };
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
        const medicos = this.getAll({ activo: true });
        const especialidades = [...new Set(medicos.map(m => m.especialidad))];
        return especialidades.sort();
    }
}

