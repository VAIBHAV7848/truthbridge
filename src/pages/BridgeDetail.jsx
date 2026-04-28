/**
 * TruthBridge — Bridge Detail Page
 */
import { useParams } from 'react-router-dom';
import { useBridge } from '../hooks/useBridges';

export default function BridgeDetail() {
  const { id } = useParams();
  const { bridge, loading, error } = useBridge(id);

  if (loading) return <p>Loading bridge details...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!bridge) return <p>Bridge not found.</p>;

  return (
    <div id="bridge-detail-page">
      <h1>{bridge.name}</h1>
      <p>{bridge.district}, {bridge.state}</p>
      <p>Risk Score: {bridge.risk_score}/100 — {bridge.status}</p>
      <p>Year Built: {bridge.year_built} | Type: {bridge.bridge_type}</p>
      <p>Last Inspected: {bridge.last_inspection_date || 'Never'}</p>

      <h2>Reports ({bridge.reports?.length || 0})</h2>
      {bridge.reports?.map(r => (
        <div key={r.id} style={{ padding: '8px', borderBottom: '1px solid #333' }}>
          <strong>{r.damage_type}</strong> — {r.severity} — {r.status}
          <p>{r.description}</p>
        </div>
      ))}
    </div>
  );
}
