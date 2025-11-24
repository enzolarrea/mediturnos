// ============================================
// MÓDULO DE CLIENTE API
// Usa rutas absolutas para evitar problemas con rutas relativas
// ============================================

/**
 * Obtener la URL base de la API de forma dinámica
 * Funciona desde cualquier ubicación del proyecto
 */
function getApiBaseUrl() {
    // Detectar la ruta base del proyecto
    const path = window.location.pathname;
    
    // Si estamos en /mediturnos/views/paciente/landing.html
    // o en /mediturnos/landing.html
    // la base siempre será /mediturnos/api
    if (path.includes('/mediturnos/')) {
        return '/mediturnos/api';
    }
    
    // Fallback: usar la ruta absoluta estándar
    return '/mediturnos/api';
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Cliente API para comunicarse con el backend PHP
 */
export class ApiClient {
    /**
     * Realizar petición HTTP
     */
    static async request(endpoint, options = {}) {
        // Construir URL absoluta
        const url = endpoint.startsWith('http') 
            ? endpoint 
            : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        
        const defaultOptions = {
            credentials: 'include', // Incluir cookies de sesión
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        // Si hay body, convertir a JSON
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            // Manejar errores de red
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ 
                    message: `Error ${response.status}: ${response.statusText}` 
                }));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const data = await response.json();
            
            // Verificar si la respuesta indica error
            if (data.success === false) {
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('Error en petición API:', error);
            console.error('URL intentada:', url);
            throw error;
        }
    }

    /**
     * GET request
     */
    static async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(fullEndpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    static async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    /**
     * PUT request
     */
    static async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * DELETE request
     */
    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ============================================
    // ENDPOINTS DE AUTENTICACIÓN
    // ============================================

    static async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        return response;
    }

    static async register(userData) {
        const response = await this.post('/auth/register', userData);
        return response;
    }

    static async logout() {
        const response = await this.post('/auth/logout');
        return response;
    }

    static async getCurrentUser() {
        const response = await this.get('/auth/me');
        return response.user;
    }

    // ============================================
    // ENDPOINTS DE TURNOS
    // ============================================

    static async getTurnos(filters = {}) {
        const response = await this.get('/turno', filters);
        return Array.isArray(response.data) ? response.data : response;
    }

    static async getTurno(id) {
        const response = await this.get(`/turno/${id}`);
        return response.turno;
    }

    static async createTurno(turnoData) {
        const response = await this.post('/turno', turnoData);
        return response.turno;
    }

    static async updateTurno(id, turnoData) {
        const response = await this.put(`/turno/${id}`, turnoData);
        return response.turno;
    }

    static async cancelTurno(id) {
        return this.delete(`/turno/${id}`);
    }

    static async getTurnosDelDia(fecha = null) {
        const params = fecha ? { fecha } : {};
        const response = await this.get('/turno/del-dia', params);
        return Array.isArray(response.data) ? response.data : response;
    }

    static async getProximosTurnos(limit = 5) {
        const response = await this.get('/turno/proximos', { limit });
        return Array.isArray(response.data) ? response.data : response;
    }

    static async getEstadisticas(fechaInicio, fechaFin) {
        const response = await this.get('/turno/estadisticas', { fechaInicio, fechaFin });
        return response.data || response;
    }

    // ============================================
    // ENDPOINTS DE MÉDICOS
    // ============================================

    static async getMedicos(filters = {}) {
        const response = await this.get('/medico', filters);
        return Array.isArray(response.data) ? response.data : response;
    }

    static async getMedico(id) {
        const response = await this.get(`/medico/${id}`);
        return response.medico;
    }

    static async getMedicoDisponibilidad(id, fecha) {
        const response = await this.get(`/medico/${id}/disponibilidad`, { fecha });
        return response;
    }

    static async getMedicoHorariosDisponibles(id, fecha) {
        const response = await this.get(`/medico/${id}/horarios-disponibles`, { fecha });
        return Array.isArray(response.data) ? response.data : response;
    }

    // ============================================
    // ENDPOINTS DE PACIENTES
    // ============================================

    static async getPacientes(filters = {}) {
        const response = await this.get('/paciente', filters);
        return Array.isArray(response.data) ? response.data : response;
    }

    static async getPaciente(id) {
        const response = await this.get(`/paciente/${id}`);
        return response.paciente;
    }

    static async getPacienteHistorial(id) {
        const response = await this.get(`/paciente/${id}/historial`);
        return Array.isArray(response.data) ? response.data : response;
    }
}

