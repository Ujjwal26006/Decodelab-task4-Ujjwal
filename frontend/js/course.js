/**
 * SkillForge Academy — course.js
 * Powers the Course Details page (course.html).
 * Depends on auth.js for apiFetch, requireAuth, getStudent.
 *
 * Features:
 *  - Load course info + lessons grouped by module
 *  - Display active lesson content
 *  - Mark lesson complete → update progress bar
 *  - Auto-show certificate toast when 60% reached
 *  - Persist completed lessons visually across page reloads
 */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  courseId:          null,
  course:            null,
  modules:           [],
  completedIds:      new Set(),
  activeLessonId:    null,
  activeLesson:      null,
  totalLessons:      0,
  completedCount:    0,
};

const EMOJI_MAP = {
  'Web Development':     '💻',
  'Data Science':        '📊',
  'Python Programming':  '🐍',
  'Java Development':    '☕',
  'UI/UX Design':        '🎨',
  'Machine Learning':    '🤖',
};
const TYPE_ICON = { video: '▶️', reading: '📖', quiz: '📝', project: '🛠️' };

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  let toast = document.getElementById('lms-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lms-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent  = message;
  toast.className    = `toast is-${type}`;
  // Force reflow then animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('is-visible'));
  });
  setTimeout(() => toast.classList.remove('is-visible'), 3500);
}

// ── Progress bar update ────────────────────────────────────────────────────
function updateProgressUI(completed, total) {
  const pct     = total > 0 ? Math.round((completed / total) * 100) : 0;
  const fillEl  = document.getElementById('course-progress-fill');
  const pctEl   = document.getElementById('course-progress-pct');
  const countEl = document.getElementById('course-progress-count');
  const remEl   = document.getElementById('course-progress-remaining');

  if (fillEl)  fillEl.style.width  = `${pct}%`;
  if (fillEl)  fillEl.setAttribute('aria-valuenow', pct);
  if (pctEl)   pctEl.textContent   = `${pct}%`;
  if (countEl) countEl.textContent = `${completed} of ${total} lessons`;
  if (remEl)   remEl.textContent   = `${total - completed} remaining`;

  state.completedCount = completed;
}

// ── Lesson sidebar rendering ───────────────────────────────────────────────
function renderSidebar() {
  const container = document.getElementById('lesson-sidebar-body');
  if (!container) return;

  container.innerHTML = state.modules.map((mod) => {
    const lessonItems = mod.lessons.map((lesson) => {
      const done   = state.completedIds.has(lesson._id);
      const active = lesson._id === state.activeLessonId;
      return `
        <div
          class="lesson-item${done ? ' is-completed' : ''}${active ? ' is-active' : ''}"
          data-lesson-id="${lesson._id}"
          role="button"
          tabindex="0"
          aria-label="${done ? 'Completed: ' : ''}${lesson.title}"
          aria-current="${active ? 'true' : 'false'}"
        >
          <div class="lesson-check" aria-hidden="true">
            <svg class="lesson-check-icon" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="2,5 4,7.5 8,3"/>
            </svg>
          </div>
          <div class="lesson-item-info">
            <p class="lesson-item-title">${lesson.title}</p>
            <p class="lesson-item-duration">${TYPE_ICON[lesson.type] || '▶️'} ${lesson.duration}</p>
          </div>
        </div>`;
    }).join('');

    // Count completed in this module
    const modCompleted = mod.lessons.filter((l) => state.completedIds.has(l._id)).length;

    return `
      <div class="module-group${modCompleted > 0 ? ' is-open' : ''}" data-module-id="${mod._id}">
        <button class="module-header" aria-expanded="${modCompleted > 0 ? 'true' : 'false'}">
          <span>${mod.title}</span>
          <svg class="module-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </button>
        <div class="lesson-list" role="list">${lessonItems}</div>
      </div>`;
  }).join('');

  // Module accordion
  container.querySelectorAll('.module-header').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group    = btn.closest('.module-group');
      const isOpen   = group.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // Lesson click
  container.querySelectorAll('.lesson-item').forEach((item) => {
    const activate = () => loadLesson(item.dataset.lessonId);
    item.addEventListener('click', activate);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });
}

// ── Lesson viewer ──────────────────────────────────────────────────────────
function showLesson(lesson) {
  const titleEl   = document.getElementById('lesson-title');
  const typeEl    = document.getElementById('lesson-type');
  const bodyEl    = document.getElementById('lesson-body');
  const completeBtn = document.getElementById('btn-mark-complete');
  const durationEl  = document.getElementById('lesson-duration');

  if (titleEl)   titleEl.textContent  = lesson.title;
  if (typeEl)    typeEl.textContent   = `${TYPE_ICON[lesson.type] || '▶️'} ${lesson.type}`;
  if (durationEl) durationEl.textContent = lesson.duration;

  // Lesson body placeholder (in real LMS would embed video/markdown)
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="lesson-placeholder">
        <div class="lesson-placeholder-icon" aria-hidden="true">${TYPE_ICON[lesson.type] || '▶️'}</div>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:var(--text-xl);color:var(--color-text);margin-bottom:var(--space-2)">${lesson.title}</h3>
        <p style="max-width:480px;line-height:1.7">${lesson.description || 'Complete this lesson to track your progress.'}</p>
        <p style="margin-top:var(--space-4);font-size:var(--text-xs);color:var(--color-muted)">Duration: ${lesson.duration}</p>
      </div>`;
  }

  // Mark complete button state
  if (completeBtn) {
    const isDone = state.completedIds.has(lesson._id);
    completeBtn.textContent = isDone ? '✓ Completed' : 'Mark as Complete';
    completeBtn.className   = isDone ? 'btn-complete is-done' : 'btn-complete';
    completeBtn.disabled    = isDone;
    completeBtn.dataset.lessonId = lesson._id;
  }
}

function loadLesson(lessonId) {
  // Find lesson across all modules
  let found = null;
  for (const mod of state.modules) {
    found = mod.lessons.find((l) => l._id === lessonId);
    if (found) break;
  }
  if (!found) return;

  state.activeLessonId = lessonId;
  state.activeLesson   = found;

  showLesson(found);
  renderSidebar(); // refresh active states
}

// ── Mark lesson complete ───────────────────────────────────────────────────
async function handleMarkComplete() {
  const btn      = document.getElementById('btn-mark-complete');
  const lessonId = btn?.dataset.lessonId;
  if (!lessonId || btn?.disabled) return;

  btn.disabled    = true;
  btn.textContent = 'Saving…';

  const { ok, data } = await apiFetch(`/progress/lessons/${lessonId}/complete`, {
    method: 'PATCH',
  });

  if (!ok) {
    showToast(data?.message || 'Could not save progress. Try again.', 'error');
    btn.disabled    = false;
    btn.textContent = 'Mark as Complete';
    return;
  }

  // Update local state
  state.completedIds.add(lessonId);
  btn.textContent = '✓ Completed';
  btn.className   = 'btn-complete is-done';

  const { progress, certificate } = data.data;
  if (progress) {
    updateProgressUI(progress.completedLessons, progress.totalLessons);
  }

  showToast('Lesson completed! 🎉', 'success');

  // Certificate unlock notification
  if (certificate && !document.getElementById('cert-unlocked-banner')) {
    showToast(`🏆 Certificate unlocked for ${state.course?.title || 'this course'}!`, 'success');
    renderCertificateBanner(certificate);
  }

  renderSidebar();
}

// ── Certificate banner ─────────────────────────────────────────────────────
function renderCertificateBanner(cert) {
  const main = document.getElementById('course-main-content');
  if (!main || document.getElementById('cert-unlocked-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'cert-unlocked-banner';
  banner.innerHTML = `
    <div style="background:linear-gradient(135deg,#fdf6f0,#f5e6de);border:2px solid var(--color-primary-light);border-radius:var(--radius-lg);padding:var(--space-5) var(--space-6);margin-bottom:var(--space-6);display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;">
      <span style="font-size:2rem">🏆</span>
      <div style="flex:1">
        <p style="font-family:var(--font-heading);font-weight:700;font-size:var(--text-base);color:var(--color-text)">Certificate Unlocked!</p>
        <p style="font-size:var(--text-sm);color:var(--color-muted)">Certificate ID: <code style="font-size:0.75rem">${cert.certificateNumber}</code></p>
      </div>
      <a href="dashboard.html" class="btn btn-primary" style="font-size:var(--text-sm)">View on Dashboard</a>
    </div>`;

  main.prepend(banner);
}

// ── Load full course data ──────────────────────────────────────────────────
async function loadCourse() {
  const params = new URLSearchParams(window.location.search);
  state.courseId = params.get('id');

  if (!state.courseId) {
    window.location.href = 'index.html';
    return;
  }

  // Load course info + lessons + progress in parallel
  const [courseRes, lessonsRes, progressRes] = await Promise.all([
    apiFetch(`/courses/${state.courseId}`),
    apiFetch(`/courses/${state.courseId}/lessons`),
    apiFetch(`/progress/courses/${state.courseId}`),
  ]);

  if (!courseRes.ok) {
    document.getElementById('course-main-content').innerHTML =
      '<p class="empty-state">Course not found. <a href="index.html">Back to courses</a></p>';
    return;
  }

  // Not enrolled (lessonController returns 403 with this message — see
  // backend/controllers/lessonController.js). Matched on message text since
  // apiFetch's { ok, data } shape doesn't expose the numeric status code;
  // a more robust fix would have apiFetch pass the status through instead.
  const NOT_ENROLLED_MESSAGE = 'You must purchase this course to access its lessons.';
  if (!lessonsRes.ok && lessonsRes.data?.message === NOT_ENROLLED_MESSAGE) {
    document.getElementById('course-main-content').innerHTML = `
      <div class="empty-state">
        <h3>You haven't enrolled in this course yet</h3>
        <p>Purchase this course to unlock its lessons.</p>
        <a href="payment.html?courseId=${encodeURIComponent(state.courseId)}" class="btn btn-primary" style="margin-top:var(--space-4)">
          Enroll Now
        </a>
      </div>`;
    return;
  }

  state.course  = courseRes.data.data;
  state.modules = lessonsRes.ok ? (lessonsRes.data.data?.modules || []) : [];

  // Build completedIds set
  const completedArr = lessonsRes.ok ? (lessonsRes.data.data?.completedLessonIds || []) : [];
  state.completedIds = new Set(completedArr);

  // Total lessons
  state.totalLessons = state.modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);

  // Progress
  const progress = progressRes.ok ? progressRes.data.data : null;
  state.completedCount = progress?.completedLessons || state.completedIds.size;

  // Render course header
  renderCourseHeader();
  renderSidebar();
  updateProgressUI(state.completedCount, state.totalLessons);

  // Check existing certificate
  if (progress?.certificateUnlocked) {
    const certRes = await apiFetch('/certificates');
    if (certRes.ok) {
      const myCert = certRes.data.data?.find((c) => c.courseId?._id === state.courseId || c.courseId === state.courseId);
      if (myCert) renderCertificateBanner(myCert);
    }
  }

  // Auto-open first incomplete lesson
  let firstLesson = null;
  outer: for (const mod of state.modules) {
    for (const lesson of mod.lessons) {
      if (!state.completedIds.has(lesson._id)) {
        firstLesson = lesson;
        break outer;
      }
    }
  }
  // Fallback: open first lesson of first module
  if (!firstLesson && state.modules[0]?.lessons[0]) {
    firstLesson = state.modules[0].lessons[0];
  }

  if (firstLesson) loadLesson(firstLesson._id);

  // Remove loading spinner
  document.getElementById('lessons-loading')?.remove();
}

// ── Course header ──────────────────────────────────────────────────────────
function renderCourseHeader() {
  const c = state.course;
  if (!c) return;

  const titleEl    = document.getElementById('course-title');
  const descEl     = document.getElementById('course-desc');
  const catEl      = document.getElementById('course-category');
  const durEl      = document.getElementById('course-duration');
  const totalEl    = document.getElementById('course-total-lessons');
  const breadEl    = document.getElementById('breadcrumb-course');
  const pageTitle  = document.querySelector('title');
  const emojiEl    = document.getElementById('course-emoji');

  if (titleEl)   titleEl.textContent  = c.title;
  if (descEl)    descEl.textContent   = c.description;
  if (catEl)     catEl.textContent    = c.category;
  if (durEl)     durEl.textContent    = c.duration;
  if (totalEl)   totalEl.textContent  = `${state.totalLessons} lessons`;
  if (breadEl)   breadEl.textContent  = c.title;
  if (pageTitle) pageTitle.textContent = `${c.title} — SkillForge Academy`;
  if (emojiEl)   emojiEl.textContent  = EMOJI_MAP[c.title] || '📚';
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  if (!requireAuth()) return;

  await loadCourse();

  // Mark complete button
  document.getElementById('btn-mark-complete')?.addEventListener('click', handleMarkComplete);
}

document.addEventListener('DOMContentLoaded', init);
