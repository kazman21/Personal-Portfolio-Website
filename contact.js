const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/munafkazi2006@gmail.com';

// ============================================
// CLIENT-SIDE RATE LIMITING (3 per minute)
// ============================================
const rateLimitStore = { timestamps: [] };

function checkRateLimit() {
    const now = Date.now();
    rateLimitStore.timestamps = rateLimitStore.timestamps.filter(t => now - t < 60000);
    if (rateLimitStore.timestamps.length >= 3) {
        const retryIn = Math.ceil((60000 - (now - rateLimitStore.timestamps[0])) / 1000);
        return { allowed: false, retryIn };
    }
    rateLimitStore.timestamps.push(now);
    return { allowed: true };
}

// ============================================
// VALIDATION
// ============================================
const validate = {
    email:   (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    name:    (v) => /^[a-zA-Z\s\-'\.]{2,100}$/.test(v.trim()),
    message: (v) => v.trim().length >= 10 && v.trim().length <= 1000
};

function showError(id, msg) {
    const err = document.getElementById(`${id}Error`);
    const inp = document.getElementById(id);
    if (err) { err.textContent = msg; err.classList.add('show'); }
    if (inp) { inp.classList.add('error'); inp.setAttribute('aria-invalid', 'true'); }
}

function clearError(id) {
    const err = document.getElementById(`${id}Error`);
    const inp = document.getElementById(id);
    if (err) { err.textContent = ''; err.classList.remove('show'); }
    if (inp) { inp.classList.remove('error'); inp.setAttribute('aria-invalid', 'false'); }
}

function validateForm() {
    ['fullName', 'email', 'message'].forEach(clearError);
    let valid = true;

    const name = document.getElementById('fullName').value;
    if (!name.trim())             { showError('fullName', 'Name is required'); valid = false; }
    else if (!validate.name(name)) { showError('fullName', 'Name can only contain letters, spaces, hyphens, and apostrophes'); valid = false; }

    const email = document.getElementById('email').value;
    if (!email.trim())              { showError('email', 'Email is required'); valid = false; }
    else if (!validate.email(email)) { showError('email', 'Please enter a valid email address'); valid = false; }

    const msg = document.getElementById('message').value;
    if (!msg.trim())                 { showError('message', 'Message is required'); valid = false; }
    else if (!validate.message(msg)) {
        showError('message', msg.trim().length < 10
            ? 'Message is too short (minimum 10 characters)'
            : 'Message is too long (maximum 1000 characters)');
        valid = false;
    }

    return valid;
}

// ============================================
// UI HELPERS
// ============================================
function setLoading(loading) {
    const btn = document.getElementById('submitBtn');
    const txt = document.getElementById('submitText');
    const ldr = document.getElementById('submitLoader');
    if (btn) btn.disabled = loading;
    if (txt) txt.textContent = loading ? 'Sending...' : 'Send Message';
    if (ldr) loading ? ldr.classList.add('show') : ldr.classList.remove('show');
}

function showMessage(type, text, autoHide = true) {
    const success  = document.getElementById('successMessage');
    const error    = document.getElementById('errorMessage');
    const errorTxt = document.getElementById('errorText');
    const form     = document.getElementById('contactForm');

    if (type === 'success') {
        if (form)    form.style.display = 'none';
        if (error)   error.classList.remove('show');
        if (success) {
            success.classList.add('show');
            success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            success.focus();
        }
    } else {
        if (success) success.classList.remove('show');
        if (errorTxt) errorTxt.textContent = text;
        if (error) {
            error.classList.add('show');
            error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            error.focus();
        }
        if (autoHide) setTimeout(() => error?.classList.remove('show'), 8000);
    }
}

// ============================================
// FORM SUBMISSION
// ============================================
async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        document.querySelector('.form-input.error, .form-textarea.error')?.focus();
        return;
    }

    // FormSubmit rejects requests from pages opened directly off disk (file://),
    // so hand the message to the visitor's email app instead.
    if (window.location.protocol === 'file:') {
        const name    = document.getElementById('fullName').value.trim();
        const message = document.getElementById('message').value.trim();
        const subject = encodeURIComponent('New message from your portfolio contact form');
        const body    = encodeURIComponent(`From: ${name}\n\n${message}`);
        window.location.href = `mailto:munafkazi2006@gmail.com?subject=${subject}&body=${body}`;
        showMessage('error', 'The form can’t send messages when this page is opened as a local file, so your email app was opened instead. To use the form, view the site through a web server (npm run dev, then http://localhost:3000).', false);
        return;
    }

    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
        showMessage('error', `Too many messages. Please wait ${rateLimit.retryIn} seconds before trying again.`);
        return;
    }

    setLoading(true);

    try {
        const res = await fetch(FORMSUBMIT_URL, {
            method:  'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept':       'application/json'
            },
            body: JSON.stringify({
                name:      document.getElementById('fullName').value.trim(),
                email:     document.getElementById('email').value.trim(),
                message:   document.getElementById('message').value.trim(),
                _subject:  'New message from your portfolio contact form',
                _captcha:  'false',
                _template: 'table'
            })
        });

        const data = await res.json();
        setLoading(false);

        if (data.success === 'true' || data.success === true) {
            showMessage('success');
            setTimeout(() => document.getElementById('contactForm')?.reset(), 500);
        } else {
            showMessage('error', data.message || 'Failed to send your message. Please try again or email me directly.');
        }
    } catch (err) {
        setLoading(false);
        showMessage('error', 'Network error. Please check your connection and try again.');
    }
}

// ============================================
// INLINE VALIDATION ON BLUR
// ============================================
function setupValidation() {
    ['fullName', 'email', 'message'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', () => clearError(id));
        el.addEventListener('blur', () => {
            const val = el.value;
            if (!val.trim()) return;
            if (id === 'fullName' && !validate.name(val))    showError(id, 'Name can only contain letters, spaces, hyphens, and apostrophes');
            if (id === 'email'    && !validate.email(val))   showError(id, 'Please enter a valid email address');
            if (id === 'message'  && !validate.message(val)) {
                showError(id, val.trim().length < 10
                    ? 'Message is too short (minimum 10 characters)'
                    : 'Message is too long (maximum 1000 characters)');
            }
        });
    });
}

// ============================================
// INIT
// ============================================
function init() {
    const video    = document.querySelector('.background-video');
    const fallback = document.querySelector('.background-overlay');
    if (video && fallback) {
        video.addEventListener('error',      () => fallback.style.display = 'block');
        video.addEventListener('loadeddata', () => fallback.style.display = 'none');
    }

    const form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', handleSubmit);

    setupValidation();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
