import React from 'react';

function MapLegend({ mode }) {
  const riskColors = [
    { color: '#10b981', label: 'Low' },
    { color: '#f59e0b', label: 'Medium' },
    { color: '#f97316', label: 'High' },
    { color: '#ef4444', label: 'Extreme' }
  ];

  const damageColors = [
    { color: '#10b981', label: 'Intact' },
    { color: '#f59e0b', label: 'Minor' },
    { color: '#f97316', label: 'Moderate' },
    { color: '#ef4444', label: 'Severe' },
    { color: '#1f2937', label: 'Collapsed' }
  ];

  const colors = mode === 'simulation' ? damageColors : riskColors;
  const title = mode === 'simulation' ? 'Damage Level' : 'Risk Level';

  return (
    <div className="map-legend">
      <div className="text-muted small text-uppercase mb-2" style={{ 
        fontSize: '0.7rem', 
        fontWeight: 600, 
        letterSpacing: '0.08em' 
      }}>
        {title}
      </div>
      <div className="d-flex gap-1 mb-2">
        {colors.map((c, idx) => (
          <div 
            key={idx}
            style={{ 
              flex: 1, 
              height: '8px', 
              backgroundColor: c.color,
              borderRadius: '2px'
            }}
          />
        ))}
      </div>
      <div className="d-flex justify-content-between" style={{ fontSize: '0.7rem' }}>
        <span className="text-muted">{colors[0].label}</span>
        <span className="text-muted">{colors[colors.length - 1].label}</span>
      </div>
    </div>
  );
}

export default MapLegend;

