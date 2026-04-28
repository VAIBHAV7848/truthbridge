/**
 * TruthBridge — Skeleton Loading Components
 * 
 * Animated placeholder content for loading states.
 */

const baseStyle = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-loading 1.5s infinite',
  borderRadius: '8px',
};

export function SkeletonText({ lines = 1, width = '100%', height = '1rem', gap = '0.5rem', style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...baseStyle,
            width: typeof width === 'string' ? width : width(i),
            height,
            ...style,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = '120px', style = {} }) {
  return (
    <div
      style={{
        ...baseStyle,
        height,
        borderRadius: '12px',
        ...style,
      }}
    />
  );
}

export function SkeletonCircle({ size = '40px', style = {} }) {
  return (
    <div
      style={{
        ...baseStyle,
        width: size,
        height: size,
        borderRadius: '50%',
        ...style,
      }}
    />
  );
}

export function SkeletonBridgeCard() {
  return (
    <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
      <SkeletonText lines={2} width={['60%', '40%']} height='0.9rem' />
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonText width='80px' height='1.5rem' style={{ borderRadius: '20px' }} />
        <SkeletonCircle size='32px' />
      </div>
    </div>
  );
}

export function SkeletonReportCard() {
  return (
    <div style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <SkeletonCircle size='64px' />
        <div style={{ flex: 1 }}>
          <SkeletonText lines={2} width={['70%', '50%']} />
        </div>
      </div>
      <SkeletonCard height='200px' style={{ borderRadius: '8px' }} />
    </div>
  );
}

export function SkeletonList({ count = 5, renderItem }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderItem ? renderItem(i) : <SkeletonBridgeCard />}</div>
      ))}
    </div>
  );
}
