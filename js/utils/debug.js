// ============================================
// UTILIDADES DE DEBUG Y VERIFICACIÓN
// ============================================

import { CONFIG } from '../config.js';
import { StorageManager } from '../modules/storage.js';

export class DebugUtils {
    static checkStorage() {
        console.log('=== VERIFICACIÓN DE STORAGE ===');
        
        const users = StorageManager.get(CONFIG.STORAGE.USERS);
        console.log('Usuarios:', users);
        console.log('Cantidad de usuarios:', users ? users.length : 0);
        
        if (users && users.length > 0) {
            console.log('Usuarios disponibles:');
            users.forEach(u => {
                console.log(`- ${u.email} (${u.rol}) - Activo: ${u.activo}`);
            });
        } else {
            console.warn('⚠️ No hay usuarios en el sistema');
        }
        
        const medicos = StorageManager.get(CONFIG.STORAGE.MEDICOS);
        console.log('Médicos:', medicos ? medicos.length : 0);
        
        const pacientes = StorageManager.get(CONFIG.STORAGE.PACIENTES);
        console.log('Pacientes:', pacientes ? pacientes.length : 0);
        
        return {
            users: users || [],
            medicos: medicos || [],
            pacientes: pacientes || []
        };
    }

    static reinitStorage() {
        console.log('=== REINICIALIZANDO STORAGE ===');
        
        // Limpiar todo
        Object.values(CONFIG.STORAGE).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Reinicializar
        StorageManager.init();
        
        console.log('✅ Storage reinicializado');
        this.checkStorage();
    }

    static testLogin(email, password) {
        console.log(`=== PROBANDO LOGIN: ${email} ===`);
        
        const users = StorageManager.get(CONFIG.STORAGE.USERS) || [];
        const user = users.find(u => u.email === email);
        
        if (!user) {
            console.error('❌ Usuario no encontrado');
            return false;
        }
        
        console.log('Usuario encontrado:', {
            email: user.email,
            password: user.password,
            passwordMatch: user.password === password,
            activo: user.activo,
            rol: user.rol
        });
        
        if (user.password === password && user.activo !== false) {
            console.log('✅ Credenciales correctas');
            return true;
        } else {
            console.error('❌ Credenciales incorrectas o usuario inactivo');
            return false;
        }
    }
}

// Hacer disponible globalmente para debugging
window.DebugUtils = DebugUtils;
window.reinitStorage = () => DebugUtils.reinitStorage();
window.checkStorage = () => DebugUtils.checkStorage();
window.testLogin = (email, password) => DebugUtils.testLogin(email, password);

