<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/navigate';
  import { authStore } from '../../stores/auth';
  import { qrApi } from '../../lib/api';
  import Navbar from '../../components/Navbar.svelte';

  let codes = [];
  let loading = true;
  let generating = false;
  let error = '';
  let successMsg = '';
  let newLabel = '';
  let expiryHours = '';
  let previewQR = null; // { qr_image_base64, registration_url, label, token }

  onMount(async () => {
    const auth = $authStore;
    if (!auth?.token || auth.user?.role !== 'admin') { navigate('/admin/login'); return; }
    await loadCodes();
  });

  const loadCodes = async () => {
    loading = true;
    try {
      const data = await qrApi.list();
      codes = data.qr_codes;
    } catch (e) { error = e.message; }
    loading = false;
  };

  const generateQR = async () => {
    if (generating) return;
    generating = true; error = ''; successMsg = '';
    try {
      const body = { label: newLabel || 'Registration QR' };
      if (expiryHours) body.expires_hours = Number(expiryHours);
      const data = await qrApi.generate(body);
      previewQR = data.qr_code;
      successMsg = 'QR code generated successfully!';
      newLabel = ''; expiryHours = '';
      await loadCodes();
    } catch (e) { error = e.message; }
    generating = false;
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this QR code? Students won\'t be able to register with it.')) return;
    try {
      await qrApi.deactivate(id);
      await loadCodes();
      if (previewQR?.id === id) previewQR = null;
    } catch (e) { error = e.message; }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    alert('Registration link copied to clipboard!');
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleString() : '—';
</script>

<Navbar role="admin" />

<div class="page-wrap">
  <div class="page-header">
    <h2>QR Code Manager</h2>
    <p class="text-muted">Generate QR codes for students to scan and register.</p>
  </div>

  {#if error}   <div class="alert alert-error">{error}</div> {/if}
  {#if successMsg}<div class="alert alert-success">{successMsg}</div>{/if}

  <div class="gen-section card">
    <h3>Generate New QR Code</h3>
    <div class="gen-form">
      <div class="form-group" style="flex:1;margin:0;">
        <label class="form-label" for="ql">Label</label>
        <input id="ql" class="form-control" type="text" placeholder="e.g. Batch 2026 Registration"
          bind:value={newLabel} />
      </div>
      <div class="form-group" style="width:160px;margin:0;">
        <label class="form-label" for="exp">Expires in (hours)</label>
        <input id="exp" class="form-control" type="number" placeholder="Leave blank = no expiry"
          bind:value={expiryHours} min="1" />
      </div>
      <button class="btn btn-primary" on:click={generateQR} disabled={generating}
        style="align-self:flex-end;height:42px;">
        {#if generating}<span class="spinner"></span>{:else}+ Generate{/if}
      </button>
    </div>
  </div>

  <!-- QR Preview -->
  {#if previewQR}
    <div class="qr-preview card">
      <div class="qr-preview-inner">
        <img src={previewQR.qr_image_base64} alt="QR Code" class="qr-img" />
        <div class="qr-info">
          <h3>{previewQR.label}</h3>
          <p class="text-muted">Token: <code>{previewQR.token}</code></p>
          <p class="qr-url">{previewQR.registration_url}</p>
          <div class="qr-actions">
            <button class="btn btn-primary btn-sm" on:click={() => copyLink(previewQR.registration_url)}>
              📋 Copy Link
            </button>
            <a href={previewQR.qr_image_base64} download="qrcode.png" class="btn btn-ghost btn-sm">
              ⬇️ Download PNG
            </a>
            <button class="btn btn-ghost btn-sm" on:click={() => previewQR = null}>Close</button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- QR List -->
  <div class="card table-wrap">
    <div class="card-header">
      <h3>All QR Codes</h3>
      <button class="btn btn-ghost btn-sm" on:click={loadCodes}>Refresh</button>
    </div>

    {#if loading}
      <div class="flex-center" style="padding:40px;"><div class="spinner" style="width:36px;height:36px;border-width:3px;"></div></div>
    {:else if codes.length === 0}
      <div class="empty-state">No QR codes yet. Generate one above.</div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Token</th>
            <th>Status</th>
            <th>Created</th>
            <th>Expires</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each codes as c}
            <tr>
              <td><strong>{c.label}</strong></td>
              <td><code style="font-size:11px;">{c.token.substring(0,16)}…</code></td>
              <td>
                <span class="badge {c.is_active ? 'badge-success' : 'badge-gray'}">
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{fmt(c.created_at)}</td>
              <td>{c.expires_at ? fmt(c.expires_at) : 'Never'}</td>
              <td>
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-ghost btn-sm"
                    on:click={async () => {
                      const body = { label: c.label };
                      if (c.expires_at) {
                        const diffMs = new Date(c.expires_at) - new Date(c.created_at);
                        body.expires_hours = Math.round(diffMs / 3600000);
                      }
                      const png = await qrApi.list(); // we already have the data
                      // Show a re-generated preview
                      alert('Use the Generate form above to create a new code. To view the image, generate again.');
                    }}>View</button>
                  {#if c.is_active}
                    <button class="btn btn-danger btn-sm" on:click={() => deactivate(c.id)}>Deactivate</button>
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

<style>
  .page-wrap { max-width: 1100px; margin: 0 auto; padding: 32px 20px; }
  .page-header { margin-bottom: 24px; }
  .gen-section { margin-bottom: 20px; }
  .gen-section h3 { margin-bottom: 16px; }
  .gen-form { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }

  .qr-preview { margin-bottom: 20px; }
  .qr-preview-inner { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; }
  .qr-img { width: 180px; height: 180px; image-rendering: pixelated; border: 4px solid var(--gray-200); border-radius: var(--radius); }
  .qr-info { flex: 1; min-width: 220px; }
  .qr-info h3 { margin-bottom: 8px; }
  .qr-url { font-size: var(--fs-xs); color: var(--accent); word-break: break-all; margin: 8px 0 16px; }
  .qr-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .empty-state { padding: 40px; text-align: center; color: var(--gray-400); }
</style>
