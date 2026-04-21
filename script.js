document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initTypingPhrases();
    initActiveNavLinks();
    initSmoothAnchorScroll();
    initFormValidation();
    initMobileNavCloseOnClick();
});

function initThemeToggle() {
    const toggleButton = document.getElementById("theme-toggle");
    const storedTheme = localStorage.getItem("portfolio-theme");
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme || (preferredDark ? "dark" : "light");

    applyTheme(initialTheme);

    if (!toggleButton) return;
    toggleButton.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("portfolio-theme", theme);

    const toggleButton = document.getElementById("theme-toggle");
    if (toggleButton) {
        // show the opposite-action icon: when dark, show sun (to go light); when light, show moon (to go dark)
        if (theme === "dark") {
            toggleButton.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
            toggleButton.setAttribute("aria-pressed", "true");
        } else {
            toggleButton.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i>';
            toggleButton.setAttribute("aria-pressed", "false");
        }
    }
}

function initTypingPhrases() {
    const phraseContainer = document.querySelector(".typing-phrases");
    if (!phraseContainer) return;

    const phraseNodes = Array.from(phraseContainer.querySelectorAll("span"));
    const phrases = phraseNodes.map((n) => n.textContent.trim()).filter(Boolean);
    if (!phrases.length) return;

    // Typewriter-style continuous flow (type, pause, delete, next)
    let pIndex = 0;
    let charIndex = 0;
    let typing = true;
    const typingSpeed = 80; // ms per char
    const deletingSpeed = 36; // ms per char when deleting
    const pauseAfterComplete = 1200; // ms pause after finishing a phrase

    // start with empty content
    phraseContainer.textContent = "";

    function tick() {
        const current = phrases[pIndex];
        if (typing) {
            charIndex++;
            phraseContainer.textContent = current.slice(0, charIndex);
            if (charIndex >= current.length) {
                typing = false;
                setTimeout(tick, pauseAfterComplete);
                return;
            }
            setTimeout(tick, typingSpeed);
        } else {
            // deleting
            charIndex--;
            phraseContainer.textContent = current.slice(0, charIndex);
            if (charIndex <= 0) {
                // move to next phrase
                pIndex = (pIndex + 1) % phrases.length;
                typing = true;
                setTimeout(tick, typingSpeed);
                return;
            }
            setTimeout(tick, deletingSpeed);
        }
    }

    // kick off
    tick();
}

function initActiveNavLinks() {
    const sections = Array.from(document.querySelectorAll("section[id]"));
    const navLinks = Array.from(document.querySelectorAll(".nav-link[href^='#']"));
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const targetId = entry.target.getAttribute("id");

                navLinks.forEach((link) => {
                    const isActive = link.getAttribute("href") === `#${targetId}`;
                    link.classList.toggle("active", isActive);
                    if (isActive) {
                        link.setAttribute("aria-current", "page");
                    } else {
                        link.removeAttribute("aria-current");
                    }
                });
            });
        },
        {
            root: null,
            threshold: 0.45,
        }
    );

    sections.forEach((section) => observer.observe(section));
}

function initSmoothAnchorScroll() {
    const anchorLinks = document.querySelectorAll("a[href^='#']");
    anchorLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href === "#") return;
            const target = document.querySelector(href);
            if (!target) return;

            // Allow scroll-control anchors (the floating scroller icons) and the hire modal
            // link to use default hash navigation so CSS :target rules (and the modal) work.
            if (link.closest('.scroll-controls') || href === '#hireRequestModal') {
                // let the browser handle the hash so :target CSS works
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

function initFormValidation() {
    const contactForm = document.getElementById("contact-form");
    const hireForm = document.getElementById("hire-form");

    if (contactForm) {
        contactForm.addEventListener("submit", (event) => {
            const name = contactForm.querySelector("#name");
            const email = contactForm.querySelector("#email");
            const message = contactForm.querySelector("#message");

            const nameOk = validateMinLength(name, 2);
            const emailOk = validateEmail(email);
            const messageOk = validateMinLength(message, 10);

            if (!nameOk || !emailOk || !messageOk) {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            alert("Contact form looks good. Connect your backend endpoint to submit.");
            contactForm.reset();
            clearValidation(contactForm);
        });
    }

    if (hireForm) {
        hireForm.addEventListener("submit", (event) => {
            const company = hireForm.querySelector("#company");
            const workEmail = hireForm.querySelector("#workEmail");
            const hireType = hireForm.querySelector("#hireType");
            const hireMessage = hireForm.querySelector("#hireMessage");

            const companyOk = validateMinLength(company, 2);
            const emailOk = validateEmail(workEmail);
            const typeOk = validateSelect(hireType);
            const messageOk = validateMinLength(hireMessage, 10);

            if (!companyOk || !emailOk || !typeOk || !messageOk) {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            alert("Hiring request form looks good. Connect your backend endpoint to submit.");
            hireForm.reset();
            clearValidation(hireForm);
        });
    }

    document.querySelectorAll("#contact-form input, #contact-form textarea, #hire-form input, #hire-form textarea, #hire-form select").forEach((input) => {
        input.addEventListener("input", () => {
            markFieldState(input, true, "");
        });
        input.addEventListener("change", () => {
            markFieldState(input, true, "");
        });
    });
}

function validateMinLength(field, minLength) {
    if (!field) return false;
    const value = field.value.trim();
    if (value.length >= minLength) {
        markFieldState(field, true, "");
        return true;
    }
    markFieldState(field, false, `Please enter at least ${minLength} characters.`);
    return false;
}

function validateEmail(field) {
    if (!field) return false;
    const value = field.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(value)) {
        markFieldState(field, true, "");
        return true;
    }
    markFieldState(field, false, "Please enter a valid email address.");
    return false;
}

function validateSelect(field) {
    if (!field) return false;
    if (field.value.trim() !== "") {
        markFieldState(field, true, "");
        return true;
    }
    markFieldState(field, false, "Please choose a hiring type.");
    return false;
}

function markFieldState(field, valid, message) {
    field.classList.toggle("is-invalid", !valid);
    field.classList.toggle("is-valid", valid && field.value.trim().length > 0);
    field.setCustomValidity(valid ? "" : message);
    if (!valid) {
        field.reportValidity();
    }
}

function clearValidation(form) {
    form.querySelectorAll("input, textarea, select").forEach((field) => {
        field.classList.remove("is-invalid", "is-valid");
        field.setCustomValidity("");
    });
}

function initMobileNavCloseOnClick() {
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
    if (!navToggle || !navLinks.length) return;

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            navToggle.checked = false;
        });
    });
}
