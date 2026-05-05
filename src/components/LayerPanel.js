import React from 'react';
import { Form } from 'react-bootstrap';

function LayerPanel({ visibility, onToggle }) {
  const layers = [
    { id: 'shockwave', label: '🌊 Shockwave' },
    { id: 'damage', label: '🏚️ Building Damage' },
    { id: 'epicenter', label: '💥 Epicenter' },
    { id: 'evacuation', label: '🏕️ Evacuation Shelters' },
    { id: 'responders', label: '🚒 First Responders' },
    { id: 'tsunami', label: '🌊 Tsunami Wave' }
  ];

  return (
    <div className="layer-panel">
      <h6 className="text-muted small text-uppercase mb-3">Map Layers</h6>
      {layers.map(layer => (
        <div 
          key={layer.id}
          className="layer-item"
          onClick={() => onToggle(layer.id)}
        >
          <Form.Check
            type="checkbox"
            checked={visibility[layer.id]}
            onChange={() => {}}
            className="me-2"
          />
          <span className="small text-light">{layer.label}</span>
        </div>
      ))}
    </div>
  );
}

export default LayerPanel;

