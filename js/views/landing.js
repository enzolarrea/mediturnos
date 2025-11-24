// ============================================
// VISTA LANDING - LOGIN Y REGISTRO
// ============================================

import { AuthManager } from '../modules/auth.js';
import { NotificationManager } from '../modules/notifications.js';
import { Router } from '../modules/router.js';
import { StorageManager } from '../modules/storage.js';
import { ApiClient } from '../modules/api.js';
import { FormValidator } from '../components/form.js';

class LandingView {
    constructor() {
        // Asegurar inicialización de storage antes de todo
        StorageManager.init();
        this.init();
    }

    init() {
        this.setupModals();
        this.setupForms();
        this.setupNavigation();
    }

    setupModals() {
        // Funciones globales para modales
        window.openLoginModal = () => {
            const modal = document.getElementById('loginModal');
            if (modal) {
                modal.classList.add('active');
                document.body.classList.add('modal-open');
            }
        };

        window.closeLoginModal = () => {
            const modal = document.getElementById('loginModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        };

        window.openRegisterModal = () => {
            const modal = document.getElementById('registerModal');
            if (modal) {
                modal.classList.add('active');
                document.body.classList.add('modal-open');
                // Configurar formateo cuando se abre el modal
                setTimeout(() => this.setupFormatting(), 100);
            }
        };

        window.closeRegisterModal = () => {
            const modal = document.getElementById('registerModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            }
        };

        window.switchToRegister = () => {
            this.closeLoginModal();
            setTimeout(() => this.openRegisterModal(), 300);
        };

        window.switchToLogin = () => {
            this.closeRegisterModal();
            setTimeout(() => this.openLoginModal(), 300);
        };

        // Cerrar modales al hacer clic fuera
        document.getElementById('loginModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') this.closeLoginModal();
        });

        document.getElementById('registerModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'registerModal') this.closeRegisterModal();
        });
    }

    setupForms() {
        // Formulario de login
        const loginForm = document.querySelector('#loginModal form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e.target);
            });
        }

        // Formulario de registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e.target);
            });
            
            // Configurar formateo automático de DNI y Fecha
            this.setupFormatting();
        }
    }

    setupFormatting() {
        // DNI - Formateo automático
        const dniInput = document.getElementById('regDNI');
        if (dniInput) {
            // Prevenir letras y caracteres no numéricos
            dniInput.addEventListener('keydown', (e) => {
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
                    return false;
                }
            });

            // Formatear en tiempo real
            dniInput.addEventListener('input', (e) => {
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
                
                // Ajustar posición del cursor
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

            // Manejar pegado
            dniInput.addEventListener('paste', (e) => {
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

        // Fecha - Formateo automático
        const fechaInput = document.getElementById('regFecha');
        if (fechaInput) {
            // Prevenir letras y caracteres no numéricos
            fechaInput.addEventListener('keydown', (e) => {
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
                    return false;
                }
            });

            // Formatear en tiempo real
            fechaInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 8) value = value.substring(0, 8);
                
                let formatted = '';
                if (value.length > 0) {
                    if (value.length <= 2) {
                        formatted = value;
                    } else if (value.length <= 4) {
                        formatted = value.substring(0, 2) + '/' + value.substring(2);
                    } else {
                        formatted = value.substring(0, 2) + '/' + value.substring(2, 4) + '/' + value.substring(4);
                    }
                }
                
                const cursorPos = e.target.selectionStart;
                e.target.value = formatted;
                
                // Ajustar posición del cursor
                let newPos = formatted.length;
                if (cursorPos <= 2) {
                    newPos = cursorPos;
                } else if (cursorPos <= 4) {
                    newPos = cursorPos + 1;
                } else {
                    newPos = cursorPos + 2;
                }
                if (newPos > formatted.length) newPos = formatted.length;
                if (formatted[newPos] === '/') newPos++;
                
                e.target.setSelectionRange(newPos, newPos);
            });

            // Validar fecha al perder foco
            fechaInput.addEventListener('blur', (e) => {
                const fecha = e.target.value.trim();
                if (fecha && !this.validateFecha(fecha)) {
                    e.target.classList.add('error');
                    e.target.style.borderColor = 'var(--error)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                } else {
                    e.target.classList.remove('error');
                    e.target.style.borderColor = '';
                    e.target.style.boxShadow = '';
                }
            });

            // Manejar pegado
            fechaInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const numbers = paste.replace(/\D/g, '').substring(0, 8);
                
                let formatted = '';
                if (numbers.length > 0) {
                    if (numbers.length <= 2) {
                        formatted = numbers;
                    } else if (numbers.length <= 4) {
                        formatted = numbers.substring(0, 2) + '/' + numbers.substring(2);
                    } else {
                        formatted = numbers.substring(0, 2) + '/' + numbers.substring(2, 4) + '/' + numbers.substring(4);
                    }
                }
                e.target.value = formatted;
                e.target.setSelectionRange(formatted.length, formatted.length);
            });
        }
    }

    validateFecha(fechaStr) {
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = fechaStr.match(regex);
        
        if (!match) return false;
        
        const dia = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10);
        const anio = parseInt(match[3], 10);
        
        const anioActual = new Date().getFullYear();
        if (anio < 1900 || anio > anioActual) return false;
        if (mes < 1 || mes > 12) return false;
        
        const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        if (mes === 2 && ((anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0))) {
            if (dia < 1 || dia > 29) return false;
        } else {
            if (dia < 1 || dia > diasPorMes[mes - 1]) return false;
        }
        
        const fecha = new Date(anio, mes - 1, dia);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fecha > hoy) return false;
        
        return true;
    }

    async handleLogin(form) {
        const emailInput = form.querySelector('[name="email"]');
        const passwordInput = form.querySelector('[name="password"]');
        
        if (!emailInput || !passwordInput) {
            NotificationManager.error('Error: No se encontraron los campos del formulario');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            NotificationManager.error('Por favor completa todos los campos');
            return;
        }

        // Deshabilitar botón durante la petición
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Iniciando sesión...';
        }

        try {
            // Usar API directamente
            const response = await ApiClient.login(email, password);
            
            if (response.success && response.user) {
                // Guardar usuario en localStorage para compatibilidad
                StorageManager.set('mediturnos_current_user', response.user);
                
                NotificationManager.success('Inicio de sesión exitoso');
                setTimeout(() => {
                    Router.redirectByRole(response.user.rol);
                }, 500);
            } else {
                NotificationManager.error(response.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error en login:', error);
            NotificationManager.error(error.message || 'Error al iniciar sesión');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const userData = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            dni: formData.get('dni'),
            fechaNacimiento: formData.get('fecha_de_nacimiento'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            rol: 'paciente' // Por defecto paciente
        };

        // Validaciones básicas
        if (userData.password !== userData.confirmPassword) {
            NotificationManager.error('Las contraseñas no coinciden');
            return;
        }

        if (userData.password.length < 8) {
            NotificationManager.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        // Deshabilitar botón durante la petición
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton?.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Registrando...';
        }

        try {
            // Convertir fecha de formato DD/MM/YYYY a YYYY-MM-DD
            if (userData.fechaNacimiento) {
                const fechaParts = userData.fechaNacimiento.split('/');
                if (fechaParts.length === 3) {
                    userData.fechaNacimiento = `${fechaParts[2]}-${fechaParts[1]}-${fechaParts[0]}`;
                }
            }

            // Convertir DNI de formato con puntos a solo números
            if (userData.dni) {
                userData.dni = userData.dni.replace(/\./g, '');
            }

            // Preparar datos para la API
            const registerData = {
                nombre: userData.nombre,
                apellido: userData.apellido,
                email: userData.email,
                password: userData.password,
                confirmPassword: userData.confirmPassword,
                rol: userData.rol || 'paciente',
                dni: userData.dni,
                telefono: userData.telefono || '',
                fechaNacimiento: userData.fechaNacimiento,
                direccion: userData.direccion || ''
            };

            // Usar API directamente
            const response = await ApiClient.register(registerData);
            
            if (response.success && response.user) {
                // Guardar usuario en localStorage para compatibilidad
                StorageManager.set('mediturnos_current_user', response.user);
                
                NotificationManager.success('Registro exitoso. Redirigiendo...');
                setTimeout(() => {
                    Router.redirectByRole(response.user.rol);
                }, 1000);
            } else {
                NotificationManager.error(response.message || 'Error al registrar');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            NotificationManager.error(error.message || 'Error al registrar');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    }

    setupNavigation() {
        window.scrollToFeatures = () => {
            const features = document.getElementById('features');
            if (features) {
                features.scrollIntoView({ behavior: 'smooth' });
            }
        };
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new LandingView();
        // Cargar utilidades de debug
        import('../utils/debug.js').then(() => {
            console.log('Utilidades de debug cargadas. Usa checkStorage() o reinitStorage() en la consola.');
        });
    });
} else {
    new LandingView();
    // Cargar utilidades de debug
    import('../utils/debug.js').then(() => {
        console.log('Utilidades de debug cargadas. Usa checkStorage() o reinitStorage() en la consola.');
    });
}

