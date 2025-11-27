// ============================================
// UTILIDADES DE FORMATEO (DNI, fechas, etc.)
// ============================================

/**
 * Configura el formateo automático de un campo DNI al estilo xx.xxx.xxx
 * - El usuario sólo puede teclear números
 * - El valor visible se muestra con puntos
 * - No normaliza el valor; eso debe hacerse antes de enviar al backend
 * @param {HTMLInputElement} input
 */
export function setupDniFormatter(input) {
    if (!input) return;

    // Evitar registrar dos veces sobre el mismo input
    if (input.dataset.dniFormatterInitialized === 'true') return;
    input.dataset.dniFormatterInitialized = 'true';

    // Prevenir letras y caracteres no numéricos
    input.addEventListener('keydown', (e) => {
        // Permitir teclas de control
        if (e.ctrlKey || e.metaKey ||
            ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            return;
        }
        // Permitir Ctrl+V (se manejará en paste)
        if ((e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey)) {
            return;
        }
        // Solo permitir números
        if (!/^\d$/.test(e.key)) {
            e.preventDefault();
        }
    });

    // Formatear en tiempo real al estilo xx.xxx.xxx
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.substring(0, 8);

        let formatted = '';
        if (value.length > 0) {
            if (value.length <= 2) {
                formatted = value;
            } else if (value.length <= 5) {
                formatted = value.substring(0, 2) + '.' + value.substring(2);
            } else {
                formatted = value.substring(0, 2) + '.' + value.substring(2, 5) + '.' + value.substring(5);
            }
        }

        const cursorPos = e.target.selectionStart;
        e.target.value = formatted;

        // Ajustar posición del cursor (mismo criterio que en landing.js)
        let newPos = formatted.length;
        if (cursorPos <= 2) {
            newPos = cursorPos;
        } else if (cursorPos <= 5) {
            newPos = cursorPos + 1;
        } else {
            newPos = cursorPos + 2;
        }
        if (newPos > formatted.length) newPos = formatted.length;
        if (formatted[newPos] === '.') newPos++;

        e.target.setSelectionRange(newPos, newPos);
    });

    // Manejar pegado: limpiar a números y volver a aplicar formato
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const numbers = paste.replace(/\D/g, '').substring(0, 8);

        let formatted = '';
        if (numbers.length > 0) {
            if (numbers.length <= 2) {
                formatted = numbers;
            } else if (numbers.length <= 5) {
                formatted = numbers.substring(0, 2) + '.' + numbers.substring(2);
            } else {
                formatted = numbers.substring(0, 2) + '.' + numbers.substring(2, 5) + '.' + numbers.substring(5);
            }
        }
        e.target.value = formatted;
        e.target.setSelectionRange(formatted.length, formatted.length);
    });
}

/**
 * Convierte una fecha en formato YYYY-MM-DD (o un objeto Date) a formato DD-MM-YYYY.
 * Si la fecha es inválida o está vacía, devuelve '—'.
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDateToDMY(value) {
    if (!value) return '—';

    let dateObj;

    if (value instanceof Date) {
        dateObj = value;
    } else if (typeof value === 'string') {
        // Esperado: 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss'
        const isoPart = value.split('T')[0];
        const parts = isoPart.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            // Validar groseramente números
            if (year.length === 4 && month.length === 2 && day.length === 2) {
                return `${day}-${month}-${year}`;
            }
        }
        // Fallback: intentar parsear con Date
        dateObj = new Date(value);
    } else {
        return '—';
    }

    if (Number.isNaN(dateObj.getTime())) return '—';

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = String(dateObj.getFullYear());

    return `${day}-${month}-${year}`;
}

/**
 * Formatea el código de estado del turno a un nombre legible
 * @param {string} estadoCodigo - Código del estado (ej: 'en_curso', 'no_asistio')
 * @returns {string} - Nombre formateado (ej: 'En Curso', 'No Asistió')
 */
export function formatEstadoNombre(estadoCodigo) {
    if (!estadoCodigo) return 'Pendiente';
    
    const estados = {
        'pendiente': 'Pendiente',
        'confirmado': 'Confirmado',
        'en_curso': 'En Curso',
        'completado': 'Completado',
        'cancelado': 'Cancelado',
        'no_asistio': 'No Asistió'
    };
    
    return estados[estadoCodigo] || estadoCodigo;
}

