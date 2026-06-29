/**
 * SkillForge Academy — dashboard.js
 * Loads and renders the student learning dashboard.
 * Depends on auth.js (apiFetch, requireAuth, getStudent).
 */

'use strict';

const COURSE_EMOJI = { 'Web Development':'💻', 'Data Science':'📊', 'Python Programming':'🐍', 'Java Development':'☕', 'UI/UX Design':'🎨', 'Machine Learning':'🤖' };

function getEmoji(title) { return COURSE_EMOJI[title] || '📚'; }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Render enrolled courses with progress ──────────────────────────────── */
function renderEnrolledCourses(progressList) {
  const grid = document.getElementById('enrolled-grid');
  if (!grid) return;

  if (!progressList.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">📚</div>
        <h3>No courses yet</h3>
        <p>Browse the <a href="index.html#courses" style="color:var(--color-primary)">course catalogue</a> and enroll to get started.</p>
      </div>`;
    return;
  }

  grid.innerHTML = progressList.map((item) => {
    const { course, percentage, completedLessons, totalLessons } = item;
    const pct = percentage || 0;
    return `
      <a href="course.html?id=${course._id}" class="enrolled-card" aria-label="Continue ${course.title}">
        <div class="enrolled-card-emoji" aria-hidden="true">${getEmoji(course.title)}</div>
        <div class="enrolled-card-body">
          <h3 class="enrolled-card-title">${course.title}</h3>
          <div class="progress-bar-wrap">
            <div class="progress-bar-labels">
              <span>${completedLessons} of ${totalLessons} lessons</span>
              <span class="progress-pct">${pct}%</span>
            </div>
            <div class="progress-bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct}% complete">
              <div class="progress-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
          ${pct >= 60 ? '<span style="font-size:var(--text-xs);color:var(--color-success);font-weight:600;margin-top:var(--space-1);display:block">🏆 Certificate Unlocked</span>' : ''}
        </div>
      </a>`;
  }).join('');
}

/* ── Render certificates ────────────────────────────────────────────────── */
function renderCertificates(certs) {
  const grid    = document.getElementById('cert-grid');
  const section = document.getElementById('cert-section');
  if (!grid) return;

  if (!certs.length) {
    if (section) section.style.display = 'none';
    return;
  }

  if (section) section.style.display = 'block';

  grid.innerHTML = certs.map((cert) => `
    <div class="cert-card">
      <span class="cert-badge">Certificate</span>
      <p class="cert-title">${cert.courseTitle}</p>
      <p class="cert-number">ID: ${cert.certificateNumber}</p>
      <p class="cert-date">Issued: ${formatDate(cert.issuedAt)}</p>
    </div>`).join('');
}

/* ── Update stat counters ───────────────────────────────────────────────── */
function updateStats(progressList, certs) {
  const enrolled  = document.getElementById('stat-enrolled');
  const completed = document.getElementById('stat-completed');
  const certsEl   = document.getElementById('stat-certs');
  const avgEl     = document.getElementById('stat-avg');

  const completedCourses = progressList.filter((p) => p.percentage >= 60).length;
  const avgProgress = progressList.length
    ? Math.round(progressList.reduce((s, p) => s + p.percentage, 0) / progressList.length)
    : 0;

  if (enrolled)  enrolled.textContent  = progressList.length;
  if (completed) completed.textContent = completedCourses;
  if (certsEl)   certsEl.textContent   = certs.length;
  if (avgEl)     avgEl.textContent     = `${avgProgress}%`;
}

/* ── Main init ──────────────────────────────────────────────────────────── */
async function initDashboard() {
  if (!requireAuth()) return;

  const student = getStudent();
  const nameEl  = document.getElementById('dash-name');
  const avatarEl = document.getElementById('dash-avatar');
  if (nameEl)   nameEl.textContent   = student?.fullName || 'Student';
  if (avatarEl) avatarEl.textContent = student?.avatar  || student?.fullName?.slice(0,2).toUpperCase() || 'ST';

  // Load progress + certificates in parallel
  const [progressRes, certRes] = await Promise.all([
    apiFetch('/progress/dashboard'),
    apiFetch('/certificates'),
  ]);

  const progressList = progressRes.ok ? (progressRes.data.data || []) : [];
  const certs        = certRes.ok     ? (certRes.data.data || [])     : [];

  renderEnrolledCourses(progressList);
  renderCertificates(certs);
  updateStats(progressList, certs);

  // Remove loading spinners
  document.querySelectorAll('.lms-loading').forEach((el) => el.remove());
}

document.addEventListener('DOMContentLoaded', initDashboard);
