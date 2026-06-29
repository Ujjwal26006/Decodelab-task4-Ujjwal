/**
 * SkillForge Academy — auth.js
 * Handles student registration and login.
 * Used by both login.html and register.html
 */

'use strict';

const API_BASE = 'http://localhost:5000/api';

/* ── Storage helpers ──────────────────────────────────────────────────────── */
function saveSession(token, student) {
  localStorage.setItem('sf_token',   token);
  localStorage.setItem('sf_student', JSON.stringify(student));
}

function getToken()   { return localStorage.getItem('sf_token'); }
function getStudent() {
  try { return JSON.parse(localStorage.getItem('sf_student')); }
  catch { return null; }
}

function clearSession() {
  localStorage.removeItem('sf_token');
  localStorage.removeItem('sf_student');
}

/* ── API call helper ──────────────────────────────────────────────────────── */
async function authFetch(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() };
}

/* ── UI helpers ───────────────────────────────────────────────────────────── */
function setFormError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.className = 'form-status is-error';
}

function setFieldErr(inputEl, errEl, msg) {
  inputEl?.classList.add('is-invalid');
  if (errEl) errEl.textContent = msg;
}

function clearFieldErr(inputEl, errEl) {
  inputEl?.classList.remove('is-invalid');
  inputEl?.classList.add('is-valid');
  if (errEl) errEl.textContent = '';
}

function setSubmitting(btn, loading) {
  btn.disabled    = loading;
  btn.textContent = loading ? 'Please wait…' : btn.dataset.label;
}

/** Reads an optional ?redirect= target from the URL, defaulting to dashboard.html. */
function getPostLoginRedirect() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || 'dashboard.html';
}

/* ── Guard: redirect to dashboard (or intended page) if already logged in ── */
function guardAlreadyLoggedIn() {
  if (getToken()) window.location.href = getPostLoginRedirect();
}

/* ── REGISTER ─────────────────────────────────────────────────────────────── */
function initRegisterForm() {
  const form   = document.getElementById('register-form');
  if (!form) return;

  guardAlreadyLoggedIn();

  const nameInput  = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passInput  = document.getElementById('reg-password');
  const submitBtn  = document.getElementById('reg-submit');
  const statusEl   = document.getElementById('reg-status');

  submitBtn.dataset.label = submitBtn.textContent;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = nameInput.value.trim();
    const email    = emailInput.value.trim();
    const password = passInput.value;

    // Client-side validation
    let valid = true;
    if (!fullName || fullName.length < 2) {
      setFieldErr(nameInput, document.getElementById('reg-name-error'), 'Name must be at least 2 characters.');
      valid = false;
    } else clearFieldErr(nameInput, document.getElementById('reg-name-error'));

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErr(emailInput, document.getElementById('reg-email-error'), 'Please enter a valid email.');
      valid = false;
    } else clearFieldErr(emailInput, document.getElementById('reg-email-error'));

    if (!password || password.length < 6) {
      setFieldErr(passInput, document.getElementById('reg-pass-error'), 'Password must be at least 6 characters.');
      valid = false;
    } else clearFieldErr(passInput, document.getElementById('reg-pass-error'));

    if (!valid) return;

    setSubmitting(submitBtn, true);
    statusEl.className = 'form-status';

    try {
      const { ok, data } = await authFetch('/auth/register', { fullName, email, password });

      if (ok && data.success) {
        saveSession(data.data.token, data.data.student);
        window.location.href = 'dashboard.html';
      } else {
        setFormError(statusEl, data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setFormError(statusEl, 'Network error. Please check your connection.');
    } finally {
      setSubmitting(submitBtn, false);
    }
  });
}

/* ── LOGIN ────────────────────────────────────────────────────────────────── */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  guardAlreadyLoggedIn();

  const emailInput = document.getElementById('login-email');
  const passInput  = document.getElementById('login-password');
  const submitBtn  = document.getElementById('login-submit');
  const statusEl   = document.getElementById('login-status');

  submitBtn.dataset.label = submitBtn.textContent;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !password) {
      setFormError(statusEl, 'Please enter your email and password.');
      return;
    }

    setSubmitting(submitBtn, true);
    statusEl.className = 'form-status';

    try {
      const { ok, data } = await authFetch('/auth/login', { email, password });

      if (ok && data.success) {
        saveSession(data.data.token, data.data.student);
        window.location.href = getPostLoginRedirect();
      } else {
        setFormError(statusEl, data.message || 'Invalid email or password.');
      }
    } catch {
      setFormError(statusEl, 'Network error. Please check your connection.');
    } finally {
      setSubmitting(submitBtn, false);
    }
  });
}

/* ── LOGOUT ───────────────────────────────────────────────────────────────── */
function initLogout() {
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const token = getToken();
      if (token) {
        try {
          await fetch(`${API_BASE}/auth/logout`, {
            method:  'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch { /* ignore network errors on logout */ }
      }
      clearSession();
      window.location.href = 'login.html';
    });
  });
}

/* ── Protect LMS pages: redirect to login if no token ────────────────────── */
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/* ── Authenticated API helper (used by dashboard.js + course.js) ─────────── */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (res.status === 401) {
      clearSession();
      window.location.href = 'login.html';
      return { ok: false, data: null };
    }

    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { success: false, message: 'Network error.' } };
  }
}

/* ── Init on page load ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
  initLogout();

  // Populate student name in nav if logged in
  const student = getStudent();
  const nameEl  = document.getElementById('nav-student-name');
  const avatarEl = document.getElementById('nav-student-avatar');
  if (student && nameEl)   nameEl.textContent   = student.fullName;
  if (student && avatarEl) avatarEl.textContent = student.avatar || student.fullName?.slice(0,2).toUpperCase();
});
