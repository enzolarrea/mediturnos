// ============================================
// MEDITURNOS PRO - SISTEMA COMPLETO
// Este archivo asegura que todos los módulos estén cargados
// ============================================

// Cargar todos los componentes necesarios de forma asíncrona
(async () => {
    try {
        const { ModalManager } = await import('./components/modals.js');
        const { NotificationManager } = await import('./modules/notifications.js');
        
        // Hacer disponible globalmente
        window.ModalManager = ModalManager;
        window.NotificationManager = NotificationManager;
        
        console.log('✅ Sistema MediTurnos Pro cargado completamente');
    } catch (error) {
        console.error('Error al cargar módulos:', error);
    }
})();

