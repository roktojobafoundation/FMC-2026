/* admin-ui.js — loads AFTER admin.js.
   Adds: navigation, live dashboard data, charts, volunteer actions, reports,
   CSV export, settings, responsive helpers. Overrides a few broken functions in admin.js. */
(function () {
    'use strict';

    /* ---------- Helpers (fallbacks only if main-fixed.js did not define them) ---------- */
    const $ = (id) => document.getElementById(id);
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    window.esc = esc;

    const toDate = (v) => {
        if (!v) return null;
        if (typeof v.toDate === 'function') return v.toDate();
        if (v.seconds) return new Date(v.seconds * 1000);
        const d = new Date(v);
        return isNaN(d) ? null : d;
    };
    const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeStr = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (typeof window.showAlert !== 'function') {
        window.showAlert = function (message, type = 'info') {
            const box = $('alertContainer');
            if (!box) return;
            const el = document.createElement('div');
            el.className = `alert alert-${type}`;
            el.innerHTML = `<span>${esc(message)}</span><button class="alert-close" aria-label="Dismiss">&times;</button>`;
            el.querySelector('button').onclick = () => el.remove();
            box.appendChild(el);
            setTimeout(() => el.remove(), 4500);
        };
    }
    if (typeof window.calculatePatientStatus !== 'function') {
        window.calculatePatientStatus = (p) => p.checkupCompleted ? 'Completed' : p.checkupStarted ? 'Under Checkup' : 'Waiting';
    }
    if (typeof window.formatPhoneNumber !== 'function') {
        window.formatPhoneNumber = (p) => p || '-';
    }
    if (typeof window.formatFirestoreTimestamp !== 'function') {
        window.formatFirestoreTimestamp = (v) => {
            const d = toDate(v);
            return d ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
        };
    }
    const statusOf = (p) => window.calculatePatientStatus(p);

    /* ---------- Shared data (kept in sync by Firestore listeners) ---------- */
    const state = { patients: [], doctors: [], volunteers: [] };
    const charts = {};
    let listening = false;

    /* ---------- Responsive sidebar (replaces admin.js version) ---------- */
    window.initSidebarToggle = function () {
        const sidebar = $('adminSidebar'), main = document.querySelector('.admin-main');
        const backdrop = $('sidebarBackdrop');
        const desktopToggle = document.querySelector('.sidebar-toggle');
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (!sidebar || sidebar.dataset.bound) return;
        sidebar.dataset.bound = '1';

        const setOpen = (open) => {
            sidebar.classList.toggle('active', open);
            backdrop.classList.toggle('show', open);
            mobileToggle?.setAttribute('aria-expanded', open);
        };
        try { if (localStorage.getItem('adminSidebarCollapsed') === '1') { sidebar.classList.add('collapsed'); main.classList.add('expanded'); } } catch (e) { }

        desktopToggle?.addEventListener('click', () => {
            const c = sidebar.classList.toggle('collapsed');
            main.classList.toggle('expanded', c);
            try { localStorage.setItem('adminSidebarCollapsed', c ? '1' : '0'); } catch (e) { }
            setTimeout(resizeCharts, 260);
        });
        mobileToggle?.addEventListener('click', () => setOpen(!sidebar.classList.contains('active')));
        backdrop.addEventListener('click', () => setOpen(false));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
        window.addEventListener('resize', () => { if (innerWidth > 992) setOpen(false); });
        sidebar.addEventListener('click', (e) => { if (e.target.closest('.nav-link')) setOpen(false); });
    };

    /* ---------- Navigation (hash based, so back button & refresh work) ---------- */
    const SECTIONS = { dashboard: 'Dashboard', patients: 'Patients', doctors: 'Doctors', volunteers: 'Volunteers', reports: 'Reports', settings: 'Settings' };
    function showSection(name) {
        if (!SECTIONS[name]) name = 'dashboard';
        document.querySelectorAll('.dashboard-section').forEach(s => s.hidden = (s.id !== `${name}Section`));
        document.querySelectorAll('.nav-link').forEach(l => {
            const on = l.id === `${name}Link`;
            l.classList.toggle('active', on);
            on ? l.setAttribute('aria-current', 'page') : l.removeAttribute('aria-current');
        });
        $('pageTitle').textContent = SECTIONS[name];
        document.title = `${SECTIONS[name]} | Roktojoba Admin`;
        scrollTo({ top: 0 });
        if (name === 'dashboard') setTimeout(resizeCharts, 30);
        if (name === 'reports') generateReport();
    }
    function initNavigation() {
        const go = () => showSection((location.hash || '#dashboard').slice(1));
        document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', (e) => {
            e.preventDefault();
            const target = l.getAttribute('href');
            if (location.hash === target) showSection(target.slice(1)); else location.hash = target;
        }));
        window.addEventListener('hashchange', go);
        go();
    }

    /* ---------- Dashboard rendering ---------- */
    const pct = (n, t) => t ? Math.round(n / t * 100) : 0;
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };

    function renderDashboard() {
        const P = state.patients, D = state.doctors, V = state.volunteers;
        const st = { Waiting: 0, 'Under Checkup': 0, Completed: 0 };
        P.forEach(p => st[statusOf(p)]++);
        const total = P.length;

        set('totalPatientsCount', total);
        set('waitingPatientsCount', st.Waiting);
        set('ongoingPatientsCount', st['Under Checkup']);
        set('completedPatientsCount', st.Completed);
        set('totalDoctorsCount', D.filter(d => d.isActive !== false).length);
        set('totalVolunteersCount', V.length);
        set('completionRate', pct(st.Completed, total) + '%');

        const waits = P.filter(p => p.checkupCompleted && p.waitTime).map(p => +p.waitTime);
        set('avgWaitTime', (waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0) + ' min');

        // badges
        set('patientBadge', total); set('doctorBadge', D.length); set('volunteerBadge', V.length);

        // flow bar
        set('flowTotal', total);
        $('flowWaiting').style.width = pct(st.Waiting, total) + '%';
        $('flowOngoing').style.width = pct(st['Under Checkup'], total) + '%';
        $('flowDone').style.width = pct(st.Completed, total) + '%';
        set('lgWaiting', st.Waiting); set('lgOngoing', st['Under Checkup']); set('lgDone', st.Completed);
        set('flowSummary', total ? `${pct(st.Completed, total)}% of patients seen` : 'No patients yet');

        // doctor + volunteer cards
        const act = D.filter(d => d.isActive !== false);
        const docTimes = D.filter(d => d.avgCheckupTime).map(d => +d.avgCheckupTime);
        set('avgCheckupTimeDoctor', (docTimes.length ? Math.round(docTimes.reduce((a, b) => a + b, 0) / docTimes.length) : 0) + ' min');
        set('totalDoctorsSmall', D.length); set('activeDoctorsSmall', act.length);
        set('avgPatientsPerDoctor', act.length ? Math.round(total / act.length) : 0);
        const hrs = V.filter(v => v.availableHours).map(v => +v.availableHours);
        set('totalVolunteersSmall', V.length);
        set('checkedInVolunteers', V.filter(v => v.checkedIn).length);
        set('assignedVolunteers', V.filter(v => v.assignedTask).length);
        set('avgHoursVolunteer', (hrs.length ? (hrs.reduce((a, b) => a + b, 0) / hrs.length).toFixed(1).replace('.0', '') : 0) + ' hrs');

        set('updateTime', new Date().toLocaleTimeString());
        updateCharts(st);
        renderActivity();
    }

    // Replaces admin.js version (which ran 4 separate queries and never refreshed charts)
    window.updateDashboardStats = async function () {
        if (listening) return renderDashboard();
        try {
            const [p, d, v] = await Promise.all(['patients', 'doctors', 'volunteers'].map(c => db.collection(c).get()));
            state.patients = p.docs.map(x => ({ id: x.id, ...x.data() }));
            state.doctors = d.docs.map(x => ({ id: x.id, ...x.data() }));
            state.volunteers = v.docs.map(x => ({ id: x.id, ...x.data() }));
            renderDashboard();
        } catch (err) { console.error('Dashboard stats error:', err); }
    };

    /* ---------- Charts ---------- */
    const baseOpts = { responsive: true, maintainAspectRatio: false };
    window.initCharts = function () {
        if (typeof Chart === 'undefined') return;
        const status = $('patientStatusChart'), daily = $('dailyRegistrationChart');
        if (status && !charts.status) charts.status = new Chart(status, {
            type: 'doughnut',
            data: { labels: ['Waiting', 'Under Checkup', 'Completed'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#e0a526', '#3d6fa5', '#2a9d8f'], borderWidth: 2 }] },
            options: { ...baseOpts, cutout: '62%', plugins: { legend: { position: 'bottom' } } }
        });
        if (daily && !charts.daily) charts.daily = new Chart(daily, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Registrations', data: [], backgroundColor: '#e63946', borderRadius: 6, maxBarThickness: 38 }] },
            options: { ...baseOpts, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }
        });
    };
    function dayBuckets(patients, from, to) {
        const labels = [], keys = [];
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) { keys.push(ymd(d)); labels.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })); }
        const counts = keys.map(() => 0);
        patients.forEach(p => { const d = toDate(p.registrationDate); if (d) { const i = keys.indexOf(ymd(d)); if (i > -1) counts[i]++; } });
        return { labels, counts };
    }
    function updateCharts(st) {
        window.initCharts();
        if (charts.status) { charts.status.data.datasets[0].data = [st.Waiting, st['Under Checkup'], st.Completed]; charts.status.update(); }
        if (charts.daily) {
            const to = new Date(), from = new Date(); from.setDate(to.getDate() - 6);
            const b = dayBuckets(state.patients, from, to);
            charts.daily.data.labels = b.labels; charts.daily.data.datasets[0].data = b.counts; charts.daily.update();
        }
    }
    function resizeCharts() { Object.values(charts).forEach(c => c && c.resize()); }

    /* ---------- Recent activity (built from real records) ---------- */
    function renderActivity() {
        const tb = $('activityTableBody'); if (!tb) return;
        const ev = [];
        state.patients.forEach(p => {
            const d = toDate(p.registrationDate); if (d) ev.push([d, 'New patient registered', p.fullName, `Registration ID: ${p.registrationId || '-'}`]);
            const c = toDate(p.checkupCompletedTime || p.checkupCompletedAt || p.completedAt); if (c) ev.push([c, 'Checkup completed', p.fullName, p.assignedDoctor ? `Doctor: ${p.assignedDoctor}` : '-']);
        });
        state.volunteers.forEach(v => {
            const c = toDate(v.checkedInTime); if (c) ev.push([c, 'Volunteer checked in', v.fullName, v.assignedTask || v.preferredArea || '-']);
            const r = toDate(v.createdAt); if (r) ev.push([r, 'Volunteer registered', v.fullName, v.preferredArea || '-']);
        });
        state.doctors.forEach(d => { const c = toDate(d.createdAt); if (c) ev.push([c, 'Doctor added', 'Dr. ' + d.fullName, d.specialization || '-']); });
        ev.sort((a, b) => b[0] - a[0]);
        tb.innerHTML = ev.length ? ev.slice(0, 10).map(e =>
            `<tr><td>${ymd(e[0]) === ymd(new Date()) ? '' : e[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', '}${timeStr(e[0])}</td><td>${esc(e[1])}</td><td>${esc(e[2])}</td><td>${esc(e[3])}</td></tr>`).join('')
            : '<tr><td colspan="4" class="text-center">No activity yet</td></tr>';
    }

    /* ---------- Live listeners (replaces admin.js version: one listener per collection, no duplicate loads, respects filters) ---------- */
    window.setupRealtimeListeners = function () {
        if (listening) return;
        listening = true;
        const timers = {};
        const later = (k, fn) => { clearTimeout(timers[k]); timers[k] = setTimeout(fn, 400); };
        const hasFilters = () => ['patientSearch', 'patientStatusFilter', 'patientDoctorFilter'].some(id => ($(id)?.value || '').trim());

        const watch = (col, key, refresh) => {
            let first = true;
            db.collection(col).onSnapshot(snap => {
                state[key] = snap.docs.map(x => ({ id: x.id, ...x.data() }));
                renderDashboard();
                if (first) { first = false; return; }          // initial table load is done by init*Management()
                later(key, refresh);
            }, err => console.error(`${col} listener:`, err));
        };
        watch('patients', 'patients', () => hasFilters() && window.applyPatientFilters ? window.applyPatientFilters() : window.loadPatientsTable?.());
        watch('doctors', 'doctors', () => window.loadDoctorsTable?.());
        watch('volunteers', 'volunteers', () => window.loadVolunteersTable?.());
    };

    // admin.js bound search twice (two competing handlers) and called an undefined function — neutralise
    window.initPatientSearch = function () { };
    window.initPatientActions = function () { };

    /* ---------- Responsive tables: add data-labels so rows can stack as cards ---------- */
    function labelTable(table) {
        const heads = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
        table.querySelectorAll('tbody tr').forEach(tr => {
            [...tr.children].forEach((td, i) => { if (!td.hasAttribute('colspan') && heads[i]) td.dataset.label = heads[i]; });
        });
    }
    function initTableObservers() {
        document.querySelectorAll('.data-table').forEach(t => {
            labelTable(t);
            new MutationObserver(() => {
                labelTable(t);
                if (t.id === 'patientsTable') {
                    const n = [...t.querySelectorAll('tbody tr')].filter(r => !r.querySelector('td[colspan]')).length;
                    set('patientCount', `${n} patient${n === 1 ? '' : 's'}`);
                }
            }).observe(t.querySelector('tbody'), { childList: true });
        });
    }

    /* ---------- Volunteer actions (buttons had no handlers before) ---------- */
    function initVolunteerActions() {
        document.addEventListener('click', async (e) => {
            const view = e.target.closest('.view-volunteer'), edit = e.target.closest('.edit-volunteer'), tog = e.target.closest('.toggle-checkin');
            if (view) viewVolunteer(view.dataset.id);
            if (edit) editVolunteer(edit.dataset.id);
            if (tog) toggleCheckIn(tog.dataset.id, tog.dataset.checked === 'true');
        });
    }
    const row = (k, v) => `<p><strong>${k}</strong> ${esc(v || '-')}</p>`;
    async function getVolunteer(id) {
        const snap = await db.collection('volunteers').doc(id).get();
        if (!snap.exists) { showAlert('Volunteer not found', 'danger'); return null; }
        return snap.data();
    }
    async function viewVolunteer(id) {
        try {
            const v = await getVolunteer(id); if (!v) return;
            showModal(`
                <div class="modal-header"><h3>Volunteer details</h3><button class="modal-close" aria-label="Close">&times;</button></div>
                <div class="modal-body"><div class="patient-details-grid">
                    <div class="detail-group"><h4>Personal</h4>${row('Name:', v.fullName)}${row('Age:', v.age)}${row('Gender:', v.gender)}${row('Phone:', v.phone)}${row('Email:', v.email)}${row('Address:', v.address)}${row('Education:', v.education)}${row('Emergency:', v.emergencyContact)}</div>
                    <div class="detail-group"><h4>Service</h4>${row('Preferred area:', v.preferredArea)}${row('Experience:', v.experience)}${row('Available hours:', v.availableHours)}${row('Skills:', v.specialSkills)}${row('Assigned task:', v.assignedTask)}${row('Status:', v.status)}${row('Checked in:', v.checkedIn ? formatFirestoreTimestamp(v.checkedInTime) : 'No')}</div>
                </div></div>
                <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>`);
        } catch (err) { console.error(err); showAlert('Could not load volunteer', 'danger'); }
    }
    async function editVolunteer(id) {
        try {
            const v = await getVolunteer(id); if (!v) return;
            showModal(`
                <div class="modal-header"><h3>Edit volunteer</h3><button class="modal-close" aria-label="Close">&times;</button></div>
                <div class="modal-body"><form class="modal-form" id="editVolunteerForm">
                    <div class="form-row"><div class="form-group"><label class="form-label">Full name</label><input class="form-control" name="fullName" value="${esc(v.fullName)}" required></div>
                    <div class="form-group"><label class="form-label">Phone</label><input class="form-control" name="phone" value="${esc(v.phone)}" required></div></div>
                    <div class="form-row"><div class="form-group"><label class="form-label">Preferred area</label><input class="form-control" name="preferredArea" value="${esc(v.preferredArea)}"></div>
                    <div class="form-group"><label class="form-label">Assigned task</label><input class="form-control" name="assignedTask" value="${esc(v.assignedTask)}" placeholder="e.g. Registration desk"></div></div>
                    <div class="form-row"><div class="form-group"><label class="form-label">Available hours</label><input type="number" min="1" max="24" class="form-control" name="availableHours" value="${esc(v.availableHours)}"></div>
                    <div class="form-group"><label class="form-label">Status</label><select class="form-control" name="status">${['Registered', 'Active', 'Inactive'].map(s => `<option ${v.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
                </form></div>
                <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="saveVolunteerBtn">Save changes</button></div>`);
            $('saveVolunteerBtn').addEventListener('click', async function () {
                const form = $('editVolunteerForm');
                if (!form.reportValidity()) return;
                const f = Object.fromEntries(new FormData(form));
                f.availableHours = parseInt(f.availableHours) || 0;
                f.lastActivity = new Date();
                this.disabled = true;
                try {
                    await db.collection('volunteers').doc(id).update(f);
                    showAlert('Volunteer updated', 'success'); closeModal(); window.loadVolunteersTable?.();
                } catch (err) { console.error(err); showAlert('Update failed: ' + err.message, 'danger'); this.disabled = false; }
            });
        } catch (err) { console.error(err); showAlert('Could not load volunteer', 'danger'); }
    }
    async function toggleCheckIn(id, wasIn) {
        try {
            await db.collection('volunteers').doc(id).update({
                checkedIn: !wasIn, checkedInTime: wasIn ? null : new Date(), status: wasIn ? 'Registered' : 'Active', lastActivity: new Date()
            });
            showAlert(wasIn ? 'Volunteer checked out' : 'Volunteer checked in', 'success');
            window.loadVolunteersTable?.();
        } catch (err) { console.error(err); showAlert('Check-in failed: ' + err.message, 'danger'); }
    }

    /* ---------- CSV helpers ---------- */
    function downloadCSV(name, rows) {
        const csv = '\ufeff' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = name; document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
    function exportPatients() {
        if (!state.patients.length) return showAlert('No patients to export', 'warning');
        const head = ['Registration ID', 'Name', 'Age', 'Gender', 'Phone', 'Blood Group', 'Address', 'Registered', 'Status', 'Assigned Doctor'];
        const rows = state.patients.map(p => [p.registrationId, p.fullName, p.age, p.gender, p.phone, p.bloodGroup, p.address, toDate(p.registrationDate)?.toLocaleString('en-GB') || '', statusOf(p), p.assignedDoctor || '']);
        downloadCSV(`patients-${ymd(new Date())}.csv`, [head, ...rows]);
        showAlert(`Exported ${rows.length} patients`, 'success');
    }

    /* ---------- Reports (computed from live data) ---------- */
    let lastReport = null;
    const avg = (a) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
    function countBy(arr, fn) { const m = {}; arr.forEach(x => { const k = fn(x) || 'Unknown'; m[k] = (m[k] || 0) + 1; }); return m; }

    function generateReport() {
        const type = $('reportType').value;
        const from = new Date($('reportStartDate').value + 'T00:00:00'), to = new Date($('reportEndDate').value + 'T23:59:59');
        if (isNaN(from) || isNaN(to) || from > to) return showAlert('Please choose a valid date range', 'warning');

        const P = state.patients.filter(p => { const d = toDate(p.registrationDate); return d && d >= from && d <= to; });
        const done = P.filter(p => statusOf(p) === 'Completed');
        let stats = [], chart = { type: 'bar', labels: [], data: [], label: '' }, summary = '', title = '';

        if (type === 'daily') {
            title = 'Daily Summary';
            const b = dayBuckets(P, from, to);
            stats = [['Registered', P.length], ['Completed', done.length], ['Still waiting', P.filter(p => statusOf(p) === 'Waiting').length], ['Avg. wait (min)', avg(done.filter(p => p.waitTime).map(p => +p.waitTime))]];
            chart = { type: 'line', labels: b.labels, data: b.counts, label: 'Registrations' };
            const peak = b.counts.indexOf(Math.max(...b.counts, 0));
            summary = P.length ? `${P.length} patients registered in this period and ${done.length} (${pct(done.length, P.length)}%) have completed their checkup. Busiest day: ${b.labels[peak]} with ${b.counts[peak]} registrations.` : 'No registrations in this period.';
        } else if (type === 'patient') {
            title = 'Patient Analysis';
            const g = countBy(P, p => p.gender), ages = P.map(p => +p.age).filter(Boolean);
            const groups = { '0-17': 0, '18-35': 0, '36-55': 0, '56+': 0 };
            ages.forEach(a => groups[a < 18 ? '0-17' : a < 36 ? '18-35' : a < 56 ? '36-55' : '56+']++);
            stats = [['Patients', P.length], ['Avg. age', avg(ages)], ...Object.entries(g).map(([k, v]) => [k, v])];
            chart = { type: 'bar', labels: Object.keys(groups), data: Object.values(groups), label: 'Patients by age group' };
            summary = P.length ? `Gender split: ${Object.entries(g).map(([k, v]) => `${k} ${pct(v, P.length)}%`).join(', ')}. Average age is ${avg(ages)} years.` : 'No patients in this period.';
        } else if (type === 'doctor') {
            title = 'Doctor Performance';
            const rows = state.doctors.map(d => {
                const n = P.filter(p => p.assignedDoctor && [d.fullName, d.doctorId, d.id, 'Dr. ' + d.fullName].some(k => k && String(p.assignedDoctor).includes(k))).length;
                return [d.fullName, n];
            });
            const assigned = rows.reduce((s, r) => s + r[1], 0);
            stats = [['Doctors', state.doctors.length], ['Active', state.doctors.filter(d => d.isActive !== false).length], ['Patients assigned', assigned], ['Unassigned', Math.max(0, P.length - assigned)]];
            chart = { type: 'bar', labels: rows.map(r => 'Dr. ' + r[0]), data: rows.map(r => r[1]), label: 'Patients assigned' };
            const top = [...rows].sort((a, b) => b[1] - a[1])[0];
            summary = top && top[1] ? `Most patients assigned: Dr. ${top[0]} (${top[1]}).` : 'No doctor assignments in this period.';
        } else {
            title = 'Volunteer Report';
            const V = state.volunteers, areas = countBy(V, v => v.preferredArea);
            stats = [['Volunteers', V.length], ['Checked in', V.filter(v => v.checkedIn).length], ['Tasks assigned', V.filter(v => v.assignedTask).length], ['Avg. hours', avg(V.map(v => +v.availableHours).filter(Boolean))]];
            chart = { type: 'bar', labels: Object.keys(areas), data: Object.values(areas), label: 'Volunteers by preferred area' };
            summary = V.length ? `${V.filter(v => v.checkedIn).length} of ${V.length} volunteers are checked in.` : 'No volunteers registered yet.';
        }

        set('reportTitle', 'Roktojoba Foundation · ' + title);
        set('reportRange', `${from.toLocaleDateString('en-GB', { dateStyle: 'long' })} – ${to.toLocaleDateString('en-GB', { dateStyle: 'long' })}`);
        $('reportStats').innerHTML = stats.map(s => `<div class="report-stat"><b>${esc(s[1])}</b><span>${esc(s[0])}</span></div>`).join('');
        set('reportSummary', summary);

        if (charts.report) charts.report.destroy();
        if (typeof Chart !== 'undefined') charts.report = new Chart($('reportChart'), {
            type: chart.type,
            data: { labels: chart.labels, datasets: [{ label: chart.label, data: chart.data, backgroundColor: chart.type === 'line' ? 'rgba(230,57,70,.12)' : '#3d6fa5', borderColor: '#e63946', fill: chart.type === 'line', tension: .35, borderRadius: 6, maxBarThickness: 46 }] },
            options: { ...baseOpts, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
        lastReport = { title, stats, chart, summary, from, to };
    }
    function exportReport() {
        if (!lastReport) generateReport();
        if (!lastReport) return;
        const r = lastReport;
        downloadCSV(`report-${r.title.toLowerCase().replace(/\s+/g, '-')}-${ymd(new Date())}.csv`,
            [[r.title], [ymd(r.from) + ' to ' + ymd(r.to)], [], ['Metric', 'Value'], ...r.stats, [], [r.chart.label, 'Count'], ...r.chart.labels.map((l, i) => [l, r.chart.data[i]]), [], ['Summary', r.summary]]);
    }
    function initReports() {
        const to = new Date(), from = new Date(); from.setDate(to.getDate() - 6);
        $('reportStartDate').value = ymd(from); $('reportEndDate').value = ymd(to);
        $('generateReport').addEventListener('click', generateReport);
        $('reportType').addEventListener('change', generateReport);
        $('printReportBtn').addEventListener('click', () => { generateReport(); setTimeout(() => window.print(), 300); });
        $('exportReportBtn').addEventListener('click', exportReport);
    }

    /* ---------- Settings (saved on this device; also synced to Firestore when rules allow) ---------- */
    function initSettings() {
        const tabs = document.querySelectorAll('.tab-btn'), panes = document.querySelectorAll('.tab-content');
        tabs.forEach(b => b.addEventListener('click', () => {
            tabs.forEach(x => x.classList.toggle('active', x === b));
            panes.forEach(p => p.classList.toggle('active', p.id === `${b.dataset.tab}Tab`));
        }));

        document.querySelectorAll('form[data-group]').forEach(form => {
            const key = 'rjf_settings_' + form.dataset.group;
            try {
                const saved = JSON.parse(localStorage.getItem(key) || 'null');
                if (saved) [...form.elements].forEach(el => {
                    if (!el.name || !(el.name in saved)) return;
                    el.type === 'checkbox' ? el.checked = !!saved[el.name] : el.value = saved[el.name];
                });
            } catch (e) { }
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {};
                [...form.elements].forEach(el => { if (el.name) data[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
                try { localStorage.setItem(key, JSON.stringify(data)); } catch (err) { }
                try {
                    await db.collection('settings').doc(form.dataset.group).set({ ...data, updatedAt: new Date() }, { merge: true });
                    showAlert('Settings saved', 'success');
                } catch (err) {
                    console.warn('Settings sync skipped:', err.message);
                    showAlert('Settings saved on this device', 'success');
                }
            });
        });

        let auth0 = {}; try { auth0 = JSON.parse(localStorage.getItem('adminAuth') || '{}'); } catch (e) { }
        set('acctName', auth0.displayName || (auth0.email || '').split('@')[0] || '-');
        set('acctEmail', auth0.email || '-');
        $('changeAdminPwBtn').addEventListener('click', async () => {
            if (!auth0.email || typeof auth === 'undefined') return showAlert('Admin email not available', 'warning');
            try { await auth.sendPasswordResetEmail(auth0.email); showAlert('Password reset email sent to ' + auth0.email, 'success'); }
            catch (err) { showAlert('Could not send email: ' + err.message, 'danger'); }
        });
    }

    /* ---------- Boot ---------- */
    document.addEventListener('DOMContentLoaded', function () {
        $('todayDate').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (typeof updateUserInfoFromStorage === 'function') updateUserInfoFromStorage();

        window.initSidebarToggle();      // admin.js also calls it; guarded against double binding
        initNavigation();
        initTableObservers();
        initVolunteerActions();
        initReports();
        initSettings();

        $('refreshActivity').addEventListener('click', function () {
            this.disabled = true; renderActivity();
            window.updateDashboardStats().finally(() => setTimeout(() => this.disabled = false, 600));
        });
        $('exportPatientsBtn').addEventListener('click', exportPatients);

        // If admin.js skipped its page-specific init (e.g. served as /admin-dashboard without .html), run it here.
        if (!$('addPatientBtn').dataset.bound && typeof db !== 'undefined') {
            window.initDashboardStats?.();
            window.initPatientManagement?.();
            window.initDoctorManagement?.();
            window.initVolunteerManagement?.();
            window.initAddPatient?.(); window.initAddDoctor?.(); window.initAddVolunteer?.();
            window.initAdvancedPatientSearch?.();
        }
    });
})();
