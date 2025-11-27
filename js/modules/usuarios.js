// ============================================
// MÓDULO DE GESTIÓN DE USUARIOS
// ============================================

import { ApiClient } from './api.js';

export class UsuariosManager {
    static async getAll(filters = {}) {
        try {
            const usuarios = await ApiClient.getUsuarios(filters);
            return usuarios || [];
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return [];
        }
    }

    static async getById(id) {
        try {
            return await ApiClient.getUsuario(id);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return null;
        }
    }

    static async create(userData) {
        try {
            const user = await ApiClient.createUsuario(userData);
            return { success: true, user };
        } catch (error) {
            console.error('Error al crear usuario:', error);
            return { success: false, message: error.message || 'Error al crear usuario' };
        }
    }

    static async update(id, updates) {
        try {
            const user = await ApiClient.updateUsuario(id, updates);
            return { success: true, user };
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            return { success: false, message: error.message || 'Error al actualizar usuario' };
        }
    }

    static async delete(id) {
        try {
            await ApiClient.deleteUsuario(id);
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            return { success: false, message: error.message || 'Error al eliminar usuario' };
        }
    }

    static async changePassword(id, oldPassword, newPassword) {
        try {
            const result = await ApiClient.changeUsuarioPassword(id, oldPassword, newPassword);
            return { success: true, result };
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            return { success: false, message: error.message || 'Error al cambiar contraseña' };
        }
    }
}

