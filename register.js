// Formateo automático y validación en tiempo real para los campos DNI y Fecha
(function setupMasks() {
    const dniEl = document.getElementById('regDNI');
    const fechaEl = document.getElementById('regFecha');

    function formatDNI(value) {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        if (digits.length <= 2) return digits;
        if (digits.length <= 5) return digits.slice(0, 2) + '.' + digits.slice(2);
        return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5);
    }

    function formatDate(value) {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        if (digits.length <= 2) return digits;
        if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    }

    if (dniEl) {
        dniEl.addEventListener('input', (e) => {
            const before = e.target.value;
            e.target.value = formatDNI(before);
            try { e.target.setSelectionRange(e.target.value.length, e.target.value.length); } catch (err) {}
        });

        dniEl.addEventListener('keydown', (e) => {
            // Permitir teclas de control
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
            if (allowed.includes(e.key)) return;
            // Permitir números y teclado numérico
            if (/^[0-9]$/.test(e.key)) return;
            // bloquear cualquier otra tecla (letras, símbolos)
            e.preventDefault();
        });

        // evitar pegar texto no numérico
        dniEl.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const digits = (paste || '').replace(/\D/g, '').slice(0,8);
            e.target.value = formatDNI(digits);
        });
    }

    if (fechaEl) {
        fechaEl.addEventListener('input', (e) => {
            const before = e.target.value;
            e.target.value = formatDate(before);
            try { e.target.setSelectionRange(e.target.value.length, e.target.value.length); } catch (err) {}
        });

        fechaEl.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
            if (allowed.includes(e.key)) return;
            // permitir números
            if (/^[0-9]$/.test(e.key)) return;
            // permitir '/' por si el usuario lo escribe
            if (e.key === '/') return;
            e.preventDefault();
        });

        fechaEl.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const digits = (paste || '').replace(/\D/g, '').slice(0,8);
            e.target.value = formatDate(digits);
        });
    }
})();

document.getElementById("registerForm").addEventListener("submit", handleRegister);

async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;

    const nombre = form.nombre.value.trim();
    const apellido = form.apellido.value.trim();
    const dni = form.dni.value.trim();
    const fecha = form.fecha_de_nacimiento.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (!nombre || !apellido || !dni || !fecha || !email || !password || !confirmPassword) {
        alert("Por favor complete todos los campos");
        return;
    }

    // Validación de contraseña: mínimo 8, máximo 32, al menos una mayúscula y un número
    const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{8,32}$/;
    if (!pwdRegex.test(password)) {
        alert('La contraseña debe tener entre 8 y 32 caracteres, incluir al menos una letra mayúscula y un número.');
        return;
    }

    if (!/^[0-9]+$/.test(dni)) {
        // aceptar DNI formateado (con puntos), validar que contenga 8 dígitos
        const rawDni = dni.replace(/\D/g, '');
        if (!/^\d{8}$/.test(rawDni)) {
            alert("El DNI debe contener 8 números en formato xx.xxx.xxx");
            return;
        }
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        alert("La fecha debe tener el formato dd/mm/yyyy");
        return;
    }
    
    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    const userData = {
        name: `${nombre} ${apellido}`.trim(),
        nombre: nombre,
        apellido: apellido,
        dni: dni,
        fecha_de_nacimiento: fecha,
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        role: 'doctor'
    };

    // Si existe authManager, usar su registro centralizado
    if (window.authManager && typeof window.authManager.register === 'function') {
        try {
            const result = await window.authManager.register(userData);
            if (result.success) {
                alert('Registro exitoso. Ahora puedes iniciar sesión.');
                form.reset();
                // Cerrar modal si existe la función
                if (typeof closeRegisterModal === 'function') closeRegisterModal();
            } else {
                alert(result.error || 'Error al registrar la cuenta');
            }
        } catch (err) {
            console.error('Error al registrar con authManager:', err);
            alert('Error al registrar la cuenta: ' + err.message);
        }
        return;
    }

    // Fallback: comportamiento legacy que almacenaba en localStorage bajo "users"
    let users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find(user => user.email === email)) {
        alert("Ya existe una cuenta con este correo");
        return;
    }

    const newUser = {
        nombre,
        apellido,
        dni,
        fecha,
        email,
        password
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registro exitoso. Ahora puedes iniciar sesión.");

    form.reset();

    if (typeof toggleForms === "function") {
        toggleForms();
    }
}
