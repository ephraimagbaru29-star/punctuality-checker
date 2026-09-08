<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/navigate';
  import { authStore } from '../../stores/auth';
  import { adminApi } from '../../lib/api';
  import Navbar from '../../components/Navbar.svelte';

  let requests = [];
  let loading = true;
  let error = '';
  let msg = '';
  let actionId = null;
  let rejectReason = '';

  onMount(async () => {
    const auth = $authStore;
    if (!auth?.token || auth.user?.role !== 'admin') { navigate('/admin/login'); return; }
    await loadRequests();
  });

  const loadRequests = async () => {
    loading = true; error = '';
    try {
      const data = await adminApi.resetRequests();
      requests = data.requests;
    } catch (e) { error = e.message; }
    loading = false;
  };

  const approve = async (id) => {
    if (!confirm('Approve this device reset? An email with the reset link will be sent to the student.')) return;
    try {
      await adminApi.approveReset(id);
      msg = '✅ Approved — reset link emailed to student.';
      await loadRequests();
    } catch (e) { error = e.message; }
  };

  const openReject = (id) => { actionId = id; rejectReason = ''; };
  const closeReject = () => { actionId = null; };

  const doReject = async () => {
    try {
      await adminApi.rejectReset(actionId, { reason: rejectReason });
      msg = '✅ Request rejected.';
      closeReject();
      await loadRequests();
    } catch (e) { error = e.message; }
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleString() : '—';
</script>

<Navbar role="admin" />

<div class="page-wrap">
  <div class="page-header">
    <h2>Device Reset Requests</h2>
    <p class="text-muted">Students requesting to unlock their account on a new device.</p>
  </div>

  {#if error} <div class="alert alert-error">{error}</div> {/if}
  {#if msg}   <div class="alert alert-success">{msg}</div> {/if}

  <div class="card table-wrap">
    <div class="card-header">
      <h3>Pending Requests</h3>
      <button class="btn btn-ghost btn-sm" on:click={loadRequests}>Refresh</button>
    </div>

    {#if loading}
      <div class="flex-center" style="padding:40px;"><div class="spinner" style="width:36px;height:36px;border-width:3px;"></div></div>
    {:else if requests.length === 0}
      <div class="empty-state">No pending device reset requests.</div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Clock-In ID</th>
            <th>Email</th>
            <th>Reason</th>
            <th>Requested</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each requests as r}
            <tr>
              <td><strong>{r.students?.full_name || '—'}</strong></td>
              <td><code class="clock-id">{r.students?.clock_in_id || ''}</code></td>
              <td>{r.students?.email || '—'}</td>
              <td>{r.reason}</td>
              <td>{fmt(r.requested_at)}</td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-success btn-sm" on:click={() => approve(r.id)}>Approve & Send Link</button>
                  <button class="btn btn-danger btn-sm" on:click={() => openReject(r.id)}>Reject</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<!-- Reject Modal -->
{#if actionId}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click|self={closeReject}>
    <div class="modal">
      <h3 class="modal-title">Reject Request</h3>
      <p class="modal-subtitle">Optionally provide a reason for the student.</p>
      <div class="form-group">
        <label class="form-label" for="rr">Reason</label>
        <input id="rr" class="form-control" placeholder="e.g. Unable to verify identity"
          bind:value={rejectReason} />
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" on:click={closeReject}>Cancel</button>
        <button class="btn btn-danger" on:click={doReject}>Reject Request</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-wrap { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }
  .page-header { margin-bottom: 24px; }
  .clock-id { font-size: 11px; font-family: monospace; background: var(--gray-100); padding: 2px 6px; border-radius: 4px; }
  .empty-state { padding: 40px; text-align: center; color: var(--gray-400); }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
</style>
