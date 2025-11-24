// ============================================
// MÓDULO DE NOTIFICACIONES
// ============================================

import { CONFIG } from '../config.js';
import { StorageManager } from './storage.js';

export class NotificationManager {
    static container = null;

    static init() {
        this.createContainer();
    }

    static createContainer() {
        if (document.getElementById('notifications-container')) return;

        const container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        document.body.appendChild(container);
        this.container = container;
    }

    static show(message, type = 'info', duration = CONFIG.UI.NOTIFICATION_DURATION) {
        this.createContainer();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-message">${message}</div>
            <button class="notification-close">&times;</button>
        `;

        this.container.appendChild(notification);

        // Animación de entrada
        setTimeout(() => notification.classList.add('show'), 10);

        // Cerrar al hacer clic
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification);
        });

        // Auto-remover
        if (duration > 0) {
            setTimeout(() => this.remove(notification), duration);
        }

        return notification;
    }

    static remove(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    static success(message, duration) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        return this.show(message, 'info', duration);
    }

    // Guardar notificación en storage
    static saveNotification(userId, message, type) {
        const notifications = StorageManager.get(CONFIG.STORAGE.NOTIFICACIONES) || [];
        notifications.push({
            id: Date.now(),
            userId,
            message,
            type,
            read: false,
            fecha: new Date().toISOString()
        });
        StorageManager.set(CONFIG.STORAGE.NOTIFICACIONES, notifications);
    }

    // Obtener notificaciones del usuario
    static getUserNotifications(userId) {
        const notifications = StorageManager.get(CONFIG.STORAGE.NOTIFICACIONES) || [];
        return notifications.filter(n => n.userId === userId && !n.read);
    }
}

