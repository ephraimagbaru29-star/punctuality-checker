<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/navigate';
  import { authStore } from '../../stores/auth';
  import { adminApi } from '../../lib/api';
  import Navbar from '../../components/Navbar.svelte';
  import StatusBadge from '../../components/StatusBadge.svelte';

  let records = [];
  let loading = true;
  let error = '';
  let dateFilter = new Date().toISOString().split('T')[0]; // default today

  onMount(async () => {
    const auth = $authStore;
    if (!auth?.token || auth.user?.role !== 'admin') { navigate('/admin/login'); return; }
    await loadAttendance();
  });

  const loadAttendance = async () => {
    loading = true; error = '';
    try {
      const q = dateFilter ? `?date=${dateFilter}` : '';
      const data = await adminApi.attendance(q);
      records = data.attendance;
    } catch (e) { error = e.message; }
    loading = false;
  };

  const fmt = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';

  const reasonLabel = (r) => {
    const map = { emergency: 'Emergency', not_feeling_good: 'Not Feeling Good', tired: 'Just Tired', auto_system: 'Auto Clocked Out' };
    return r ? (map[r] || r) : '—';
  };

  const presentCount  = () => records.filter(r => r.status === 'present' || r.status === 'late').length;
  const absentCount   = () => records.filter(r => r.status === 'absent' || r.status === 'auto_clocked_out').length;
  const lateCount     = () => records.filter(r => r.status === 'late').length;
</script>

<Navbar role="admin" />

<div class="page-wrap">
  <div class="page-header">
    <h2>Attendance Records</h2>
  </div>

  <div class="filters card">
    <div class="form-group" style="margin:0;display:flex;align-items:center;gap:10px;">
      <label class="form-label" style="margin:0;white-space:nowrap;" for="df">Filter by date</label>
      <input id="df" class="form-control" type="date" bind:value={dateFilter} style="max-width:180px;" />
    </div>
    <button class="btn btn-primary btn-sm" on:click={loadAttendance}>Apply</button>
    <button class="btn btn-ghost btn-sm" on:click={() => { dateFilter = ''; loadAttendance(); }}>Clear Filter</button>
  </div>

  {#if !loading && records.length > 0}
    <div class="summary-row">
      <div class="sum-card green"><strong>{presentCount()}</strong><span>Present</span></div>
      <div class="sum-card red"><strong>{absentCount()}</strong><span>Absent</span></div>
      <div class="sum-card yellow"><strong>{lateCount()}</strong><span>Late</span></div>
    </div>
  {/if}

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  <div class="card table-wrap">
    {#if loading}
      <div class="flex-center" style="padding:40px;"><div class="spinner" style="width:36px;height:36px;border-width:3px;"></div></div>
    {:else if records.length === 0}
      <div class="empty-state">No attendance records found.</div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Date</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {#each records as r}
            <tr>
              <td>
                <div>
                  <strong>{r.students?.full_name || '—'}</strong>
                  <br /><code class="clock-id">{r.students?.clock_in_id || ''}</code>
                </div>
              </td>
              <td>{fmtDate(r.date)}</td>
              <td class="time">{fmt(r.clock_in_time)}</td>
              <td class="time">
                {fmt(r.clock_out_time)}
                {#if r.auto_clocked_out}<span class="auto-tag">AUTO</span>{/if}
              </td>
              <td>{reasonLabel(r.clock_out_reason)}</td>
              <td><StatusBadge status={r.status} /></td>
              <td class="location">
                {#if r.location_address}
                  <span title={r.location_address}>{r.location_address.substring(0, 30)}{r.location_address.length > 30 ? '…' : ''}</span>
                {:else if r.location_lat}
                  {r.location_lat.toFixed(4)}, {r.location_lng.toFixed(4)}
                {:else}—{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .page-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 20px; }
  .page-header { margin-bottom: 20px; }
  .filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 20px; padding: 16px; }
  .summary-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .sum-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 100px;
    box-shadow: var(--shadow);
  }
  .sum-card strong { font-size: var(--fs-2xl); font-weight: 800; }
  .sum-card span { font-size: var(--fs-xs); color: var(--gray-500); text-transform: uppercase; font-weight: 600; }
  .sum-card.green strong { color: var(--success); }
  .sum-card.red strong   { color: var(--danger); }
  .sum-card.yellow strong{ color: var(--warning); }
  .time { font-family: monospace; font-size: var(--fs-sm); font-weight: 600; }
  .auto-tag {
    background: var(--danger);
    color: white;
    font-size: 9px;
    padding: 1px 5px;
    border-radius: var(--radius-sm);
    margin-left: 4px;
    vertical-align: middle;
    font-weight: 700;
  }
  .location { font-size: var(--fs-xs); color: var(--gray-500); max-width: 180px; }
  .clock-id { font-size: 11px; font-family: monospace; background: var(--gray-100); padding: 2px 6px; border-radius: 4px; }
  .empty-state { padding: 40px; text-align: center; color: var(--gray-400); }
</style>
