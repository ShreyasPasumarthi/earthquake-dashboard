import React from 'react';
import { Button } from 'react-bootstrap';

function AlertPanel({ alerts, onDismiss }) {
  if (alerts.length === 0) return null;

  const getAlertClass = (type) => {
    switch (type) {
      case 'critical': return 'alert-critical';
      case 'warning': return 'alert-warning';
      default: return 'alert-info';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="alert-panel">
      {alerts.slice(-3).map(alert => (
        <div key={alert.id} className={`alert-item ${getAlertClass(alert.type)}`}>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="fw-bold small">
                {getAlertIcon(alert.type)} {alert.title}
              </div>
              <div className="text-muted small mt-1">{alert.body}</div>
            </div>
            <Button 
              variant="link" 
              size="sm" 
              className="text-muted p-0 ms-2"
              onClick={() => onDismiss(alert.id)}
            >
              ✕
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AlertPanel;

