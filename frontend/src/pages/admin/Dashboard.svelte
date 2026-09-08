<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/navigate';
  import { authStore } from '../../stores/auth';
  import { adminApi } from '../../lib/api';
  import Navbar from '../../components/Navbar.svelte';

  let stats = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    const auth = $authStore;
    if (!auth?.token || auth.user?.role !== 'admin') { navigate('/admin/login'); return; }
    try {
      const data = await adminApi.dashboard();
      stats = data.stats;
    } catch (e) {
      error = e.message;
    }
    loading = false;
  });

  const statCards = [
    { key: 'totalStudents',   label: 'Active Students',    icon: '👥', color: '#3b82f6' },
    { key: 'presentToday',    label: 'Present Today',       icon: '✅', color: '#22c55e' },
    { key: 'absentToday',     label: 'Absent Today',        icon: '❌', color: '#ef4444' },
    { key: 'pendingApprovals',label: 'Pending Approvals',   icon: '⏳', color: '#f59e0b' },
    { key: 'suspended',       label: 'Suspended',           icon: '🚫', color: '#6b7280' },
    { key: 'pendingResets',   label: 'Device Reset Requests',icon: '🔁', color: '#a855f7' },
  ];
</script>

<Navbar role="admin" />

<div class="page-wrap">
  <div class="page-header">
    <h2>Admin Dashboard</h2>
    <p class="text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  {#if loading}
    <div class="flex-center" style="padding: 60px;"><div class="spinner" style="width:40px;height:40px;border-width:3px;"></div></div>
  {:else if error}
    <div class="alert alert-error">{error}</div>
  {:else if stats}
    <div class="stats-grid">
      {#each statCards as card}
        <div class="stat-card" style="--c: {card.color}">
          <div class="stat-icon">{card.icon}</div>
          <div class="stat-body">
            <p class="stat-label">{card.label}</p>
            <p class="stat-value">{stats[card.key] ?? 0}</p>
          </div>
        </div>
      {/each}
    </div>

    <div class="quick-links">
      <h3>Quick Actions</h3>
      <div class="action-grid">
        <a href="/admin/students?status=pending" class="action-card">
          <span>⏳</span>
          <div>
            <strong>Pending Approvals</strong>
            <p>{stats.pendingApprovals} student{stats.pendingApprovals !== 1 ? 's' : ''} waiting</p>
          </div>
        </a>
        <a href="/admin/requests" class="action-card">
          <span>🔁</span>
          <div>
            <strong>Device Reset Requests</strong>
            <p>{stats.pendingResets} pending request{stats.pendingResets !== 1 ? 's' : ''}</p>
          </div>
        </a>
        <a href="/admin/qr" class="action-card">
          <span>📷</span>
          <div>
            <strong>Manage QR Codes</strong>
            <p>Generate or deactivate codes</p>
          </div>
        </a>
        <a href="/admin/attendance" class="action-card">
          <span>📋</span>
          <div>
            <strong>Today's Attendance</strong>
            <p>{stats.presentToday} present, {stats.absentToday} absent</p>
          </div>
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  .page-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 20px; }
  .page-header { margin-bottom: 28px; }
  .page-header h2 { font-size: var(--fs-2xl); color: var(--primary); }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .stat-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow);
    border-left: 4px solid var(--c);
    transition: transform var(--transition), box-shadow var(--transition);
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  .stat-icon { font-size: 2rem; flex-shrink: 0; }
  .stat-label { font-size: var(--fs-xs); color: var(--gray-500); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
  .stat-value { font-size: var(--fs-2xl); font-weight: 800; color: var(--primary); line-height: 1; }

  .quick-links h3 { font-size: var(--fs-xl); margin-bottom: 16px; }
  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  .action-card {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow);
    text-decoration: none;
    color: inherit;
    transition: all var(--transition);
    border: 2px solid transparent;
  }
  .action-card:hover { border-color: var(--accent); transform: translateY(-2px); }
  .action-card span { font-size: 2rem; }
  .action-card strong { display: block; color: var(--primary); font-size: var(--fs-sm); margin-bottom: 4px; }
  .action-card p { font-size: var(--fs-xs); color: var(--gray-500); margin: 0; }
</style>
