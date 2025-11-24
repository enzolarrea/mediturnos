// ============================================
// COMPONENTE DE FORMULARIO CON VALIDACIÓN
// ============================================

export class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.rules = {};
        this.errors = {};
    }

    addRule(fieldName, rule) {
        if (!this.rules[fieldName]) {
            this.rules[fieldName] = [];
        }
        this.rules[fieldName].push(rule);
    }

    validate() {
        this.errors = {};
        let isValid = true;

        Object.keys(this.rules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const value = field.value.trim();
            const fieldErrors = [];

            this.rules[fieldName].forEach(rule => {
                const error = rule(value, field);
                if (error) {
                    fieldErrors.push(error);
                    isValid = false;
                }
            });

            if (fieldErrors.length > 0) {
                this.errors[fieldName] = fieldErrors;
                this.showFieldError(field, fieldErrors[0]);
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remover mensaje anterior
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Agregar mensaje
        const errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        errorEl.textContent = message;
        field.parentElement.appendChild(errorEl);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorEl = field.parentElement.querySelector('.field-error');
        if (errorEl) errorEl.remove();
    }

    clearAllErrors() {
        this.errors = {};
        this.form.querySelectorAll('.error').forEach(field => {
            this.clearFieldError(field);
        });
    }

    // Reglas predefinidas
    static required(value) {
        return value === '' ? 'Este campo es requerido' : null;
    }

    static email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Email inválido' : null;
    }

    static minLength(min) {
        return (value) => {
            return value.length < min ? `Mínimo ${min} caracteres` : null;
        };
    }

    static maxLength(max) {
        return (value) => {
            return value.length > max ? `Máximo ${max} caracteres` : null;
        };
    }

    static pattern(regex, message) {
        return (value) => {
            return !regex.test(value) ? message : null;
        };
    }

    static match(fieldName, message) {
        return (value, field) => {
            const form = field.closest('form');
            const otherField = form.querySelector(`[name="${fieldName}"]`);
            return value !== otherField.value ? message : null;
        };
    }
}

