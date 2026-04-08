// SAGOMU - JavaScript Principal

// Función para scroll suave al hacer clic en el botón de cursos
document.addEventListener('DOMContentLoaded', function() {
    const btnMain = document.querySelector('.btn-main');

    if (btnMain) {
        btnMain.addEventListener('click', function() {
            const cursosSection = document.getElementById('cursos');
            if (cursosSection) {
                cursosSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Animación de aparición al hacer scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observar elementos para animación
    const animatedElements = document.querySelectorAll('.feature-box, .course-card, .vr-lab-text, .split-content');
    animatedElements.forEach(el => observer.observe(el));

    // Navegación móvil (si se implementa menú hamburguesa en el futuro)
    const navLinks = document.querySelector('.nav-links');
    let isMenuOpen = false;

    // Función para toggle del menú móvil (preparado para futura implementación)
    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;
        if (navLinks) {
            navLinks.classList.toggle('active', isMenuOpen);
        }
    }
});

// Función para animación de elementos
function animateOnScroll() {
    const elements = document.querySelectorAll('.feature-box, .course-card');

    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    }
}

// Inicializar animaciones cuando la página carga
window.addEventListener('load', animateOnScroll);

// Smooth scroll para todos los enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Efecto parallax suave para la sección de laboratorio VR
window.addEventListener('scroll', function() {
    const vrLabSection = document.querySelector('.vr-lab-section');
    if (vrLabSection) {
        const scrolled = window.pageYOffset;
        const sectionTop = vrLabSection.offsetTop;
        const sectionHeight = vrLabSection.offsetHeight;

        if (scrolled > sectionTop - window.innerHeight && scrolled < sectionTop + sectionHeight) {
            const yPos = (scrolled - sectionTop) * 0.3;
            vrLabSection.style.backgroundPositionY = `${yPos}px`;
        }
    }
});

// --- FORMULARIO DE CONTACTO ---

// Función para validar correo electrónico
function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// Manejo del formulario
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.querySelector('.submit-btn');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Obtener valores del formulario
            const nombre = document.getElementById('nombre').value.trim();
            const email = document.getElementById('email').value.trim();
            const curso = document.getElementById('curso').value;
            const mensaje = document.getElementById('mensaje').value.trim();

            // Validar correo
            if (!validarEmail(email)) {
                emailInput.parentElement.classList.add('has-error');
                emailError.textContent = 'Por favor ingresa un correo válido';
                return;
            }

            // Limpiar errores previos
            emailInput.parentElement.classList.remove('has-error');
            emailError.textContent = '';

            // Deshabilitar botón mientras se procesa
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Enviando...</span> <i class="fas fa-spinner fa-spin"></i>';

            // Construir el asunto del correo
            const asunto = encodeURIComponent(`Nuevo Interesado en Curso: ${curso}`);

            // Construir el cuerpo del mensaje
            const cuerpo = encodeURIComponent(
                `NUEVO SOLICITUD DE INFORMACIÓN - SAGOMU\n\n` +
                `=============================================\n\n` +
                `👤 NOMBRE: ${nombre}\n\n` +
                `📧 CORREO: ${email}\n\n` +
                `📚 CURSO DE INTERÉS: ${curso}\n\n` +
                `📝 MENSAJE ADICIONAL:\n${mensaje || 'Sin mensaje adicional'}\n\n` +
                `=============================================\n\n` +
                `Fecha: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}\n`
            );

            // Abrir cliente de correo con los datos prellenados
            const mailtoLink = `mailto:rafaelgomezcruz1211@gmail.com?subject=${asunto}&body=${cuerpo}`;
            window.open(mailtoLink, '_blank');

            // Simular envío exitoso y mostrar mensaje de éxito
            setTimeout(() => {
                contactForm.classList.add('hidden');
                successMessage.classList.add('active');

                // Restablecer el formulario después de 5 segundos
                setTimeout(() => {
                    contactForm.reset();
                    contactForm.classList.remove('hidden');
                    successMessage.classList.remove('active');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Enviar Mensaje</span> <i class="fas fa-paper-plane"></i>';
                }, 5000);
            }, 1500);
        });

        // Validar correo en tiempo real
        emailInput.addEventListener('blur', function() {
            if (this.value.trim() && !validarEmail(this.value)) {
                this.parentElement.classList.add('has-error');
                emailError.textContent = 'Por favor ingresa un correo válido';
            } else {
                this.parentElement.classList.remove('has-error');
                emailError.textContent = '';
            }
        });

        emailInput.addEventListener('input', function() {
            if (this.parentElement.classList.contains('has-error')) {
                this.parentElement.classList.remove('has-error');
                emailError.textContent = '';
            }
        });
    }
});
