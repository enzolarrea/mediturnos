// ============================================
// MEDITURNOS PRO - ARCHIVO PRINCIPAL
// ============================================

import { CONFIG } from './config.js';
import { StorageManager } from './modules/storage.js';
import { AuthManager } from './modules/auth.js';
import { NotificationManager } from './modules/notifications.js';
import { Router } from './modules/router.js';

// Inicializar sistema
class MediTurnosApp {
    constructor() {
        this.init();
    }

    init() {
        // Inicializar storage PRIMERO - esto es crítico
        try {
            StorageManager.init();
            console.log('Storage inicializado correctamente');
        } catch (e) {
            console.error('Error al inicializar storage:', e);
        }

        // Inicializar notificaciones
        NotificationManager.init();

        // Verificar autenticación
        this.checkAuth();

        // Inicializar router
        Router.init();

        // Inicializar UI
        this.initUI();
    }

    checkAuth() {
        const currentPath = window.location.pathname;
        const isLanding = currentPath.includes('landing.html') || currentPath === '/' || currentPath.includes('index.html');
        
        if (isLanding) {
            // Si está en landing y ya está autenticado, redirigir
            if (AuthManager.isAuthenticated()) {
                const user = AuthManager.getCurrentUser();
                Router.redirectByRole(user.rol);
            }
        } else {
            // Si no está en landing y no está autenticado, redirigir a landing
            if (!AuthManager.isAuthenticated()) {
                window.location.href = 'landing.html';
            }
        }
    }

    initUI() {
        // Toggle sidebar en móvil
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Cerrar sidebar al hacer clic fuera en móvil
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // Actualizar nombre de usuario en sidebar
        const user = AuthManager.getCurrentUser();
        if (user) {
            const userName = document.querySelector('.user-name');
            const userRole = document.querySelector('.user-role');
            
            if (userName) {
                userName.textContent = `${user.nombre} ${user.apellido || ''}`.trim();
            }
            
            if (userRole) {
                const roleNames = {
                    [CONFIG.ROLES.ADMIN]: 'Administrador',
                    [CONFIG.ROLES.SECRETARIO]: 'Secretario',
                    [CONFIG.ROLES.MEDICO]: 'Médico',
                    [CONFIG.ROLES.PACIENTE]: 'Paciente'
                };
                userRole.textContent = roleNames[user.rol] || user.rol;
            }
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new MediTurnosApp();
    });
} else {
    window.app = new MediTurnosApp();
}

// Exportar para uso global
window.MediTurnos = {
    CONFIG,
    StorageManager,
    AuthManager,
    NotificationManager,
    Router
};

