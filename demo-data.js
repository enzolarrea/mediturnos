// Datos de demostración para el Gestor de Turnos Médicos
// Este archivo contiene datos de ejemplo más extensos para demostrar todas las funcionalidades

const DemoData = {
    // Pacientes adicionales para demostración
    additionalPatients: [
        {
            id: 4,
            name: 'Roberto Fernández',
            dni: '45.678.901',
            phone: '(011) 4567-8901',
            email: 'roberto@email.com',
            lastVisit: '20/11/2024',
            birthDate: '1985-03-15',
            address: 'Av. Corrientes 1234, CABA',
            emergencyContact: 'María Fernández - (011) 4567-8902'
        },
        {
            id: 5,
            name: 'Laura Morales',
            dni: '56.789.012',
            phone: '(011) 5678-9012',
            email: 'laura@email.com',
            lastVisit: '18/11/2024',
            birthDate: '1992-07-22',
            address: 'Av. Santa Fe 5678, CABA',
            emergencyContact: 'Carlos Morales - (011) 5678-9013'
        },
        {
            id: 6,
            name: 'Diego Herrera',
            dni: '67.890.123',
            phone: '(011) 6789-0123',
            email: 'diego@email.com',
            lastVisit: '16/11/2024',
            birthDate: '1978-11-08',
            address: 'Av. Rivadavia 9012, CABA',
            emergencyContact: 'Sofia Herrera - (011) 6789-0124'
        },
        {
            id: 7,
            name: 'Valentina Castro',
            dni: '78.901.234',
            phone: '(011) 7890-1234',
            email: 'valentina@email.com',
            lastVisit: '14/11/2024',
            birthDate: '1995-01-30',
            address: 'Av. Callao 3456, CABA',
            emergencyContact: 'Miguel Castro - (011) 7890-1235'
        },
        {
            id: 8,
            name: 'Fernando Rodríguez',
            dni: '89.012.345',
            phone: '(011) 8901-2345',
            email: 'fernando@email.com',
            lastVisit: '12/11/2024',
            birthDate: '1988-09-14',
            address: 'Av. Córdoba 7890, CABA',
            emergencyContact: 'Patricia Rodríguez - (011) 8901-2346'
        }
    ],

    // Médicos adicionales para demostración
    additionalDoctors: [
        {
            id: 4,
            name: 'Dra. Patricia López',
            specialty: 'Ginecología',
            license: '45678',
            schedule: '08:00 - 16:00',
            status: 'disponible',
            experience: '15 años',
            education: 'Universidad de Buenos Aires',
            languages: ['Español', 'Inglés']
        },
        {
            id: 5,
            name: 'Dr. Miguel Torres',
            specialty: 'Traumatología',
            license: '56789',
            schedule: '09:00 - 17:00',
            status: 'ocupado',
            experience: '12 años',
            education: 'Universidad Nacional de La Plata',
            languages: ['Español']
        },
        {
            id: 6,
            name: 'Dra. Sofia Herrera',
            specialty: 'Neurología',
            license: '67890',
            schedule: '08:30 - 16:30',
            status: 'disponible',
            experience: '18 años',
            education: 'Universidad de Buenos Aires',
            languages: ['Español', 'Francés']
        },
        {
            id: 7,
            name: 'Dr. Alejandro Ruiz',
            specialty: 'Oftalmología',
            license: '78901',
            schedule: '09:30 - 18:30',
            status: 'fuera-linea',
            experience: '10 años',
            education: 'Universidad Nacional de Córdoba',
            languages: ['Español', 'Inglés']
        },
        {
            id: 8,
            name: 'Dra. Carmen Vega',
            specialty: 'Psiquiatría',
            license: '89012',
            schedule: '10:00 - 19:00',
            status: 'disponible',
            experience: '20 años',
            education: 'Universidad de Buenos Aires',
            languages: ['Español', 'Portugués']
        }
    ],

    // Turnos adicionales para demostración
    additionalAppointments: [
        {
            id: 4,
            patientId: 4,
            doctorId: 4,
            date: '2024-12-02',
            time: '10:00',
            reason: 'Control ginecológico anual',
            status: 'confirmado',
            createdAt: '2024-11-25T10:30:00Z',
            notes: 'Paciente con antecedentes familiares de cáncer de mama'
        },
        {
            id: 5,
            patientId: 5,
            doctorId: 5,
            date: '2024-12-02',
            time: '11:00',
            reason: 'Dolor en rodilla derecha',
            status: 'pendiente',
            createdAt: '2024-11-26T14:20:00Z',
            notes: 'Lesión deportiva, necesita radiografía'
        },
        {
            id: 6,
            patientId: 6,
            doctorId: 6,
            date: '2024-12-03',
            time: '09:00',
            reason: 'Cefaleas recurrentes',
            status: 'confirmado',
            createdAt: '2024-11-27T09:15:00Z',
            notes: 'Paciente refiere dolor de cabeza desde hace 2 semanas'
        },
        {
            id: 7,
            patientId: 7,
            doctorId: 7,
            date: '2024-12-03',
            time: '14:00',
            reason: 'Revisión de vista',
            status: 'pendiente',
            createdAt: '2024-11-28T16:45:00Z',
            notes: 'Primera consulta oftalmológica'
        },
        {
            id: 8,
            patientId: 8,
            doctorId: 8,
            date: '2024-12-04',
            time: '16:00',
            reason: 'Seguimiento psiquiátrico',
            status: 'confirmado',
            createdAt: '2024-11-29T11:30:00Z',
            notes: 'Control de medicación antidepresiva'
        },
        {
            id: 9,
            patientId: 1,
            doctorId: 1,
            date: '2024-12-05',
            time: '08:30',
            reason: 'Electrocardiograma de control',
            status: 'pendiente',
            createdAt: '2024-11-30T13:20:00Z',
            notes: 'Paciente con arritmia conocida'
        },
        {
            id: 10,
            patientId: 2,
            doctorId: 2,
            date: '2024-12-05',
            time: '15:30',
            reason: 'Biopsia de lunar',
            status: 'confirmado',
            createdAt: '2024-12-01T10:10:00Z',
            notes: 'Lunar sospechoso en brazo izquierdo'
        }
    ],

    // Horarios de ejemplo para diferentes días
    sampleSchedules: {
        '2024-12-02': [
            { time: '08:00', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '08:30', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '09:00', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '09:30', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '10:00', doctorId: 4, patientId: 4, status: 'booked' },
            { time: '10:30', doctorId: 4, patientId: null, status: 'disponible' },
            { time: '11:00', doctorId: 5, patientId: 5, status: 'booked' },
            { time: '11:30', doctorId: 5, patientId: null, status: 'disponible' },
            { time: '12:00', doctorId: null, patientId: null, status: 'break' },
            { time: '12:30', doctorId: null, patientId: null, status: 'break' },
            { time: '13:00', doctorId: null, patientId: null, status: 'break' },
            { time: '13:30', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '14:00', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '14:30', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '15:00', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '15:30', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '16:00', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '16:30', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '17:00', doctorId: 1, patientId: null, status: 'disponible' },
            { time: '17:30', doctorId: 1, patientId: null, status: 'disponible' }
        ]
    },

    // Estadísticas de ejemplo
    sampleStats: {
        monthly: {
            '2024-11': { appointments: 145, patients: 89, revenue: 125000 },
            '2024-10': { appointments: 132, patients: 76, revenue: 118000 },
            '2024-09': { appointments: 158, patients: 94, revenue: 142000 },
            '2024-08': { appointments: 167, patients: 98, revenue: 150000 }
        },
        specialties: [
            { name: 'Cardiología', count: 45, percentage: 25 },
            { name: 'Dermatología', count: 38, percentage: 21 },
            { name: 'Pediatría', count: 32, percentage: 18 },
            { name: 'Ginecología', count: 28, percentage: 16 },
            { name: 'Traumatología', count: 22, percentage: 12 },
            { name: 'Neurología', count: 15, percentage: 8 }
        ],
        hourlyDistribution: [
            { hour: '08:00', count: 12 },
            { hour: '09:00', count: 18 },
            { hour: '10:00', count: 22 },
            { hour: '11:00', count: 25 },
            { hour: '12:00', count: 8 },
            { hour: '13:00', count: 5 },
            { hour: '14:00', count: 15 },
            { hour: '15:00', count: 20 },
            { hour: '16:00', count: 18 },
            { hour: '17:00', count: 12 }
        ]
    },

    // Métodos para cargar datos de demostración
    loadDemoData: function() {
        // Cargar pacientes adicionales
        const existingPatients = JSON.parse(localStorage.getItem('medicalPatients') || '[]');
        const allPatients = [...existingPatients, ...this.additionalPatients];
        localStorage.setItem('medicalPatients', JSON.stringify(allPatients));

        // Cargar médicos adicionales
        const existingDoctors = JSON.parse(localStorage.getItem('medicalDoctors') || '[]');
        const allDoctors = [...existingDoctors, ...this.additionalDoctors];
        localStorage.setItem('medicalDoctors', JSON.stringify(allDoctors));

        // Cargar turnos adicionales
        const existingAppointments = JSON.parse(localStorage.getItem('medicalAppointments') || '[]');
        const allAppointments = [...existingAppointments, ...this.additionalAppointments];
        localStorage.setItem('medicalAppointments', JSON.stringify(allAppointments));

        // Cargar horarios de ejemplo
        localStorage.setItem('medicalSchedules', JSON.stringify(this.sampleSchedules));

        // Cargar estadísticas de ejemplo
        localStorage.setItem('medicalStats', JSON.stringify(this.sampleStats));

        console.log('Datos de demostración cargados exitosamente');
        return true;
    },

    // Método para limpiar datos de demostración
    clearDemoData: function() {
        localStorage.removeItem('medicalPatients');
        localStorage.removeItem('medicalDoctors');
        localStorage.removeItem('medicalAppointments');
        localStorage.removeItem('medicalSchedules');
        localStorage.removeItem('medicalStats');
        console.log('Datos de demostración eliminados');
        return true;
    },

    // Método para generar datos aleatorios
    generateRandomData: function(count = 10) {
        const randomPatients = [];
        const randomDoctors = [];
        const randomAppointments = [];

        const names = ['Ana', 'Carlos', 'María', 'José', 'Laura', 'Diego', 'Sofia', 'Miguel', 'Valentina', 'Fernando'];
        const surnames = ['García', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Rivera'];
        const specialties = ['Cardiología', 'Dermatología', 'Pediatría', 'Ginecología', 'Traumatología', 'Neurología'];
        const reasons = ['Consulta de rutina', 'Control médico', 'Dolor de cabeza', 'Revisión', 'Seguimiento', 'Chequeo general'];

        // Generar pacientes aleatorios
        for (let i = 0; i < count; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const surname = surnames[Math.floor(Math.random() * surnames.length)];
            const dni = `${Math.floor(Math.random() * 90) + 10}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}`;
            const phone = `(011) ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
            
            randomPatients.push({
                id: 100 + i,
                name: `${name} ${surname}`,
                dni: dni,
                phone: phone,
                email: `${name.toLowerCase()}.${surname.toLowerCase()}@email.com`,
                lastVisit: this.getRandomDate(),
                birthDate: this.getRandomBirthDate(),
                address: `Av. ${surnames[Math.floor(Math.random() * surnames.length)]} ${Math.floor(Math.random() * 9000) + 1000}, CABA`
            });
        }

        // Generar médicos aleatorios
        for (let i = 0; i < Math.floor(count / 2); i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const surname = surnames[Math.floor(Math.random() * surnames.length)];
            const specialty = specialties[Math.floor(Math.random() * specialties.length)];
            const license = `${Math.floor(Math.random() * 90000) + 10000}`;
            
            randomDoctors.push({
                id: 200 + i,
                name: `Dr. ${name} ${surname}`,
                specialty: specialty,
                license: license,
                schedule: '08:00 - 17:00',
                status: ['disponible', 'ocupado', 'fuera-linea'][Math.floor(Math.random() * 3)],
                experience: `${Math.floor(Math.random() * 20) + 5} años`
            });
        }

        // Generar turnos aleatorios
        for (let i = 0; i < count * 2; i++) {
            const patient = randomPatients[Math.floor(Math.random() * randomPatients.length)];
            const doctor = randomDoctors[Math.floor(Math.random() * randomDoctors.length)];
            const reason = reasons[Math.floor(Math.random() * reasons.length)];
            const status = ['pendiente', 'confirmado', 'cancelado'][Math.floor(Math.random() * 3)];
            
            randomAppointments.push({
                id: 300 + i,
                patientId: patient.id,
                doctorId: doctor.id,
                date: this.getRandomFutureDate(),
                time: this.getRandomTime(),
                reason: reason,
                status: status,
                createdAt: new Date().toISOString()
            });
        }

        return {
            patients: randomPatients,
            doctors: randomDoctors,
            appointments: randomAppointments
        };
    },

    // Métodos auxiliares para generar fechas aleatorias
    getRandomDate: function() {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        return date.toLocaleDateString('es-AR');
    },

    getRandomBirthDate: function() {
        const year = 1950 + Math.floor(Math.random() * 50);
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    },

    getRandomFutureDate: function() {
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 30));
        return date.toISOString().split('T')[0];
    },

    getRandomTime: function() {
        const timeSlots = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
            '17:00', '17:30', '18:00'
        ];
        return timeSlots[Math.floor(Math.random() * timeSlots.length)];
    }
};

// Exportar datos de demostración globalmente
window.DemoData = DemoData;

// Función para cargar datos de demostración desde la consola
window.loadDemo = function() {
    return DemoData.loadDemoData();
};

// Función para limpiar datos de demostración desde la consola
window.clearDemo = function() {
    return DemoData.clearDemoData();
};

// Función para generar datos aleatorios desde la consola
window.generateRandom = function(count = 10) {
    return DemoData.generateRandomData(count);
};


