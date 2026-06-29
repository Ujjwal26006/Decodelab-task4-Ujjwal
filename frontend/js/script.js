/**
 * SkillForge Academy — script.js
 * Vanilla JS | ES2020 | fetch / async-await / try-catch
 * Features: Nav toggle, smooth scroll, active nav highlight,
 *           FAQ accordion, animated counters, scroll reveal,
 *           API integration, contact form, payment redirect, newsletter
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════════════════════════ */
const API_BASE = 'http://localhost:5000/api';

/* ══════════════════════════════════════════════════════════════════════════
   UTILITY HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Lightweight fetch wrapper — always resolves to { ok, data }.
 * @param {string} endpoint - Path relative to API_BASE
 * @param {RequestInit} [options]
 * @returns {Promise<{ ok: boolean, data: any }>}
 */
async function apiFetch(endpoint, options = {}) {
  const defaultHeaders = { 'Content-Type': 'application/json' };
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch (error) {
    return { ok: false, data: { success: false, message: 'Network error. Please check your connection.' } };
  }
}

/** Escapes HTML to prevent XSS when injecting user-facing API data */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

/** Formats a price number into INR (e.g. 8999 → ₹8,999) */
function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Checks whether a student session exists, by reading the same localStorage
 * key auth.js writes on login/register ('sf_token'). script.js intentionally
 * does not load auth.js — both files declare their own API_BASE/apiFetch,
 * and loading both on one page throws a "redeclaration" SyntaxError that
 * breaks the entire page. Reading the storage key directly avoids that.
 */
function isLoggedIn() {
  return Boolean(localStorage.getItem('sf_token'));
}

/* ══════════════════════════════════════════════════════════════════════════
   1. MOBILE NAVIGATION TOGGLE
   ══════════════════════════════════════════════════════════════════════════ */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.primary-nav');
  if (!toggle || !nav) return;

  function openNav() {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeNav() : openNav();
  });

  // Close on nav link click (mobile)
  nav.querySelectorAll('.nav-link, .nav-cta').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeNav();
  });

  // Close if viewport resizes to desktop width
  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', (e) => { if (e.matches) closeNav(); });
}

/* ══════════════════════════════════════════════════════════════════════════
   2. SMOOTH SCROLLING (handled by CSS + html scroll-behavior; JS fallback)
   ══════════════════════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  if (CSS.supports('scroll-behavior', 'smooth')) return;
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   3. ACTIVE NAVIGATION HIGHLIGHT (Intersection Observer)
   ══════════════════════════════════════════════════════════════════════════ */
function initActiveNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ══════════════════════════════════════════════════════════════════════════
   4. SCROLL REVEAL ANIMATIONS
   ══════════════════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  items.forEach((item) => observer.observe(item));
}

/* ══════════════════════════════════════════════════════════════════════════
   5. ANIMATED STATISTICS COUNTERS
   ══════════════════════════════════════════════════════════════════════════ */
function animateCounter(el, target, suffix = '') {
  const duration = 1800;
  const start = performance.now();

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(easeOutExpo(progress) * target);
    el.textContent = new Intl.NumberFormat('en-IN').format(value) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* ══════════════════════════════════════════════════════════════════════════
   6. API: LOAD COURSES
   ══════════════════════════════════════════════════════════════════════════ */

/** Emoji map for course cards (no real images needed for demo) */
const COURSE_EMOJI = {
  '1': '💻',
  '2': '📊',
  '3': '🐍',
  '4': '☕',
  '5': '🎨',
  '6': '🤖',
};

function renderCourseCard(course) {
  return `
    <article class="course-card reveal-item" aria-label="${escapeHtml(course.title)} course">
      <div class="course-card-image" role="img" aria-label="${escapeHtml(course.title)} course illustration">
        ${COURSE_EMOJI[course.title] || '📚'}
      </div>
      <div class="course-card-body">
        <div class="course-card-meta">
          <span class="course-card-tag">${escapeHtml(course.category)}</span>
          <span class="course-card-duration">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg>
            ${escapeHtml(course.duration)}
          </span>
        </div>
        <h3 class="course-card-title">${escapeHtml(course.title)}</h3>
        <p class="course-card-desc">${escapeHtml(course.description)}</p>
        <div class="course-card-footer">
          <span class="course-card-price">${formatPrice(course.price)}</span>
          <button
            class="btn btn-primary enroll-trigger"
            data-course-id="${escapeHtml(course._id)}"
            data-course-title="${escapeHtml(course.title)}"
            aria-label="Enroll in ${escapeHtml(course.title)}"
          >
            Enroll
          </button>
        </div>
      </div>
    </article>
  `;
}

async function loadCourses() {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;

  const { ok, data } = await apiFetch('/courses');

  if (!ok || !data.success) {
    grid.innerHTML = `
      <div class="error-state" role="alert">
        <p>Unable to load courses right now.</p>
        <button class="btn btn-secondary" onclick="loadCourses()">Retry</button>
      </div>`;
    return;
  }

  grid.setAttribute('aria-busy', 'false');
  grid.innerHTML = data.data.map(renderCourseCard).join('');

  // Enroll buttons now go straight to checkout. Logged-out visitors are
  // sent to login first (with a redirect back to this exact course's
  // checkout afterwards), since enrollment is always tied to an
  // authenticated student — never to a typed-in name/email.
  grid.querySelectorAll('.enroll-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const courseId = btn.dataset.courseId;
      if (isLoggedIn()) {
        window.location.href = `payment.html?courseId=${encodeURIComponent(courseId)}`;
      } else {
        window.location.href = `login.html?redirect=${encodeURIComponent(`payment.html?courseId=${courseId}`)}`;
      }
    });
  });

  // Trigger scroll reveal for newly added cards
  initScrollReveal();
}

/* ══════════════════════════════════════════════════════════════════════════
   7. API: LOAD STATISTICS
   ══════════════════════════════════════════════════════════════════════════ */
const STAT_CONFIG = [
  { key: 'students',    label: 'Students Enrolled', suffix: '+' },
  { key: 'courses',     label: 'Expert Courses',    suffix: '+' },
  { key: 'mentors',     label: 'Industry Mentors',  suffix: '+' },
  { key: 'successRate', label: 'Placement Rate',    suffix: '%' },
];

async function loadStats() {
  const list = document.getElementById('stats-list');
  if (!list) return;

  const { ok, data } = await apiFetch('/stats');
  if (!ok || !data.success) return;

  const stats = data.data;
  list.setAttribute('aria-busy', 'false');
  list.innerHTML = STAT_CONFIG.map(({ key, label, suffix }) => `
    <li class="stat-item">
      <span class="stat-number" data-target="${stats[key]}" data-suffix="${suffix}">0</span>
      <span class="stat-label">${escapeHtml(label)}</span>
    </li>
  `).join('');

  // Animate counters when visible
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        list.querySelectorAll('.stat-number').forEach((el) => {
          animateCounter(el, parseInt(el.dataset.target, 10), el.dataset.suffix);
        });
        obs.disconnect();
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(list);
}

/* ══════════════════════════════════════════════════════════════════════════
   8. API: LOAD TESTIMONIALS
   ══════════════════════════════════════════════════════════════════════════ */
function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span aria-hidden="true">${i < rating ? '★' : '☆'}</span>`
  ).join('');
}

function renderTestimonialCard(t) {
  return `
    <article class="testimonial-card reveal-item" aria-label="Review by ${escapeHtml(t.name)}">
      <span class="testimonial-quote" aria-hidden="true">&ldquo;</span>
      <div class="testimonial-stars" aria-label="Rating: ${t.rating} out of 5 stars">
        ${renderStars(t.rating)}
      </div>
      <blockquote class="testimonial-text">${escapeHtml(t.review)}</blockquote>
      <footer class="testimonial-author">
        <div class="testimonial-avatar" aria-hidden="true">${escapeHtml(t.avatar)}</div>
        <div>
          <p class="testimonial-name">${escapeHtml(t.name)}</p>
          <p class="testimonial-course">${escapeHtml(t.course)}</p>
        </div>
      </footer>
    </article>
  `;
}

async function loadTestimonials() {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;

  const { ok, data } = await apiFetch('/testimonials');

  if (!ok || !data.success) {
    grid.innerHTML = `<p class="error-state" role="alert">Unable to load testimonials.</p>`;
    return;
  }

  grid.setAttribute('aria-busy', 'false');
  grid.innerHTML = data.data.map(renderTestimonialCard).join('');
  initScrollReveal();
}

/* ══════════════════════════════════════════════════════════════════════════
   9. API: LOAD FAQS + ACCORDION
   ══════════════════════════════════════════════════════════════════════════ */
function renderFaqItem(faq, index) {
  const itemId = `faq-item-${faq.id}`;
  const btnId  = `faq-btn-${faq.id}`;
  const panelId = `faq-panel-${faq.id}`;

  return `
    <div class="faq-item" id="${itemId}">
      <button
        class="faq-question"
        id="${btnId}"
        aria-expanded="false"
        aria-controls="${panelId}"
      >
        <span>${escapeHtml(faq.question)}</span>
        <span class="faq-icon" aria-hidden="true">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <rect x="4.5" y="1" width="1" height="8" rx="0.5"/>
            <rect x="1" y="4.5" width="8" height="1" rx="0.5"/>
          </svg>
        </span>
      </button>
      <div class="faq-answer" id="${panelId}" role="region" aria-labelledby="${btnId}">
        <div class="faq-answer-inner">
          <p>${escapeHtml(faq.answer)}</p>
        </div>
      </div>
    </div>
  `;
}

function initFaqAccordion(container) {
  container.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');

      // Close all
      container.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
        openItem.classList.remove('is-open');
        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    // Keyboard support
    btn.addEventListener('keydown', (e) => {
      const items = [...container.querySelectorAll('.faq-question')];
      const idx = items.indexOf(btn);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[Math.min(idx + 1, items.length - 1)].focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); items[Math.max(idx - 1, 0)].focus(); }
      if (e.key === 'Home')      { e.preventDefault(); items[0].focus(); }
      if (e.key === 'End')       { e.preventDefault(); items[items.length - 1].focus(); }
    });
  });
}

async function loadFaqs() {
  const container = document.getElementById('faq-accordion');
  if (!container) return;

  const { ok, data } = await apiFetch('/faqs');

  if (!ok || !data.success) {
    container.innerHTML = `<p class="error-state" role="alert">Unable to load FAQs.</p>`;
    return;
  }

  container.setAttribute('aria-busy', 'false');
  container.innerHTML = data.data.map(renderFaqItem).join('');
  initFaqAccordion(container);
}

/* ══════════════════════════════════════════════════════════════════════════
   10. FORM VALIDATION HELPERS
   ══════════════════════════════════════════════════════════════════════════ */
function setFieldError(inputEl, errorEl, message) {
  inputEl.classList.add('is-invalid');
  inputEl.classList.remove('is-valid');
  inputEl.setAttribute('aria-invalid', 'true');
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove('is-invalid');
  inputEl.classList.add('is-valid');
  inputEl.setAttribute('aria-invalid', 'false');
  if (errorEl) errorEl.textContent = '';
}

function clearAllFieldStates(form) {
  form.querySelectorAll('.form-input').forEach((input) => {
    input.classList.remove('is-invalid', 'is-valid');
    input.removeAttribute('aria-invalid');
  });
  form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\d{10,15}$/.test(phone.replace(/[\s\-+()]/g, ''));
}

/** Shows a status message on the form */
function setFormStatus(statusEl, type, message) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `form-status is-${type}`;
}

function clearFormStatus(statusEl) {
  if (!statusEl) return;
  statusEl.textContent = '';
  statusEl.className = 'form-status';
}

/* ══════════════════════════════════════════════════════════════════════════
   11. CONTACT FORM
   ══════════════════════════════════════════════════════════════════════════ */
function validateContactForm(form) {
  const name    = form.querySelector('#contact-name');
  const email   = form.querySelector('#contact-email');
  const phone   = form.querySelector('#contact-phone');
  const message = form.querySelector('#contact-message');

  const nameErr    = form.querySelector('#contact-name-error');
  const emailErr   = form.querySelector('#contact-email-error');
  const phoneErr   = form.querySelector('#contact-phone-error');
  const messageErr = form.querySelector('#contact-message-error');

  let valid = true;

  if (!name.value.trim() || name.value.trim().length < 2 || name.value.trim().length > 50) {
    setFieldError(name, nameErr, 'Name must be between 2 and 50 characters.');
    valid = false;
  } else {
    clearFieldError(name, nameErr);
  }

  if (!isValidEmail(email.value.trim())) {
    setFieldError(email, emailErr, 'Please enter a valid email address.');
    valid = false;
  } else {
    clearFieldError(email, emailErr);
  }

  if (!isValidPhone(phone.value.trim())) {
    setFieldError(phone, phoneErr, 'Phone number must be 10–15 digits.');
    valid = false;
  } else {
    clearFieldError(phone, phoneErr);
  }

  if (!message.value.trim() || message.value.trim().length < 10 || message.value.trim().length > 1000) {
    setFieldError(message, messageErr, 'Message must be between 10 and 1000 characters.');
    valid = false;
  } else {
    clearFieldError(message, messageErr);
  }

  return valid;
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('#contact-submit');
  const statusEl  = form.querySelector('#contact-form-status');

  // Live validation on blur
  form.querySelectorAll('.form-input').forEach((input) => {
    input.addEventListener('blur', () => {
      validateContactForm(form);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormStatus(statusEl);

    if (!validateContactForm(form)) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const payload = {
      name:    form.querySelector('#contact-name').value.trim(),
      email:   form.querySelector('#contact-email').value.trim(),
      phone:   form.querySelector('#contact-phone').value.trim(),
      message: form.querySelector('#contact-message').value.trim(),
    };

    const { ok, data } = await apiFetch('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (ok && data.success) {
      setFormStatus(statusEl, 'success', data.message);
      form.reset();
      clearAllFieldStates(form);
    } else {
      const msg = data.errors?.join(' ') || data.message || 'Something went wrong. Please try again.';
      setFormStatus(statusEl, 'error', msg);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   12. NEWSLETTER FORM
   ══════════════════════════════════════════════════════════════════════════ */
function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const submitBtn = form.querySelector('.newsletter-btn');
  const statusEl  = form.querySelector('#newsletter-status');
  const emailInput = form.querySelector('#newsletter-email');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormStatus(statusEl);

    const email = emailInput.value.trim();
    if (!isValidEmail(email)) {
      setFormStatus(statusEl, 'error', 'Please enter a valid email address.');
      emailInput.classList.add('is-invalid');
      return;
    }

    emailInput.classList.remove('is-invalid');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing…';

    const { ok, data } = await apiFetch('/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (ok && data.success) {
      setFormStatus(statusEl, 'success', data.message);
      form.reset();
    } else {
      const msg = data.errors?.join(' ') || data.message || 'Something went wrong. Please try again.';
      setFormStatus(statusEl, 'error', msg);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Subscribe';
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   13. FOOTER YEAR
   ══════════════════════════════════════════════════════════════════════════ */
function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ══════════════════════════════════════════════════════════════════════════
   14. INIT
   ══════════════════════════════════════════════════════════════════════════ */
async function init() {
  // UI features (synchronous)
  initNavToggle();
  initSmoothScroll();
  initActiveNavHighlight();
  initScrollReveal();
  initContactForm();
  initNewsletterForm();
  setFooterYear();

  // API calls (parallel)
  await Promise.all([
    loadCourses(),
    loadStats(),
    loadTestimonials(),
    loadFaqs(),
  ]);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
