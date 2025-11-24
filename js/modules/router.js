// ============================================
// MÓDULO DE ROUTING
// ============================================

import { AuthManager } from './auth.js';
import { CONFIG } from '../config.js';

export class Router {
    static currentRoute = null;
    static routes = {};

    static init() {
        this.setupRoutes();
        this.handleNavigation();
    }

    static setupRoutes() {
        // Rutas públicas
        this.routes['/'] = 'landing.html';
        this.routes['/landing'] = 'landing.html';
        this.routes['/login'] = 'landing.html';

        // Rutas protegidas por rol
        this.routes['/admin'] = { 
            file: 'views/admin/dashboard.html', 
            role: CONFIG.ROLES.ADMIN 
        };
        this.routes['/secretario'] = { 
            file: 'views/secretario/dashboard.html', 
            role: CONFIG.ROLES.SECRETARIO 
        };
        this.routes['/medico'] = { 
            file: 'views/medico/dashboard.html', 
            role: CONFIG.ROLES.MEDICO 
        };
        this.routes['/paciente'] = { 
            file: 'views/paciente/dashboard.html', 
            role: CONFIG.ROLES.PACIENTE 
        };
    }

    static navigate(path) {
        const user = AuthManager.getCurrentUser();
        
        // Si no está autenticado y trata de acceder a ruta protegida
        if (!user && path !== '/' && path !== '/landing' && path !== '/login') {
            window.location.href = 'landing.html';
            return;
        }

        // Si está autenticado, redirigir según rol
        if (user && (path === '/' || path === '/landing' || path === '/login')) {
            this.redirectByRole(user.rol);
            return;
        }

        // Verificar permisos de ruta
        const route = this.routes[path];
        if (route && route.role) {
            if (!AuthManager.hasRole(route.role)) {
                this.redirectByRole(user.rol);
                return;
            }
        }

        this.currentRoute = path;
    }

    static redirectByRole(rol) {
        // Mapeo de roles a carpetas de vistas
        const roleToFolder = {
            [CONFIG.ROLES.ADMIN]: 'admin',
            [CONFIG.ROLES.SECRETARIO]: 'secretario',
            [CONFIG.ROLES.MEDICO]: 'medico',
            [CONFIG.ROLES.PACIENTE]: 'paciente'
        };

        const folder = roleToFolder[rol];
        if (folder) {
            window.location.href = `views/${folder}/dashboard.html`;
        } else {
            console.error('Rol no reconocido:', rol);
            window.location.href = 'landing.html';
        }
    }

    static handleNavigation() {
        // Manejar navegación del navegador
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname);
        });

        // Interceptar clics en enlaces
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigate(route);
            }
        });
    }

    static getCurrentRoute() {
        return this.currentRoute || window.location.pathname;
    }
}

