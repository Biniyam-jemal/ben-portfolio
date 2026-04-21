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
        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const name = contactForm.querySelector("#name");
            const email = contactForm.querySelector("#email");
            const message = contactForm.querySelector("#message");

            const nameOk = validateMinLength(name, 2);
            const emailOk = validateEmail(email);
            const messageOk = validateMinLength(message, 10);

            if (!nameOk || !emailOk || !messageOk) return;

            try {
                const result = await submitForm(contactForm);
                const serverMsg = (result && (result.message || result.data || result.msg)) || "Thanks — your message was sent successfully.";
                showToast(serverMsg, "success");
                contactForm.reset();
                clearValidation(contactForm);
            } catch (err) {
                console.error(err);
                showToast(err.message || "Sorry, something went wrong.", "error");
            }
        });
    }

    if (hireForm) {
        hireForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const company = hireForm.querySelector("#company");
            const workEmail = hireForm.querySelector("#workEmail");
            const hireType = hireForm.querySelector("#hireType");
            const hireMessage = hireForm.querySelector("#hireMessage");

            const companyOk = validateMinLength(company, 2);
            const emailOk = validateEmail(workEmail);
            const typeOk = validateSelect(hireType);
            const messageOk = validateMinLength(hireMessage, 10);

            if (!companyOk || !emailOk || !typeOk || !messageOk) return;

            try {
                const result = await submitForm(hireForm);
                const serverMsg = (result && (result.message || result.data || result.msg)) || "Hiring request sent — thank you!";
                showToast(serverMsg, "success");
                hireForm.reset();
                clearValidation(hireForm);
                // close :target modal by removing hash
                try { history.replaceState(null, document.title, window.location.pathname + window.location.search); } catch (e) { location.hash = ""; }
            } catch (err) {
                console.error(err);
                showToast(err.message || "Submission failed. Please try again later.", "error");
            }
        });
    }

    // Generic form submit helper that posts FormData to the form action
    async function submitForm(form) {
        const action = form.getAttribute("action") || "https://api.web3forms.com/submit";
        const formData = new FormData(form);
        // ensure access_key is present (keeps existing hidden input)
        const resp = await fetch(action, { method: "POST", body: formData });
        let json = null;
        try {
            json = await resp.json();
        } catch (e) {
            // ignore JSON parse errors
        }

        // Web3Forms typically responds with a JSON object. Consider the request failed
        // if server returned non-OK or explicitly indicated failure.
        if (!resp.ok || (json && (json.success === false || json.status === "error"))) {
            const msg = (json && (json.message || json.error)) || `Form submit failed: ${resp.status}`;
            throw new Error(msg);
        }

        console.log("Form submission response:", json || resp.status);
        return json || { status: resp.status };
    }

    // Small toast helper for nicer feedback than alert()
    function showToast(message, type = "info", timeout = 4500) {
        const toast = document.createElement("div");
        toast.className = `form-toast form-toast-${type}`;
        toast.textContent = message;
        Object.assign(toast.style, {
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: 99999,
            background: type === "success" ? "#198754" : type === "error" ? "#dc3545" : "#333",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: "8px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
            opacity: "0",
            transition: "opacity 220ms ease-in-out, transform 220ms",
            transform: "translateY(8px)",
            maxWidth: "90%",
            fontSize: "14px",
        });
        document.body.appendChild(toast);
        // show
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateY(0)";
        });
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(8px)";
            setTimeout(() => toast.remove(), 300);
        }, timeout);
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
