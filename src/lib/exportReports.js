/**
 * TruthBridge — Report Export Utilities
 * 
 * CSV and PDF export functionality for authorities
 */

/**
 * Convert reports data to CSV format
 */
export function exportToCSV(reports, bridges, filename = 'bridge-reports') {
  const headers = [
    'Report ID',
    'Bridge Name',
    'District',
    'State',
    'Damage Type',
    'Severity',
    'Description',
    'Status',
    'Days Unaddressed',
    'Submitted At',
    'Response Notes',
    'Verified Count',
    'Photo URL',
  ];

  const rows = reports.map(r => {
    const bridge = bridges.find(b => b.id === r.bridge_id) || {};
    return [
      r.id,
      bridge.name || r.bridge_name || 'Unknown',
      bridge.district || '',
      bridge.state || '',
      r.damage_type,
      r.severity,
      r.description || '',
      r.status,
      r.days_unaddressed || 0,
      new Date(r.created_at).toLocaleDateString('en-IN'),
      r.response_notes || '',
      r.verification_count || 0,
      r.photo_url || '',
    ];
  });

  // Escape special characters
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Generate a print-friendly HTML page and trigger print
 * (Print to PDF from browser)
 */
export function exportToPDF(reports, bridges, stats, filename = 'bridge-reports') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; }
    .stat-box { padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
    .stat-label { font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #1a1a2e; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .status-pending { color: #f59e0b; }
    .status-action-taken { color: #10b981; }
    .status-ignored { color: #ef4444; }
    .severity-dangerous { color: #ef4444; font-weight: bold; }
    .severity-serious { color: #f97316; }
    footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <h1>🌉 TruthBridge Report Export</h1>
  <p>Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
  
  <div class="stats">
    <div class="stat-box">
      <div class="stat-value">${stats.total || 0}</div>
      <div class="stat-label">Total Reports</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${stats.critical || 0}</div>
      <div class="stat-label">Critical</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${stats.pending || 0}</div>
      <div class="stat-label">Pending</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${stats.actioned || 0}</div>
      <div class="stat-label">Action Taken</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Bridge</th>
        <th>Location</th>
        <th>Damage Type</th>
        <th>Severity</th>
        <th>Status</th>
        <th>Submitted</th>
        <th>Days Open</th>
      </tr>
    </thead>
    <tbody>
      ${reports.map(r => {
        const bridge = bridges.find(b => b.id === r.bridge_id) || {};
        const daysOpen = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000);
        return `
        <tr>
          <td>${bridge.name || r.bridge_name || 'Unknown'}</td>
          <td>${bridge.district || ''}, ${bridge.state || ''}</td>
          <td>${r.damage_type?.replace('_', ' ')}</td>
          <td class="severity-${r.severity?.toLowerCase()}">${r.severity}</td>
          <td class="status-${r.status?.toLowerCase().replace('_', '-')}">${r.status?.replace('_', ' ')}</td>
          <td>${new Date(r.created_at).toLocaleDateString('en-IN')}</td>
          <td>${daysOpen}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <footer>
    <p>Exported from TruthBridge — India's Bridge Safety Accountability Platform</p>
    <p>https://truthbridge-six.vercel.app</p>
  </footer>

  <script>
    window.onload = () => {
      setTimeout(() => window.print(), 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Get stats for export summary
 */
export function getReportStats(reports) {
  return {
    total: reports.length,
    critical: reports.filter(r => r.severity === 'DANGEROUS').length,
    pending: reports.filter(r => r.status === 'PENDING').length,
    actioned: reports.filter(r => r.status === 'ACTION_TAKEN').length,
    ignored: reports.filter(r => r.status === 'IGNORED').length,
  };
}
