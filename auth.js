// Sistema de Autenticación para MediTurnos
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.loadUserFromStorage();
        this.setupAuthStateListener();
        this.checkAuthOnPageLoad();
    }

    // Cargar usuario desde localStorage
    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem('mediturnos_user');
            if (userData) {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
                console.log('Usuario cargado desde storage:', this.currentUser.name);
            }
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            this.logout();
        }
    }

    // Guardar usuario en localStorage
    saveUserToStorage(user) {
        try {
            localStorage.setItem('mediturnos_user', JSON.stringify(user));
            this.currentUser = user;
            this.isAuthenticated = true;
        } catch (error) {
            console.error('Error al guardar usuario:', error);
        }
    }

    // Limpiar datos de usuario
    clearUserStorage() {
        localStorage.removeItem('mediturnos_user');
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // Login
    async login(email, password) {
        try {
            // Simulación de autenticación
            // En una implementación real, aquí se haría una llamada al servidor
            const mockUsers = [
                {
                    id: 1,
                    name: 'Dr. Admin',
                    email: 'admin@mediturnos.com',
                    password: 'admin123',
                    role: 'administrator',
                    clinic: 'Clínica Central',
                    avatar: null,
                    lastLogin: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Dra. María López',
                    email: 'maria@mediturnos.com',
                    password: 'doctor123',
                    role: 'doctor',
                    clinic: 'Consultorio López',
                    specialty: 'Cardiología',
                    avatar: null,
                    lastLogin: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Lic. Carlos Ruiz',
                    email: 'carlos@mediturnos.com',
                    password: 'secretary123',
                    role: 'secretary',
                    clinic: 'Consultorio López',
                    avatar: null,
                    lastLogin: new Date().toISOString()
                }
            ];

            // Buscar usuario entre los mockUsers y los usuarios almacenados
            const storedUsers = this.getStoredUsers();
            const allUsers = mockUsers.concat(storedUsers || []);

            const user = allUsers.find(u => u.email === email && u.password === password);
            
            if (!user) {
                throw new Error('Credenciales inválidas');
            }

            // Crear sesión de usuario (sin password)
            // Normalizar nombre (algunos registros usan "nombre" + "apellido")
            const resolvedName = user.name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email;

            const sessionUser = {
                id: user.id || null,
                name: resolvedName,
                email: user.email,
                role: user.role || 'doctor',
                clinic: user.clinic,
                specialty: user.specialty,
                avatar: user.avatar,
                lastLogin: new Date().toISOString(),
                loginTime: new Date().toISOString()
            };

            this.saveUserToStorage(sessionUser);
            this.updateLastLogin(user.id, sessionUser.lastLogin);
            
            console.log('Login exitoso:', sessionUser.name);
            return { success: true, user: sessionUser };

        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: error.message };
        }
    }

    // Registro
    async register(userData) {
        try {
            // Validaciones básicas
            if (!userData.name || !userData.email || !userData.password) {
                throw new Error('Todos los campos son obligatorios');
            }

            if (userData.password !== userData.confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }

            // Validación de complejidad de contraseña: mínimo 8, máximo 32, al menos una mayúscula y un número
            const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{8,32}$/;
            if (!pwdRegex.test(userData.password)) {
                throw new Error('La contraseña debe tener entre 8 y 32 caracteres, incluir al menos una letra mayúscula y un número');
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('Formato de email inválido');
            }

            // Verificar si el email ya existe
            const existingUsers = this.getStoredUsers();
            if (existingUsers.some(u => u.email === userData.email)) {
                throw new Error('Este email ya está registrado');
            }

            // Crear nuevo usuario
            const newUser = {
                id: Date.now(),
                name: userData.name,
                email: userData.email,
                password: userData.password, // En producción, esto debería estar hasheado
                role: userData.role || 'doctor',
                clinic: userData.clinic || 'Nuevo Consultorio',
                specialty: userData.specialty || 'Medicina General',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            // Guardar usuario
            const users = this.getStoredUsers();
            users.push(newUser);
            localStorage.setItem('mediturnos_users', JSON.stringify(users));

            // Crear sesión
            const sessionUser = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                clinic: newUser.clinic,
                specialty: newUser.specialty,
                avatar: newUser.avatar,
                lastLogin: new Date().toISOString(),
                loginTime: new Date().toISOString()
            };

            this.saveUserToStorage(sessionUser);
            
            console.log('Registro exitoso:', sessionUser.name);
            return { success: true, user: sessionUser };

        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout
    logout() {
        console.log('Iniciando proceso de logout...');
        
        // Mostrar información del usuario actual
        if (this.currentUser) {
            console.log('Cerrando sesión para:', this.currentUser.name);
        }
        
        // Limpiar datos de sesión
        this.clearUserStorage();
        console.log('Usuario deslogueado exitosamente');
        
        // Redirigir a la landing page
        console.log('Redirigiendo a landing page...');
        window.location.href = 'landing.html';
    }

    // Obtener usuarios almacenados
    getStoredUsers() {
        try {
            // Leer desde la clave principal y desde la clave usada por el archivo legacy `register.js`
            const usersA = localStorage.getItem('mediturnos_users');
            const usersB = localStorage.getItem('users');

            const parsedA = usersA ? JSON.parse(usersA) : [];
            const parsedB = usersB ? JSON.parse(usersB) : [];

            // Normalizar usuarios provenientes de `users` (pueden usar `nombre`/`apellido`)
            const normalizedB = parsedB.map(u => ({
                id: u.id || null,
                name: u.name || `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.email,
                email: u.email,
                password: u.password,
                role: u.role || 'doctor',
                clinic: u.clinic,
                specialty: u.specialty,
                avatar: u.avatar,
                createdAt: u.createdAt,
                lastLogin: u.lastLogin
            }));

            return parsedA.concat(normalizedB);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return [];
        }
    }

    // Actualizar último login
    updateLastLogin(userId, loginTime) {
        try {
            const users = this.getStoredUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex].lastLogin = loginTime;
                localStorage.setItem('mediturnos_users', JSON.stringify(users));
            }
        } catch (error) {
            console.error('Error al actualizar último login:', error);
        }
    }

    // Verificar si el usuario está autenticado
    isLoggedIn() {
        return this.isAuthenticated && this.currentUser !== null;
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Verificar permisos de usuario
    hasPermission(permission) {
        if (!this.isLoggedIn()) return false;

        const permissions = {
            administrator: ['all'],
            doctor: ['view_appointments', 'edit_appointments', 'view_patients', 'edit_patients'],
            secretary: ['view_appointments', 'edit_appointments', 'view_patients', 'edit_patients', 'manage_schedule']
        };

        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }

    // Redirigir a login
    redirectToLogin() {
        const currentPage = window.location.pathname;
        if (currentPage !== '/landing.html' && currentPage !== '/index.html') {
            window.location.href = 'landing.html';
        }
    }

    // Redirigir al dashboard
    redirectToDashboard() {
        window.location.href = 'index.html';
    }

    // Configurar listener de estado de autenticación
    setupAuthStateListener() {
        // Verificar autenticación cada 5 minutos
        setInterval(() => {
            if (this.isLoggedIn()) {
                const loginTime = new Date(this.currentUser.loginTime);
                const now = new Date();
                const sessionTimeout = 8 * 60 * 60 * 1000; // 8 horas

                if (now - loginTime > sessionTimeout) {
                    console.log('Sesión expirada');
                    this.logout();
                }
            }
        }, 5 * 60 * 1000);
    }

    // Verificar autenticación al cargar la página
    checkAuthOnPageLoad() {
        const currentPage = window.location.pathname;
        
        // Solo verificar autenticación en index.html, no en landing.html
        if (currentPage.includes('index.html')) {
            if (!this.isLoggedIn()) {
                console.log('Usuario no autenticado, redirigiendo a login');
                this.redirectToLogin();
            } else {
                console.log('Usuario autenticado:', this.currentUser.name);
                this.updateUserInterface();
            }
        } else if (currentPage.includes('landing.html')) {
            console.log('Landing page - no se requiere autenticación');
        }
    }

    // Actualizar interfaz de usuario
    updateUserInterface() {
        if (!this.isLoggedIn()) return;

        // Actualizar información del usuario en el sidebar
        const userNameElement = document.querySelector('.user-name');
        const userRoleElement = document.querySelector('.user-role');
        
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.name;
        }
        
        if (userRoleElement) {
            const roleNames = {
                administrator: 'Administrador',
                doctor: 'Médico',
                secretary: 'Secretaria'
            };
            userRoleElement.textContent = roleNames[this.currentUser.role] || this.currentUser.role;
        }

        // Actualizar avatar si existe
        const userAvatarElement = document.querySelector('.user-avatar');
        if (userAvatarElement && this.currentUser.avatar) {
            userAvatarElement.innerHTML = `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}">`;
        }

        // Mostrar/ocultar elementos según permisos
        this.updatePermissions();
    }

    // Actualizar permisos en la interfaz
    updatePermissions() {
        if (!this.isLoggedIn()) return;

        // Ejemplo: ocultar sección de reportes si no es administrador
        const reportsSection = document.querySelector('[data-section="reports"]');
        if (reportsSection && !this.hasPermission('view_reports')) {
            reportsSection.style.display = 'none';
        }

        // Actualizar botones según permisos
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        if (newAppointmentBtn && !this.hasPermission('edit_appointments')) {
            newAppointmentBtn.style.display = 'none';
        }
    }

    // Cambiar contraseña
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.isLoggedIn()) {
                throw new Error('Usuario no autenticado');
            }

            const users = this.getStoredUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            
            if (userIndex === -1) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña actual
            if (users[userIndex].password !== currentPassword) {
                throw new Error('Contraseña actual incorrecta');
            }

            // Actualizar contraseña
            users[userIndex].password = newPassword;
            localStorage.setItem('mediturnos_users', JSON.stringify(users));

            console.log('Contraseña actualizada exitosamente');
            return { success: true };

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            return { success: false, error: error.message };
        }
    }

    // Actualizar perfil
    async updateProfile(profileData) {
        try {
            if (!this.isLoggedIn()) {
                throw new Error('Usuario no autenticado');
            }

            const users = this.getStoredUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            
            if (userIndex === -1) {
                throw new Error('Usuario no encontrado');
            }

            // Actualizar datos del usuario
            Object.keys(profileData).forEach(key => {
                if (key !== 'password' && key !== 'id') {
                    users[userIndex][key] = profileData[key];
                }
            });

            localStorage.setItem('mediturnos_users', JSON.stringify(users));

            // Actualizar usuario actual
            Object.keys(profileData).forEach(key => {
                if (key !== 'password' && key !== 'id') {
                    this.currentUser[key] = profileData[key];
                }
            });

            this.saveUserToStorage(this.currentUser);
            this.updateUserInterface();

            console.log('Perfil actualizado exitosamente');
            return { success: true };

        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            return { success: false, error: error.message };
        }
    }
}

// Crear instancia global del gestor de autenticación
window.authManager = new AuthManager();

// Funciones globales para compatibilidad
window.login = function(email, password) {
    return window.authManager.login(email, password);
};

window.logout = function() {
    return window.authManager.logout();
};

window.register = function(userData) {
    return window.authManager.register(userData);
};

window.getCurrentUser = function() {
    return window.authManager.getCurrentUser();
};

window.isLoggedIn = function() {
    return window.authManager.isLoggedIn();
};

window.hasPermission = function(permission) {
    return window.authManager.hasPermission(permission);
};

// Inicializar usuarios de ejemplo si no existen
document.addEventListener('DOMContentLoaded', function() {
    const existingUsers = window.authManager.getStoredUsers();
    
    if (existingUsers.length === 0) {
        const defaultUsers = [
            {
                id: 1,
                name: 'Dr. Admin',
                email: 'admin@mediturnos.com',
                password: 'admin123',
                role: 'administrator',
                clinic: 'Clínica Central',
                specialty: 'Administración',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Dra. María López',
                email: 'maria@mediturnos.com',
                password: 'doctor123',
                role: 'doctor',
                clinic: 'Consultorio López',
                specialty: 'Cardiología',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Lic. Carlos Ruiz',
                email: 'carlos@mediturnos.com',
                password: 'secretary123',
                role: 'secretary',
                clinic: 'Consultorio López',
                specialty: 'Secretaría',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            }
        ];

        localStorage.setItem('mediturnos_users', JSON.stringify(defaultUsers));
        console.log('Usuarios de ejemplo creados');
    }
});
