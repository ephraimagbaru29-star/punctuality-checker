<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/navigate';
  import { authStore } from '../../stores/auth';
  import { attendanceApi } from '../../lib/api';
  import Navbar from '../../components/Navbar.svelte';
  import NotificationBell from '../../components/NotificationBell.svelte';
  import StatusBadge from '../../components/StatusBadge.svelte';

  let records = [];
  let loading = true;
  let error = '';
  let total = 0;
  let page = 0;
  const limit = 20;

  // Summary stats
  $: presentCount  = records.filter(r => r.status === 'present').length;
  $: lateCount     = records.filter(r => r.status === 'late').length;
  $: absentCount   = records.filter(r => r.status === 'absent' || r.status === 'auto_clocked_out').length;

  onMount(async () => {
    const auth = $authStore;
    if (!auth?.token || auth.user?.role !== 'student') { navigate('/login'); return; }
    await loadHistory();
  });

  const loadHistory = async () => {
    loading = true; error = '';
    try {
      const data = await attendanceApi.history(`?limit=${limit}&offset=${page * limit}`);
      records = data.attendance;
      total = data.total;
    } catch (e) { error = e.message; }
    loading = false;
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const reasonLabel = (r) => {
    const map = { emergency: '🚨 Emergency', not_feeling_good: '🤒 Unwell', tired: '😴 Tired', auto_system: '🤖 Auto' };
    return r ? (map[r] || r) : '—';
  };

  const nextPage = async () => { page++; await loadHistory(); };
  const prevPage = async () => { if (page > 0) { page--; await loadHistory(); } };
</script>

<div class="student-nav">
  <Navbar role="student" />
  <div class="bell-overlay"><NotificationBell /></div>
</div>

<div class="page-wrap">
  <div class="page-header">
    <h2>Attendance History</h2>
    <p class="text-muted">Your complete clock-in records</p>
  </div>

  {#if !loading && records.length > 0}
    <div class="summary-cards">
      <div class="sum-card green">
        <strong>{presentCount}</strong><span>On Time</span>
      </div>
      <div class="sum-card yellow">
        <strong>{lateCount}</strong><span>Late</span>
      </div>
      <div class="sum-card red">
        <strong>{absentCount}</strong><span>Absent</span>
      </div>
      <div class="sum-card blue">
        <strong>{total}</strong><span>Total Records</span>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  <div class="card table-wrap">
    {#if loading}
      <div class="flex-center" style="padding:40px;"><div class="spinner" style="width:36px;height:36px;border-width:3px;"></div></div>
    {:else if records.length === 0}
      <div class="empty-state">
        <p>📋 No attendance records yet.</p>
        <p class="text-muted" style="font-size:var(--fs-sm);margin-top:8px;">Records will appear here once you start clocking in.</p>
      </div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Exit Reason</th>
            <th>Status</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {#each records as r}
            <tr>
              <td><strong>{fmtDate(r.date)}</strong></td>
              <td class="time-cell">{fmt(r.clock_in_time)}</td>
              <td class="time-cell">
                {fmt(r.clock_out_time)}
                {#if r.auto_clocked_out}<span class="auto-tag">AUTO</span>{/if}
              </td>
              <td>{reasonLabel(r.clock_out_reason)}</td>
              <td><StatusBadge status={r.status} /></td>
              <td class="loc-cell">
                {#if r.location_address}
                  <span title={r.location_address}>{r.location_address.substring(0,28)}{r.location_address.length > 28 ? '…' : ''}</span>
                {:else if r.location_lat}
                  {r.location_lat.toFixed(3)}, {r.location_lng.toFixed(3)}
                {:else}—{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button class="btn btn-ghost btn-sm" on:click={prevPage} disabled={page === 0}>← Prev</button>
        <span class="page-info">Page {page + 1} · {total} total</span>
        <button class="btn btn-ghost btn-sm" on:click={nextPage}
          disabled={(page + 1) * limit >= total}>Next →</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .student-nav { position: relative; }
  .bell-overlay { position: absolute; top: 13px; right: 72px; z-index: 200; }

  .page-wrap { max-width: 1000px; margin: 0 auto; padding: 32px 20px; }
  .page-header { margin-bottom: 24px; }

  .summary-cards { display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
  .sum-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 16px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: var(--shadow);
    min-width: 90px;
  }
  .sum-card strong { font-size: var(--fs-2xl); font-weight: 800; }
  .sum-card span   { font-size: var(--fs-xs); color: var(--gray-500); text-transform: uppercase; font-weight: 600; }
  .sum-card.green strong { color: var(--success); }
  .sum-card.yellow strong{ color: var(--warning); }
  .sum-card.red strong   { color: var(--danger);  }
  .sum-card.blue strong  { color: var(--info);    }

  .time-cell { font-family: monospace; font-weight: 600; font-size: var(--fs-sm); }
  .auto-tag {
    background: var(--danger); color: white;
    font-size: 9px; padding: 1px 5px;
    border-radius: 4px; margin-left: 4px;
    font-weight: 700;
  }
  .loc-cell { font-size: var(--fs-xs); color: var(--gray-500); max-width: 180px; }

  .pagination {
    display: flex; align-items: center; justify-content: center;
    gap: 16px; padding: 16px;
    border-top: 1px solid var(--gray-100);
  }
  .page-info { font-size: var(--fs-sm); color: var(--gray-500); }

  .empty-state { padding: 48px; text-align: center; }

  @media (max-width: 480px) {
    .bell-overlay { right: 58px; }
  }
</style>
