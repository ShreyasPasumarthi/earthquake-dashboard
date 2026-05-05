import React from 'react';

function TsunamiBanner({ state }) {
  if (!state.visible) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBannerClass = () => {
    switch (state.phase) {
      case 'arrived': return 'tsunami-banner arrived';
      case 'receding': return 'tsunami-banner receding';
      case 'clear': return 'tsunami-banner clear';
      default: return 'tsunami-banner';
    }
  };

  const getMessage = () => {
    switch (state.phase) {
      case 'arrived': 
        return { title: '🔴 TSUNAMI IMPACT', message: 'Move to higher ground immediately' };
      case 'receding': 
        return { title: '⚠️ WATERS RECEDING', message: 'Stay on high ground — Additional waves possible' };
      case 'clear': 
        return { title: '✅ ALL CLEAR', message: 'Tsunami threat has passed' };
      default: 
        return { title: '⚠️ TSUNAMI WARNING', message: `Arriving in ${formatTime(state.eta)}` };
    }
  };

  const { title, message } = getMessage();

  return (
    <div className={getBannerClass()}>
      <span style={{ fontSize: '1.3rem' }}>🌊</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title}</span>
        <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{message}</span>
      </div>
    </div>
  );
}

export default TsunamiBanner;

