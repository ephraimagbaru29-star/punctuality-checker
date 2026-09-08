<script>
  export let status = '';

  const map = {
    active:          { cls: 'badge-success', label: 'Active' },
    present:         { cls: 'badge-success', label: 'Present' },
    pending:         { cls: 'badge-warning', label: 'Pending' },
    late:            { cls: 'badge-warning', label: 'Late' },
    approved:        { cls: 'badge-success', label: 'Approved' },
    suspended:       { cls: 'badge-danger',  label: 'Suspended' },
    absent:          { cls: 'badge-danger',  label: 'Absent' },
    rejected:        { cls: 'badge-danger',  label: 'Rejected' },
    auto_clocked_out:{ cls: 'badge-danger',  label: 'Auto Clocked Out' },
  };

  $: info = map[status] || { cls: 'badge-gray', label: status };
</script>

<span class="badge {info.cls}">{info.label}</span>
