<script>
  import { onMount, onDestroy } from 'svelte';
  import { navigate } from '../../lib/navigate';
  import { authStore, currentUser } from '../../stores/auth';
  import { attendanceApi, deviceApi } from '../../lib/api';
  import { getLocationWithAddress } from '../../lib/location';
  import { getDeviceFingerprint } from '../../lib/fingerprint';
  import Navbar from '../../components/Navbar.svelte';
  import NotificationBell from '../../components/NotificationBell.svelte';
  import StatusBadge from '../../components/StatusBadge.svelte';

  let todayRecord = null;
  let loading = true;
  let clockLoading = false;
  let error = '';
  let successMsg = '';

  // Early clock-out modal
  let showEarlyModal = false;
  let selectedReason = '';
  const reasons = [
    { value: 'emergency',        label: '🚨 Emergency' },
    { value: 'not_feeling_good', label: '🤒 Not Feeling Good' },
    { value: 'tired',            label: '😴 Just Being Tired' },
  ];

  // Device reset request modal
  let showResetModal = false;
  let resetReason = '';
  let resetMsg = '';
  let resetLoading = false;

  // Live clock
  let timeStr = '';
  let dateStr = '';
  let clockInterval;
  const updateClock = () => {
    const now = new Date();
    timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Reminder popup
  let showReminder = false;
  let reminderInterval;
  const CLOCK_OUT_HOUR = 17; // 5PM

  const checkReminder = () => {
    const now = new Date();
    if (todayRecord?.clock_in_time && !todayRecord?.clock_out_time) {
      const minsAfter5 = (now.getHours() - CLOCK_OUT_HOUR) * 60 + now.getMinutes();
      if (minsAfter5 >= 5 && minsAfter5 < 30) showReminder = true;
    }
  };

  onMount(async () => {
    const auth = $authStore;
    if (!auth?.token || auth.user?.role !== 'student') { navigate('/login'); return; }
    await loadToday();
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
    reminderInterval = setInterval(checkReminder, 60000);
  });

  onDestroy(() => {
    clearInterval(clockInterval);
    clearInterval(reminderInterval);
  });

  const loadToday = async () => {
    loading = true;
    try {
      const data = await attendanceApi.today();
      todayRecord = data.attendance;
    } catch (e) { error = e.message; }
    loading = false;
  };

  // Clock In
  const handleClockIn = async () => {
    error = ''; successMsg = ''; clockLoading = true;
    try {
      const fingerprint = await getDeviceFingerprint();
      let locData = {};
      try {
        const loc = await getLocationWithAddress();
        locData = { location_lat: loc.lat, location_lng: loc.lng, location_address: loc.address };
      } catch { /* location optional */ }

      const data = await attendanceApi.clockIn({
        device_fingerprint: fingerprint,
        ...locData
      });
      todayRecord = data.attendance;
      successMsg = data.message;
    } catch (e) { error = e.message; }
    clockLoading = false;
  };

  // Clock Out — check if before 5pm
  const handleClockOut = () => {
    error = ''; successMsg = '';
    const now = new Date();
    const isEarly = now.getHours() < CLOCK_OUT_HOUR;
    if (isEarly) {
      selectedReason = '';
      showEarlyModal = true;
    } else {
      doClockOut(null);
    }
  };

  const doClockOut = async (reason) => {
    clockLoading = true; showEarlyModal = false; showReminder = false;
    try {
      const data = await attendanceApi.clockOut({ reason });
      todayRecord = data.attendance;
      successMsg = data.message;
    } catch (e) { error = e.message; }
    clockLoading = false;
  };

  // Device Reset Request
  const openResetModal = () => { showResetModal = true; resetReason = ''; resetMsg = ''; };
  const closeResetModal = () => { showResetModal = false; };
  const submitResetRequest = async () => {
    if (!resetReason.trim()) { resetMsg = 'Please describe why you need a device reset.'; return; }
    resetLoading = true; resetMsg = '';
    try {
      await deviceApi.requestReset({ reason: resetReason });
      resetMsg = '✅ Request submitted! Admin will review it and send you a reset link.';
      setTimeout(closeResetModal, 3000);
    } catch (e) { resetMsg = '❌ ' + e.message; }
    resetLoading = false;
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtFull = (ts) => ts ? new Date(ts).toLocaleString() : '—';

  $: clockedIn  = !!todayRecord?.clock_in_time;
  $: clockedOut = !!todayRecord?.clock_out_time;
  $: canClockIn  = !clockedIn;
  $: canClockOut = clockedIn && !clockedOut;
</script>

<!-- Sticky notification bell in top-right of navbar -->
<div class="student-nav">
  <Navbar role="student" />
  <div class="bell-overlay">
    <NotificationBell />
  </div>
</div>

<!-- Reminder Banner -->
{#if showReminder}
  <div class="reminder-banner">
    <span>⏰ It's past 5:00 PM — please clock out now! You'll be auto-clocked-out at 5:30 PM and marked absent.</span>
    <button class="btn btn-primary btn-sm" on:click={handleClockOut}>Clock Out Now</button>
    <button class="reminder-close" on:click={() => showReminder = false}>✕</button>
  </div>
{/if}

<div class="page-wrap">
  <!-- Hero Clock -->
  <div class="clock-hero">
    <p class="live-date">{dateStr}</p>
    <h1 class="live-time">{timeStr}</h1>
    <p class="student-id-display">
      Clock-In ID: <span>{$currentUser?.clock_in_id || ''}</span>
    </p>
  </div>

  {#if loading}
    <div class="flex-center" style="padding:60px;"><div class="spinner" style="width:40px;height:40px;border-width:3px;"></div></div>
  {:else}
    <!-- Status Card -->
    <div class="status-card card">
      <div class="status-top">
        <div>
          <h3>Today's Status</h3>
          <p class="text-muted">{dateStr}</p>
        </div>
        {#if todayRecord}
          <StatusBadge status={todayRecord.status} />
        {:else}
          <span class="badge badge-gray">Not Yet Clocked In</span>
        {/if}
      </div>

      <div class="time-row">
        <div class="time-block">
          <p class="time-label">Clock In</p>
          <p class="time-val {clockedIn ? 'present' : 'muted'}">{fmt(todayRecord?.clock_in_time)}</p>
        </div>
        <div class="time-divider">→</div>
        <div class="time-block">
          <p class="time-label">Clock Out</p>
          <p class="time-val {clockedOut ? 'present' : 'muted'}">{fmt(todayRecord?.clock_out_time)}</p>
          {#if todayRecord?.auto_clocked_out}
            <p class="auto-note">Auto clocked out</p>
          {/if}
        </div>
      </div>

      {#if todayRecord?.clock_out_reason && todayRecord.clock_out_reason !== 'auto_system'}
        <p class="reason-tag">
          Early leave reason:
          {#if todayRecord.clock_out_reason === 'emergency'}🚨 Emergency
          {:else if todayRecord.clock_out_reason === 'not_feeling_good'}🤒 Not Feeling Good
          {:else if todayRecord.clock_out_reason === 'tired'}😴 Just Being Tired
          {:else}{todayRecord.clock_out_reason}{/if}
        </p>
      {/if}

      {#if todayRecord?.location_address}
        <p class="location-tag">📍 {todayRecord.location_address}</p>
      {/if}
    </div>

    <!-- Alerts -->
    {#if error}   <div class="alert alert-error">{error}</div> {/if}
    {#if successMsg}<div class="alert alert-success">{successMsg}</div>{/if}

    <!-- Action Buttons -->
    <div class="clock-actions">
      <button class="clock-btn clock-in-btn"
        on:click={handleClockIn}
        disabled={!canClockIn || clockLoading}>
        {#if clockLoading && canClockIn}
          <span class="spinner" style="border-color:rgba(255,255,255,.3);border-top-color:white;"></span>
        {:else}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        {/if}
        <span>Clock In</span>
      </button>

      <button class="clock-btn clock-out-btn"
        on:click={handleClockOut}
        disabled={!canClockOut || clockLoading}>
        {#if clockLoading && canClockOut}
          <span class="spinner" style="border-color:rgba(255,255,255,.3);border-top-color:white;"></span>
        {:else}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        {/if}
        <span>Clock Out</span>
      </button>
    </div>

    <div class="info-notice">
      <p>🕘 Clock-in opens at <strong>9:00 AM</strong> · 🕔 Clock-out time is <strong>5:00 PM</strong></p>
    </div>

    <!-- Device Reset Request -->
    <div class="device-section card">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div>
          <h4>Wrong Device?</h4>
          <p class="text-muted" style="font-size:var(--fs-sm);">If you're locked out due to a device change, request a reset from admin.</p>
        </div>
        <button class="btn btn-ghost btn-sm" on:click={openResetModal}>Request Device Reset</button>
      </div>
    </div>
  {/if}
</div>

<!-- Early Clock-Out Modal -->
{#if showEarlyModal}
  <div class="modal-overlay">
    <div class="modal">
      <h3 class="modal-title">⚠️ WHY CLOCK OUT AT THIS TIME?</h3>
      <p class="modal-subtitle">It's before 5:00 PM. Please select a reason to continue.</p>

      <div class="reason-options">
        {#each reasons as r}
          <button
            class="reason-btn {selectedReason === r.value ? 'selected' : ''}"
            on:click={() => selectedReason = r.value}>
            {r.label}
          </button>
        {/each}
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" on:click={() => showEarlyModal = false}>Cancel</button>
        <button class="btn btn-danger" on:click={() => doClockOut(selectedReason)}
          disabled={!selectedReason}>
          Clock Out
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Device Reset Modal -->
{#if showResetModal}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click|self={closeResetModal}>
    <div class="modal">
      <h3 class="modal-title">Request Device Reset</h3>
      <p class="modal-subtitle">Explain why you need access from a different device. Admin will review and send a reset link to your email.</p>

      <div class="form-group">
        <label class="form-label" for="rdr">Reason</label>
        <textarea id="rdr" class="form-control" rows="3"
          placeholder="e.g. My phone was stolen / I got a new device…"
          bind:value={resetReason}></textarea>
      </div>

      {#if resetMsg}
        <div class="alert {resetMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}">{resetMsg}</div>
      {/if}

      <div class="modal-footer">
        <button class="btn btn-ghost" on:click={closeResetModal}>Cancel</button>
        <button class="btn btn-primary" on:click={submitResetRequest} disabled={resetLoading}>
          {#if resetLoading}<span class="spinner"></span>{:else}Submit Request{/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .student-nav { position: relative; }
  .bell-overlay {
    position: absolute;
    top: 13px; right: 72px;
    z-index: 200;
  }

  .reminder-banner {
    background: var(--warning);
    color: #fff;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    font-size: var(--fs-sm);
    font-weight: 500;
    position: sticky;
    top: 64px;
    z-index: 90;
  }
  .reminder-banner span { flex: 1; }
  .reminder-close {
    background: none; border: none;
    color: white; cursor: pointer;
    font-size: 16px; padding: 0;
  }

  .page-wrap { max-width: 680px; margin: 0 auto; padding: 32px 20px; }

  .clock-hero {
    text-align: center;
    background: var(--primary);
    border-radius: var(--radius-xl);
    padding: 36px 24px;
    margin-bottom: 24px;
    color: white;
  }
  .live-date  { color: rgba(255,255,255,.6); font-size: var(--fs-sm); margin-bottom: 4px; }
  .live-time  { font-size: clamp(2.8rem, 8vw, 4rem); font-weight: 800; letter-spacing: .04em; color: white; margin-bottom: 8px; }
  .student-id-display { font-size: var(--fs-sm); color: rgba(255,255,255,.6); }
  .student-id-display span { color: var(--accent-light); font-weight: 700; letter-spacing: .1em; }

  .status-card { margin-bottom: 20px; }
  .status-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .status-top h3 { font-size: var(--fs-lg); }

  .time-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .time-block { flex: 1; }
  .time-label { font-size: var(--fs-xs); text-transform: uppercase; font-weight: 600; color: var(--gray-400); letter-spacing: .06em; margin-bottom: 4px; }
  .time-val { font-size: var(--fs-2xl); font-weight: 800; font-family: monospace; }
  .time-val.present { color: var(--success); }
  .time-val.muted   { color: var(--gray-300); }
  .time-divider { font-size: var(--fs-xl); color: var(--gray-300); }
  .auto-note { font-size: var(--fs-xs); color: var(--danger); margin-top: 2px; }
  .reason-tag, .location-tag { font-size: var(--fs-sm); color: var(--gray-600); margin-top: 8px; }

  .clock-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }
  .clock-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 28px 16px;
    border-radius: var(--radius-xl);
    border: none;
    cursor: pointer;
    font-size: var(--fs-base);
    font-weight: 700;
    font-family: var(--font);
    transition: all var(--transition);
    color: white;
  }
  .clock-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
  .clock-in-btn  { background: linear-gradient(135deg, #22c55e, #16a34a); }
  .clock-in-btn:not(:disabled):hover  { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(34,197,94,.4); }
  .clock-out-btn { background: linear-gradient(135deg, #e94560, #c73652); }
  .clock-out-btn:not(:disabled):hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(233,69,96,.4); }

  .info-notice {
    text-align: center;
    font-size: var(--fs-sm);
    color: var(--gray-500);
    margin-bottom: 24px;
    padding: 10px;
    background: var(--gray-50);
    border-radius: var(--radius);
  }
  .device-section { padding: 16px 20px; }

  /* Reason options */
  .reason-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .reason-btn {
    padding: 14px 18px;
    border-radius: var(--radius-lg);
    border: 2px solid var(--gray-200);
    background: var(--white);
    cursor: pointer;
    font-size: var(--fs-sm);
    font-weight: 500;
    font-family: var(--font);
    text-align: left;
    transition: all var(--transition);
    color: var(--gray-700);
  }
  .reason-btn:hover   { border-color: var(--accent); color: var(--accent); }
  .reason-btn.selected{ border-color: var(--accent); background: #fff0f2; color: var(--accent); font-weight: 700; }

  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; }

  textarea.form-control { resize: vertical; min-height: 80px; }

  @media (max-width: 480px) {
    .clock-actions { grid-template-columns: 1fr; }
    .bell-overlay { right: 58px; }
  }
</style>
