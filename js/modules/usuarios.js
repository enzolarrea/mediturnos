// ============================================
// MÓDULO DE GESTIÓN DE USUARIOS
// ============================================

import { CONFIG } from '../config.js';
import { StorageManager } from './storage.js';
import { AuthManager } from './auth.js';

export class UsuariosManager {
    static getAll(filters = {}) {
        let usuarios = StorageManager.get(CONFIG.STORAGE.USERS) || [];

        // Remover passwords
        usuarios = usuarios.map(u => {
            const { password, ...userSafe } = u;
            return userSafe;
        });

        if (filters.rol) {
            usuarios = usuarios.filter(u => u.rol === filters.rol);
        }

        if (filters.activo !== undefined) {
            usuarios = usuarios.filter(u => u.activo === filters.activo);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            usuarios = usuarios.filter(u => 
                u.nombre.toLowerCase().includes(search) ||
                u.apellido.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search)
            );
        }

        return usuarios;
    }

    static getById(id) {
        const usuarios = this.getAll();
        return usuarios.find(u => u.id === parseInt(id));
    }

    static create(userData) {
        const usuarios = StorageManager.get(CONFIG.STORAGE.USERS) || [];

        // Validar email único
        if (usuarios.find(u => u.email === userData.email)) {
            return { success: false, message: 'Este email ya está registrado' };
        }

        // Validar contraseña
        if (!userData.password || userData.password.length < 8) {
            return { success: false, message: 'La contraseña debe tener al menos 8 caracteres' };
        }

        const newUser = {
            id: Date.now(),
            nombre: userData.nombre,
            apellido: userData.apellido,
            email: userData.email,
            password: userData.password,
            rol: userData.rol || CONFIG.ROLES.PACIENTE,
            activo: true,
            fechaCreacion: new Date().toISOString()
        };

        // Si tiene médicoId o pacienteId
        if (userData.medicoId) newUser.medicoId = parseInt(userData.medicoId);
        if (userData.pacienteId) newUser.pacienteId = parseInt(userData.pacienteId);

        usuarios.push(newUser);
        StorageManager.set(CONFIG.STORAGE.USERS, usuarios);

        const { password, ...userSafe } = newUser;
        return { success: true, user: userSafe };
    }

    static update(id, updates) {
        const usuarios = StorageManager.get(CONFIG.STORAGE.USERS) || [];
        const index = usuarios.findIndex(u => u.id === parseInt(id));

        if (index === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        // Validar email único si se cambia
        if (updates.email && updates.email !== usuarios[index].email) {
            const existe = usuarios.find(u => u.email === updates.email && u.id !== parseInt(id));
            if (existe) {
                return { success: false, message: 'Este email ya está registrado' };
            }
        }

        // Si se actualiza la contraseña
        if (updates.password) {
            if (updates.password.length < 8) {
                return { success: false, message: 'La contraseña debe tener al menos 8 caracteres' };
            }
        }

        usuarios[index] = {
            ...usuarios[index],
            ...updates,
            fechaActualizacion: new Date().toISOString()
        };

        StorageManager.set(CONFIG.STORAGE.USERS, usuarios);

        const { password, ...userSafe } = usuarios[index];
        return { success: true, user: userSafe };
    }

    static delete(id) {
        const usuarios = StorageManager.get(CONFIG.STORAGE.USERS) || [];
        const index = usuarios.findIndex(u => u.id === parseInt(id));

        if (index === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        // No permitir eliminar el último admin
        if (usuarios[index].rol === CONFIG.ROLES.ADMIN) {
            const admins = usuarios.filter(u => u.rol === CONFIG.ROLES.ADMIN && u.activo);
            if (admins.length === 1) {
                return { success: false, message: 'No se puede eliminar el último administrador' };
            }
        }

        // Soft delete
        usuarios[index].activo = false;
        StorageManager.set(CONFIG.STORAGE.USERS, usuarios);

        return { success: true };
    }

    static changePassword(id, oldPassword, newPassword) {
        const usuarios = StorageManager.get(CONFIG.STORAGE.USERS) || [];
        const index = usuarios.findIndex(u => u.id === parseInt(id));

        if (index === -1) {
            return { success: false, message: 'Usuario no encontrado' };
        }

        if (usuarios[index].password !== oldPassword) {
            return { success: false, message: 'Contraseña actual incorrecta' };
        }

        if (newPassword.length < 8) {
            return { success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres' };
        }

        usuarios[index].password = newPassword;
        StorageManager.set(CONFIG.STORAGE.USERS, usuarios);

        return { success: true };
    }
}

