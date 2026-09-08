<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/navigate';
  import { authStore } from '../../stores/auth';
  import { adminApi } from '../../lib/api';
  import Navbar from '../../components/Navbar.svelte';
  import StatusBadge from '../../components/StatusBadge.svelte';

  let students = [];
  let loading = true;
  let error = '';
  let search = '';
  let statusFilter = '';
  let selectedStudent = null;
  let confirmAction = null; // { type: 'approve'|'suspend'|'unsuspend', student }
  let suspendReason = '';
  let actionLoading = false;
  let actionMsg = '';

  onMount(async () => {
    const auth = $authStore;
    if (!auth?.token || auth.user?.role !== 'admin') { navigate('/admin/login'); return; }
    await loadStudents();
  });

  const loadStudents = async () => {
    loading = true; error = '';
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const q = params.toString() ? '?' + params.toString() : '';
      const data = await adminApi.students(q);
      students = data.students;
    } catch (e) { error = e.message; }
    loading = false;
  };

  const openConfirm = (type, student) => {
    confirmAction = { type, student };
    suspendReason = '';
    actionMsg = '';
  };
  const closeConfirm = () => { confirmAction = null; };

  const doAction = async () => {
    if (!confirmAction) return;
    actionLoading = true; actionMsg = '';
    try {
      const { type, student } = confirmAction;
      if (type === 'approve')    await adminApi.approveStudent(student.id);
      if (type === 'suspend')    await adminApi.suspendStudent(student.id, { reason: suspendReason });
      if (type === 'unsuspend')  await adminApi.unsuspendStudent(student.id);
      actionMsg = '✅ Done!';
      setTimeout(() => { closeConfirm(); loadStudents(); }, 800);
    } catch (e) { actionMsg = '❌ ' + e.message; }
    actionLoading = false;
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleDateString() : '—';

  let searchTimer;
  const onSearch = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadStudents, 400);
  };
</script>

<Navbar role="admin" />

<div class="page-wrap">
  <div class="page-header">
    <h2>Students</h2>
  </div>

  <!-- Filters -->
  <div class="filters card">
    <input class="form-control" type="text" placeholder="Search by name, email or ID…"
      bind:value={search} on:input={onSearch} style="max-width:300px;" />

    <select class="form-control" bind:value={statusFilter} on:change={loadStudents}
      style="max-width:160px;">
      <option value="">All Status</option>
      <option value="pending">Pending</option>
      <option value="active">Active</option>
      <option value="suspended">Suspended</option>
    </select>

    <button class="btn btn-ghost btn-sm" on:click={loadStudents}>Refresh</button>
  </div>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  <div class="card table-wrap">
    {#if loading}
      <div class="flex-center" style="padding:40px;"><div class="spinner" style="width:36px;height:36px;border-width:3px;"></div></div>
    {:else if students.length === 0}
      <div class="empty-state">No students found.</div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Clock-In ID</th>
            <th>Email</th>
            <th>Status</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each students as s}
            <tr>
              <td>
                <div class="student-info">
                  {#if s.profile_picture}
                    <img src={s.profile_picture} alt={s.full_name} class="avatar" />
                  {:else}
                    <div class="avatar-placeholder">{s.full_name.charAt(0)}</div>
                  {/if}
                  <span class="student-name">{s.full_name}</span>
                </div>
              </td>
              <td><code class="clock-id">{s.clock_in_id}</code></td>
              <td>{s.email}</td>
              <td><StatusBadge status={s.status} /></td>
              <td>{fmt(s.registered_at)}</td>
              <td>
                <div class="actions">
                  {#if s.status === 'pending'}
                    <button class="btn btn-success btn-sm" on:click={() => openConfirm('approve', s)}>Approve</button>
                  {/if}
                  {#if s.status === 'active'}
                    <button class="btn btn-danger btn-sm" on:click={() => openConfirm('suspend', s)}>Suspend</button>
                  {/if}
                  {#if s.status === 'suspended'}
                    <button class="btn btn-warning btn-sm" on:click={() => openConfirm('unsuspend', s)}>Unsuspend</button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<!-- Confirm Modal -->
{#if confirmAction}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click|self={closeConfirm}>
    <div class="modal">
      <h3 class="modal-title">
        {#if confirmAction.type === 'approve'}Approve Student
        {:else if confirmAction.type === 'suspend'}Suspend Student
        {:else}Unsuspend Student{/if}
      </h3>
      <p class="modal-subtitle">
        {#if confirmAction.type === 'approve'}Approve <strong>{confirmAction.student.full_name}</strong> and allow them to clock in?
        {:else if confirmAction.type === 'suspend'}Suspend <strong>{confirmAction.student.full_name}</strong>? They won't be able to clock in.
        {:else}Lift suspension for <strong>{confirmAction.student.full_name}</strong>?
        {/if}
      </p>

      {#if confirmAction.type === 'suspend'}
        <div class="form-group">
          <label class="form-label" for="sreason">Reason (optional)</label>
          <input id="sreason" class="form-control" placeholder="Reason for suspension…"
            bind:value={suspendReason} />
        </div>
      {/if}

      {#if actionMsg}
        <div class="alert {actionMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}">{actionMsg}</div>
      {/if}

      <div class="modal-footer">
        <button class="btn btn-ghost" on:click={closeConfirm}>Cancel</button>
        <button class="btn {confirmAction.type === 'approve' ? 'btn-success' : confirmAction.type === 'suspend' ? 'btn-danger' : 'btn-warning'}"
          on:click={doAction} disabled={actionLoading}>
          {#if actionLoading}<span class="spinner"></span>{:else}Confirm{/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 20px; }
  .page-header { margin-bottom: 20px; }
  .filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 20px; padding: 16px; }
  .student-info { display: flex; align-items: center; gap: 10px; }
  .avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
  .avatar-placeholder {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--accent); color: white;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: var(--fs-sm);
  }
  .student-name { font-weight: 500; }
  .clock-id {
    background: var(--gray-100);
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    font-size: var(--fs-xs);
    font-family: monospace;
    letter-spacing: .08em;
    font-weight: 700;
    color: var(--primary);
  }
  .actions { display: flex; gap: 6px; }
  .empty-state { padding: 40px; text-align: center; color: var(--gray-400); }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
</style>
