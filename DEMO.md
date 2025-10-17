# Demo de MediTurnos - Guía de Uso

## 🚀 Inicio Rápido

### 1. Acceder al Sistema
1. Abre `landing.html` en tu navegador
2. Aparece la página de inicio profesional con información del sistema
3. Haz clic en "Iniciar Sesión" o "Registrarse"

### 2. Usar Credenciales de Prueba
**Opción A: Login con usuario existente**
- Email: `admin@mediturnos.com`
- Contraseña: `admin123`

**Opción B: Crear nueva cuenta**
- Haz clic en "Registrarse"
- Completa el formulario con tus datos
- El sistema te asignará el rol de "Médico" por defecto

### 3. Acceder al Dashboard
Después del login exitoso, serás redirigido automáticamente al dashboard principal.

## 📊 Dashboard Principal

### Estadísticas en Tiempo Real
- **Turnos Hoy**: Número de citas programadas para hoy
- **Pacientes**: Total de pacientes registrados
- **Médicos**: Cantidad de médicos en el sistema

### Próximos Turnos
- Lista de los próximos 3 turnos
- Información del paciente y médico
- Estado de confirmación

### Mini Calendario
- Vista del mes actual
- Días con turnos marcados con punto rojo
- Navegación entre meses

## 🗓️ Gestión de Turnos

### Crear Nuevo Turno
1. Haz clic en "Nuevo Turno" (botón azul en el header)
2. Completa el formulario:
   - **Paciente**: Selecciona de la lista existente
   - **Médico**: Elige el profesional
   - **Fecha**: Selecciona la fecha (no puede ser pasada)
   - **Hora**: Elige de los horarios disponibles
   - **Motivo**: Describe el motivo de la consulta
3. Haz clic en "Guardar Turno"

### Filtrar Turnos
- **Fecha**: Filtra por fecha específica
- **Médico**: Muestra turnos de un médico específico
- **Estado**: Filtra por confirmado, pendiente, cancelado

### Gestionar Turnos Existentes
- **Editar**: Haz clic en el ícono de edición
- **Cancelar**: Haz clic en el ícono de X (se pedirá confirmación)

## 👥 Gestión de Pacientes

### Vista de Pacientes
- Tarjetas con información básica de cada paciente
- DNI, teléfono, última visita
- Acciones rápidas disponibles

### Acciones Disponibles
- **Ver Historial**: Accede al historial médico completo
- **Editar**: Modifica información del paciente
- **Nuevo Turno**: Crea una cita directamente

## 👨‍⚕️ Gestión de Médicos

### Información del Médico
- Nombre y especialidad
- Número de matrícula
- Horario de trabajo
- Estado actual (Disponible/Ocupado/Fuera de línea)

### Estados en Tiempo Real
- **Verde**: Disponible para nuevos turnos
- **Amarillo**: Ocupado con paciente
- **Gris**: Fuera de línea

## 📈 Reportes y Estadísticas

### Reportes Disponibles
- **Turnos por Mes**: Gráfico de consultas mensuales
- **Especialidades**: Distribución por especialidad médica
- **Horarios**: Picos de demanda por hora

### Exportar Datos
- Botón "Exportar PDF" para reportes
- Datos en formato CSV para análisis
- Estadísticas de ingresos


## 📱 Uso en Dispositivos Móviles

### Funcionalidades Responsive
- **Sidebar colapsable**: En móviles se convierte en menú hamburguesa
- **Tablas adaptables**: Scroll horizontal en tablas
- **Botones táctiles**: Optimizados para touch
- **Navegación simplificada**: Menús adaptados a pantallas pequeñas

### Acceso Móvil
- Abre `landing.html` en tu móvil
- La interfaz se adapta automáticamente
- Todas las funcionalidades están disponibles

## 🎯 Casos de Uso Comunes

### Caso 1: Consultorio Nuevo
1. **Registro**: Crea cuenta como administrador
2. **Médicos**: Agrega médicos y sus especialidades
3. **Horarios**: Configura horarios de trabajo
4. **Pacientes**: Registra pacientes iniciales
5. **Turnos**: Programa las primeras citas

### Caso 2: Día Típico de Trabajo
1. **Revisar Dashboard**: Ver turnos del día
2. **Confirmar Citas**: Llamar a pacientes pendientes
3. **Gestionar Cambios**: Mover o cancelar turnos
4. **Nuevos Turnos**: Programar consultas futuras
5. **Reportes**: Revisar estadísticas del día

### Caso 3: Gestión de Paciente Frecuente
1. **Buscar Paciente**: Usar barra de búsqueda
2. **Ver Historial**: Revisar consultas anteriores
3. **Nuevo Turno**: Programar seguimiento
4. **Notas**: Agregar observaciones importantes

## 🔧 Personalización

### Cambiar Configuración
1. Edita `config.js` para modificar:
   - Horarios de trabajo
   - Especialidades médicas
   - Formatos de fecha
   - Colores del sistema

### Agregar Datos de Prueba
```javascript
// En la consola del navegador:
loadDemo();        // Cargar datos de ejemplo
clearDemo();       // Limpiar todos los datos
generateRandom(50); // Generar 50 registros aleatorios
```

### Personalizar Apariencia
- Modifica variables CSS en `styles.css`
- Cambia colores en la sección `:root`
- Ajusta espaciado y tipografía

## 🚨 Solución de Problemas

### Problemas Comunes

#### No puedo iniciar sesión
- Verifica que el email y contraseña sean correctos
- Usa las credenciales de prueba: admin@mediturnos.com / admin123
- Revisa la consola del navegador para errores

#### Los datos no se guardan
- Verifica que localStorage esté habilitado
- No uses modo incógnito (puede bloquear localStorage)
- Refresca la página y vuelve a intentar

#### La interfaz se ve mal
- Asegúrate de que todos los archivos CSS estén cargados
- Verifica que tengas conexión a internet (para Font Awesome y Google Fonts)
- Prueba en un navegador diferente

### Datos de Prueba
Si necesitas resetear el sistema:
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. Borra todos los datos de localStorage
4. Refresca la página