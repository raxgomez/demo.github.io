// SAGOMU - JavaScript Principal

// Funcion para scroll suave al hacer clic en el boton de cursos
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

    // Animacion de aparicion al hacer scroll
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

    // Observar elementos para animacion
    const animatedElements = document.querySelectorAll('.feature-box, .course-card, .vr-lab-text, .split-content');
    animatedElements.forEach(el => observer.observe(el));

    // Navegacion movil - Menu hamburguesa
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navLinks = document.querySelector('.nav-links');
    let isMenuOpen = false;

    // Toggle del menu hamburguesa
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', function() {
            isMenuOpen = !isMenuOpen;
            hamburgerMenu.classList.toggle('active', isMenuOpen);
            if (navLinks) {
                navLinks.classList.toggle('active', isMenuOpen);
            }
        });
    }

    // Cerrar menu al hacer clic en un enlace
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                isMenuOpen = false;
                if (hamburgerMenu) {
                    hamburgerMenu.classList.remove('active');
                }
                navLinks.classList.remove('active');
            });
        });
    }
});

// Funcion para animacion de elementos
function animateOnScroll() {
    const elements = document.querySelectorAll('.feature-box, .course-card');

    elements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Inicializar animaciones cuando la pagina carga
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

// Efecto parallax suave para la seccion de laboratorio VR
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

// --- FORMULARIO DE CONTACTO (FORMSPREE) ---

// Funcion para validar correo electronico
function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// Manejo del formulario con Formspree
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = document.querySelector('.submit-btn');

    if (contactForm) {
        // Validar correo en tiempo real
        emailInput.addEventListener('blur', function() {
            if (this.value.trim() && !validarEmail(this.value)) {
                this.parentElement.classList.add('has-error');
                emailError.textContent = 'Por favor ingresa un correo valido';
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

        // Enviar formulario con AJAX (Formspree)
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Validar correo antes de enviar
            if (!validarEmail(emailInput.value.trim())) {
                emailInput.parentElement.classList.add('has-error');
                emailError.textContent = 'Por favor ingresa un correo valido';
                return;
            }

            // Limpiar errores previos
            emailInput.parentElement.classList.remove('has-error');
            emailError.textContent = '';

            // Deshabilitar boton mientras se procesa
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Enviando...</span> <i class="fas fa-spinner fa-spin"></i>';

            const formData = new FormData(contactForm);

            // Enviar a Formspree sin headers especiales
            fetch(contactForm.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Exito
                contactForm.classList.add('hidden');
                successMessage.classList.add('active');

                // Restaurar el formulario despues de 5 segundos
                setTimeout(() => {
                    contactForm.reset();
                    contactForm.classList.remove('hidden');
                    successMessage.classList.remove('active');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Enviar Mensaje</span> <i class="fas fa-paper-plane"></i>';
                }, 5000);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un error al enviar el formulario. Por favor intenta nuevamente.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Enviar Mensaje</span> <i class="fas fa-paper-plane"></i>';
            });
        });
    }
});
