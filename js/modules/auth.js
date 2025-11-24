// ============================================
// MÓDULO DE AUTENTICACIÓN Y ROLES
// ============================================

import { CONFIG } from '../config.js';
import { StorageManager } from './storage.js';

export class AuthManager {
    static login(email, password) {
        // Asegurar que los datos estén inicializados
        StorageManager.init();
        
        const users = StorageManager.get(CONFIG.STORAGE.USERS) || [];
        
        // Normalizar email (trim y lowercase)
        const normalizedEmail = email.trim().toLowerCase();
        
        const user = users.find(u => {
            const userEmail = (u.email || '').trim().toLowerCase();
            return userEmail === normalizedEmail && 
                   u.password === password && 
                   u.activo !== false;
        });

        if (user) {
            // Remover password antes de guardar
            const { password: _, ...userSafe } = user;
            StorageManager.set(CONFIG.STORAGE.CURRENT_USER, userSafe);
            return { success: true, user: userSafe };
        }

        return { success: false, message: 'Email o contraseña incorrectos' };
    }

    static logout() {
        StorageManager.remove(CONFIG.STORAGE.CURRENT_USER);
    }

    static getCurrentUser() {
        return StorageManager.get(CONFIG.STORAGE.CURRENT_USER);
    }

    static isAuthenticated() {
        return !!this.getCurrentUser();
    }

    static hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const permissions = CONFIG.PERMISSIONS[user.rol] || [];
        return permissions.includes(permission);
    }

    static hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.rol === role;
    }

    static canAccess(permission) {
        return this.isAuthenticated() && this.hasPermission(permission);
    }

    static register(userData) {
        const users = StorageManager.get(CONFIG.STORAGE.USERS) || [];
        
        // Verificar email único
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Este email ya está registrado' };
        }

        // Validar contraseña
        if (userData.password.length < 8) {
            return { success: false, message: 'La contraseña debe tener al menos 8 caracteres' };
        }

        if (userData.password !== userData.confirmPassword) {
            return { success: false, message: 'Las contraseñas no coinciden' };
        }

        const newUser = {
            id: Date.now(),
            ...userData,
            rol: userData.rol || CONFIG.ROLES.PACIENTE,
            activo: true,
            fechaCreacion: new Date().toISOString()
        };

        delete newUser.confirmPassword;

        users.push(newUser);
        StorageManager.set(CONFIG.STORAGE.USERS, users);

        // Si es paciente, crear registro de paciente
        if (newUser.rol === CONFIG.ROLES.PACIENTE) {
            const pacientes = StorageManager.get(CONFIG.STORAGE.PACIENTES) || [];
            pacientes.push({
                id: Date.now() + 1,
                nombre: newUser.nombre,
                apellido: newUser.apellido,
                dni: newUser.dni || '',
                telefono: newUser.telefono || '',
                email: newUser.email,
                fechaNacimiento: newUser.fechaNacimiento || '',
                direccion: newUser.direccion || '',
                ultimaVisita: null,
                activo: true
            });
            StorageManager.set(CONFIG.STORAGE.PACIENTES, pacientes);
        }

        return { success: true, user: newUser };
    }
}

