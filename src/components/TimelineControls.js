import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

function TimelineControls({ 
  scenario, 
  time, 
  isPlaying, 
  speed, 
  onPlayPause, 
  onReset, 
  onSpeedChange, 
  onSeek 
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * scenario.duration);
  };

  const progress = (time / scenario.duration) * 100;

  return (
    <div className="timeline-controls">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="text-muted small">
          <span className="text-light fw-bold">T+{formatTime(time)}</span>
          {' / '}
          {formatTime(scenario.duration)}
        </div>
        <div className="fw-bold text-light small">{scenario.name}</div>
      </div>

      {/* Timeline Bar */}
      <div 
        className="timeline-bar"
        onClick={handleSeek}
      >
        <div 
          className="timeline-progress"
          style={{ width: `${progress}%` }}
        />
        {/* Event Markers */}
        {scenario.events.map((event, idx) => (
          <div
            key={idx}
            className="timeline-marker"
            style={{ 
              left: `${(event.time / scenario.duration) * 100}%`,
              background: event.type === 'earthquake' ? '#ef4444' : 
                         event.type === 'aftershock' ? '#f97316' : 
                         '#3b82f6'
            }}
            title={`${event.name} at T+${formatTime(event.time)}`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <ButtonGroup size="sm">
          <Button variant="outline-light" onClick={onReset} title="Reset">
            🔄
          </Button>
          <Button variant="outline-light" onClick={() => onSeek(Math.max(0, time - 30))} title="Back 30s">
            ⏮️
          </Button>
          <Button 
            variant={isPlaying ? 'danger' : 'success'} 
            onClick={onPlayPause}
            className="px-4"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </Button>
          <Button variant="outline-light" onClick={() => onSeek(Math.min(scenario.duration, time + 30))} title="Forward 30s">
            ⏭️
          </Button>
        </ButtonGroup>

        <ButtonGroup size="sm">
          {[1, 5, 10, 30].map(s => (
            <Button
              key={s}
              variant={speed === s ? 'primary' : 'outline-light'}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}

export default TimelineControls;

