/**
 * SkillForge Academy — payment.js
 * Powers the checkout page (payment.html).
 * Depends on auth.js (apiFetch, requireAuth, getStudent, getToken).
 *
 * Flow:
 *   1. Read ?courseId= from the URL
 *   2. GET /payments/initiate/:courseId  → render course + price summary
 *   3. On submit, POST /payments/verify  → auto-enrolls on success
 *   4. Redirect to dashboard.html (fresh load — dashboard.js re-fetches
 *      progress from the server, so the enrolled-course count is always
 *      up to date immediately, with no stale-cache risk)
 */

'use strict';

const COURSE_EMOJI = {
  'Web Development':    '💻',
  'Data Science':       '📊',
  'Python Programming': '🐍',
  'Java Development':   '☕',
  'UI/UX Design':       '🎨',
  'Machine Learning':   '🤖',
};

function getEmojiFor(title) {
  return COURSE_EMOJI[title] || '📚';
}

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

/** Shared state for the page */
const paymentState = {
  courseId: null,
  summary: null,
};

/** Shows the error panel with a specific message and hides everything else. */
function showPaymentError(message) {
  document.getElementById('payment-loading')?.remove();
  const content = document.getElementById('payment-content');
  const errorState = document.getElementById('payment-error-state');
  const errorMsg = document.getElementById('payment-error-message');
  if (content) content.style.display = 'none';
  if (errorMsg) errorMsg.textContent = message;
  if (errorState) errorState.style.display = 'block';
}

/** Renders the course summary + price breakdown once the API responds. */
function renderPaymentSummary(summary) {
  const emojiEl      = document.getElementById('payment-course-emoji');
  const titleEl      = document.getElementById('payment-course-title');
  const instrEl      = document.getElementById('payment-instructor');
  const priceEl      = document.getElementById('payment-price');
  const discountRow  = document.getElementById('payment-discount-row');
  const discountEl   = document.getElementById('payment-discount');
  const finalEl      = document.getElementById('payment-final-amount');

  if (emojiEl) emojiEl.textContent = getEmojiFor(summary.courseTitle);
  if (titleEl) titleEl.textContent = summary.courseTitle;
  if (instrEl) instrEl.textContent = `Instructor: ${summary.instructorName}`;
  if (priceEl) priceEl.textContent = formatINR(summary.price);

  if (summary.discountAmount > 0) {
    if (discountRow) discountRow.style.display = 'flex';
    if (discountEl) discountEl.textContent = `− ${formatINR(summary.discountAmount)}`;
  }

  if (finalEl) finalEl.textContent = formatINR(summary.finalAmount);

  document.getElementById('payment-loading')?.remove();
  const content = document.getElementById('payment-content');
  if (content) content.style.display = 'block';
}

/** Loads the payment summary for the course in the URL's ?courseId= param. */
async function loadPaymentSummary() {
  const params = new URLSearchParams(window.location.search);
  paymentState.courseId = params.get('courseId');

  if (!paymentState.courseId) {
    showPaymentError('No course was specified. Please go back and choose a course to enroll in.');
    return;
  }

  const { ok, data } = await apiFetch(`/payments/initiate/${paymentState.courseId}`);

  if (!ok || !data?.success) {
    const message = data?.message || 'Unable to load checkout for this course.';
    showPaymentError(message);
    return;
  }

  paymentState.summary = data.data;
  renderPaymentSummary(paymentState.summary);
}

/** Wires up the payment form submit handler. */
function initPaymentForm() {
  const form      = document.getElementById('payment-form');
  const submitBtn = document.getElementById('payment-submit');
  const statusEl  = document.getElementById('payment-form-status');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (statusEl) {
      statusEl.className = 'form-status';
      statusEl.textContent = '';
    }

    const selected = form.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = selected ? selected.value : null;

    if (!paymentMethod) {
      if (statusEl) {
        statusEl.className = 'form-status is-error';
        statusEl.textContent = 'Please choose a payment method.';
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing payment…';

    const { ok, data } = await apiFetch('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({
        courseId: paymentState.courseId,
        paymentMethod,
      }),
    });

    if (ok && data?.success) {
      if (statusEl) {
        statusEl.className = 'form-status is-success';
        statusEl.textContent = data.message || 'Payment successful! Redirecting to your dashboard…';
      }
      submitBtn.textContent = 'Enrolled! Redirecting…';

      // Full page redirect — dashboard.js fetches progress fresh from the
      // server on load, so the enrolled-course count reflects this
      // enrollment immediately, with no caching to invalidate.
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
      return;
    }

    const message = data?.errors?.join(' ') || data?.message || 'Payment failed. Please try again.';
    if (statusEl) {
      statusEl.className = 'form-status is-error';
      statusEl.textContent = message;
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'Pay & Enroll Now';
  });
}

async function initPaymentPage() {
  if (!requireAuth()) return; // redirects to login.html if not authenticated
  await loadPaymentSummary();
  initPaymentForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPaymentPage);
} else {
  initPaymentPage();
}
