import React, { useState } from 'react';
import { Card, Form, Nav, Tab, Badge, ProgressBar } from 'react-bootstrap';
import { getRiskLevel } from '../data/neighborhoods';
import { computeBaseHomeRisk, generateRecommendations } from '../utils/riskCalculations';
import { marinaRisk } from '../data/neighborhoods';

function Sidebar({ 
  mode, 
  selectedNeighborhood, 
  selectedHome, 
  processedHomes,
  buildingDamage,
  currentScenario, 
  scenarios, 
  simulationTime,
  onScenarioChange,
  onHomeUpdate,
  onHomeSelect
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editedHome, setEditedHome] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDamageStats = () => {
    const damages = Object.values(buildingDamage);
    return {
      collapsed: damages.filter(d => d >= 90).length,
      severe: damages.filter(d => d >= 60 && d < 90).length,
      moderate: damages.filter(d => d >= 30 && d < 60).length,
      intact: damages.filter(d => d < 30).length
    };
  };

  const handleFormChange = (field, value) => {
    const updated = { ...editedHome, [field]: value };
    const riskResult = computeBaseHomeRisk(updated, marinaRisk);
    updated.baseRisk = riskResult.baseRisk;
    updated.riskFactors = riskResult.factors;
    setEditedHome(updated);
    if (onHomeUpdate) onHomeUpdate(updated);
  };

  React.useEffect(() => {
    if (selectedHome) {
      setEditedHome(selectedHome);
    }
  }, [selectedHome]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2 && processedHomes) {
      const results = processedHomes.filter(home => 
        home.address.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectResult = (home) => {
    setSearchQuery(home.address);
    setSearchResults([]);
    if (onHomeSelect) onHomeSelect(home);
  };

  const getRiskColor = (value) => {
    if (value >= 75) return '#ef4444';
    if (value >= 50) return '#f97316';
    if (value >= 25) return '#eab308';
    return '#22c55e';
  };

  const getRiskExplanation = (factor, value) => {
    const explanations = {
      seismic: value >= 60 
        ? 'High earthquake shaking risk due to proximity to fault lines and 1906/1989 damage history.'
        : 'Moderate seismic activity. Modern building codes help reduce risk.',
      liquefaction: value >= 60 
        ? 'Built on filled land that can liquefy during earthquakes, causing buildings to sink or tilt.'
        : 'Some areas have fill soil, but overall foundation is more stable.',
      tsunami: value >= 60 
        ? 'Low-lying coastal area at risk of tsunami flooding from Pacific events.'
        : 'Elevation and distance from coast provide some protection.',
      infrastructure: value >= 60 
        ? 'Aging gas lines, water mains, and electrical systems prone to failure.'
        : 'Infrastructure has been partially upgraded with redundant systems.',
      displacement: value >= 60 
        ? 'High housing costs mean many residents may not return after a disaster.'
        : 'Strong community ties help residents recover and return.',
      property: value >= 60 
        ? 'High property values mean significant financial exposure to damage.'
        : 'Moderate property values with mix of newer construction.'
    };
    return explanations[factor] || '';
  };

  // Styles
  const styles = {
    container: {
      padding: '20px',
      height: '100%',
      overflowY: 'auto'
    },
    searchContainer: {
      marginBottom: '20px'
    },
    searchInput: {
      backgroundColor: '#2d3748',
      border: '2px solid #4a5568',
      borderRadius: '12px',
      padding: '14px 18px',
      fontSize: '16px',
      color: '#f7fafc',
      width: '100%'
    },
    searchResults: {
      backgroundColor: '#2d3748',
      border: '2px solid #4a5568',
      borderRadius: '12px',
      marginTop: '8px',
      overflow: 'hidden'
    },
    searchResultItem: {
      padding: '14px 18px',
      cursor: 'pointer',
      borderBottom: '1px solid #4a5568',
      transition: 'background 0.2s'
    },
    card: {
      backgroundColor: '#1e2433',
      border: '1px solid #374151',
      borderRadius: '16px',
      marginBottom: '20px',
      overflow: 'hidden'
    },
    cardHeader: {
      backgroundColor: '#252d3d',
      padding: '18px 20px',
      borderBottom: '1px solid #374151'
    },
    cardBody: {
      padding: '20px'
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#9ca3af',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '16px'
    },
    riskScoreCircle: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    riskScoreValue: {
      fontSize: '42px',
      fontWeight: '800',
      color: '#ffffff',
      lineHeight: '1'
    },
    riskScoreLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.85)',
      textTransform: 'uppercase',
      marginTop: '4px'
    },
    factorRow: {
      marginBottom: '20px'
    },
    factorHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    factorName: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#e2e8f0'
    },
    factorValue: {
      fontSize: '18px',
      fontWeight: '700'
    },
    factorExplanation: {
      fontSize: '14px',
      color: '#9ca3af',
      lineHeight: '1.5',
      marginTop: '8px'
    },
    progressBar: {
      height: '10px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '5px'
    },
    badge: {
      fontSize: '13px',
      fontWeight: '600',
      padding: '6px 12px',
      borderRadius: '8px'
    },
    text: {
      primary: '#f7fafc',
      secondary: '#a0aec0',
      muted: '#718096'
    }
  };

  const renderAssessmentContent = () => (
    <div style={styles.container}>
      {/* Search Bar */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="🔍 Search Marina addresses..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={styles.searchInput}
        />
        {searchResults.length > 0 && (
          <div style={styles.searchResults}>
            {searchResults.map(home => (
              <div
                key={home.id}
                style={styles.searchResultItem}
                onClick={() => handleSelectResult(home)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontSize: '15px', color: '#f7fafc', fontWeight: '500' }}>
                  {home.address}
                </div>
                <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>
                  Risk Score: <span style={{ color: getRiskColor(home.baseRisk), fontWeight: '700' }}>{home.baseRisk}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: '13px', color: '#718096', marginTop: '10px' }}>
          Click Marina on the map or search for a specific address
        </p>
      </div>

      {/* Neighborhood View */}
      {selectedNeighborhood && !selectedHome && (
        <div style={styles.card}>
          <div style={{
            ...styles.cardHeader,
            background: 'linear-gradient(135deg, #3730a3 0%, #1e2433 100%)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '4px' }}>
                  📍 Neighborhood
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>
                  {selectedNeighborhood.name}
                </div>
              </div>
              <div style={{
                ...styles.riskScoreCircle,
                width: '80px',
                height: '80px',
                background: `linear-gradient(135deg, ${getRiskColor(selectedNeighborhood.overallRisk)}cc, ${getRiskColor(selectedNeighborhood.overallRisk)}66)`,
                border: `3px solid ${getRiskColor(selectedNeighborhood.overallRisk)}`
              }}>
                <span style={{ ...styles.riskScoreValue, fontSize: '28px' }}>
                  {selectedNeighborhood.overallRisk}
                </span>
                <span style={{ ...styles.riskScoreLabel, fontSize: '10px' }}>
                  {getRiskLevel(selectedNeighborhood.overallRisk).label}
                </span>
              </div>
            </div>
          </div>
          
          <div style={styles.cardBody}>
            <p style={{ fontSize: '15px', color: '#a0aec0', lineHeight: '1.6', marginBottom: '24px' }}>
              {selectedNeighborhood.summary}
            </p>
            
            <div style={styles.sectionTitle}>Risk Breakdown</div>
            
            {Object.entries(selectedNeighborhood.risks).map(([key, value]) => (
              <div key={key} style={styles.factorRow}>
                <div style={styles.factorHeader}>
                  <span style={styles.factorName}>
                    {key === 'seismic' && '🌍'} 
                    {key === 'liquefaction' && '💧'} 
                    {key === 'tsunami' && '🌊'} 
                    {key === 'infrastructure' && '🏗️'} 
                    {key === 'displacement' && '🏃'} 
                    {key === 'property' && '💰'} 
                    {' '}{key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                  <span style={{ ...styles.factorValue, color: getRiskColor(value) }}>
                    {value}
                  </span>
                </div>
                <ProgressBar 
                  now={value} 
                  style={styles.progressBar}
                  variant={value >= 75 ? 'danger' : value >= 50 ? 'warning' : 'success'}
                />
                <p style={styles.factorExplanation}>
                  {getRiskExplanation(key, value)}
                </p>
              </div>
            ))}

            {selectedNeighborhood.name === 'Marina' && (
              <div style={{
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '2px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '20px'
              }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#a5b4fc', marginBottom: '6px' }}>
                  💡 Explore Building Data
                </div>
                <div style={{ fontSize: '14px', color: '#a0aec0' }}>
                  Click on individual buildings to see detailed risk assessments, or use the search bar above.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Home View */}
      {selectedHome && editedHome && (
        <div style={styles.card}>
          {/* Header with Address */}
          <div style={{
            ...styles.cardHeader,
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1e2433 100%)'
          }}>
            <div style={{ fontSize: '12px', color: '#93c5fd', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🏠 Selected Property
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              {editedHome.address}
            </div>
            {/* Building Info Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              <span style={{ ...styles.badge, backgroundColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '12px' }}>
                🏗️ {editedHome.yearBuilt}
              </span>
              <span style={{ ...styles.badge, backgroundColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '12px' }}>
                {editedHome.floors} floors
              </span>
              <span style={{ ...styles.badge, backgroundColor: 'rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: '12px' }}>
                {editedHome.material}
              </span>
              {editedHome.retrofitted && (
                <span style={{ ...styles.badge, backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '12px' }}>
                  ✓ Retrofitted
                </span>
              )}
              {editedHome.softStory && (
                <span style={{ ...styles.badge, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '12px' }}>
                  ⚠ Soft Story
                </span>
              )}
            </div>
          </div>
          
          <div style={styles.cardBody}>
            {/* Section Navigation - FIRST */}
            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '14px',
              padding: '6px',
              marginBottom: '20px',
              border: '2px solid #374151'
            }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: '700', 
                color: '#6b7280', 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                textAlign: 'center',
                marginBottom: '8px',
                paddingTop: '4px'
              }}>
                ▼ Choose what to explore
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'overview', icon: '📋', label: 'Overview', desc: 'Key risks & tips' },
                  { id: 'factors', icon: '📊', label: 'Factors', desc: 'Score breakdown' },
                  { id: 'whatif', icon: '🔧', label: 'What-If', desc: 'Edit & simulate' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: '12px 8px',
                      borderRadius: '10px',
                      border: activeTab === tab.id ? '2px solid #818cf8' : '2px solid transparent',
                      backgroundColor: activeTab === tab.id ? '#4f46e5' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{tab.icon}</div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: activeTab === tab.id ? '#ffffff' : '#e2e8f0',
                      marginBottom: '2px'
                    }}>
                      {tab.label}
                    </div>
                    <div style={{ 
                      fontSize: '10px', 
                      color: activeTab === tab.id ? '#c7d2fe' : '#6b7280'
                    }}>
                      {tab.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* EARTHQUAKE RISK SCORE - Prominent Display */}
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              border: `3px solid ${getRiskColor(editedHome.baseRisk)}`,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '12px'
              }}>
                🌍 Earthquake Risk Score
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${getRiskColor(editedHome.baseRisk)}cc, ${getRiskColor(editedHome.baseRisk)}66)`,
                  border: `4px solid ${getRiskColor(editedHome.baseRisk)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 30px ${getRiskColor(editedHome.baseRisk)}44`
                }}>
                  <span style={{ fontSize: '38px', fontWeight: '800', color: '#ffffff', lineHeight: '1' }}>
                    {editedHome.baseRisk}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>
                    {getRiskLevel(editedHome.baseRisk).label}
                  </span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                    Score Range: 0-100
                  </div>
                  <div style={{ fontSize: '14px', color: '#e2e8f0' }}>
                    <span style={{ color: '#22c55e' }}>0-25</span> Low • 
                    <span style={{ color: '#eab308' }}> 26-50</span> Med • 
                    <span style={{ color: '#f97316' }}> 51-75</span> High • 
                    <span style={{ color: '#ef4444' }}> 76+</span> Extreme
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content - Navigation is above */}
            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
              <Tab.Content>
                {/* Overview Tab */}
                <Tab.Pane eventKey="overview">
                  <div style={styles.sectionTitle}>Key Vulnerabilities</div>
                  
                  {editedHome.yearBuilt < 1970 && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      borderLeft: '4px solid #ef4444',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#fca5a5' }}>
                        🏚️ Pre-1970 Construction
                      </div>
                      <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '4px' }}>
                        Built before modern seismic building codes were enacted.
                      </div>
                    </div>
                  )}
                  
                  {editedHome.material === 'brick' && (
                    <div style={{
                      backgroundColor: 'rgba(249, 115, 22, 0.15)',
                      borderLeft: '4px solid #f97316',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#fdba74' }}>
                        🧱 Unreinforced Masonry
                      </div>
                      <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '4px' }}>
                        Brick buildings have higher collapse risk during earthquakes.
                      </div>
                    </div>
                  )}
                  
                  {editedHome.softStory && (
                    <div style={{
                      backgroundColor: 'rgba(234, 179, 8, 0.15)',
                      borderLeft: '4px solid #eab308',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#fde047' }}>
                        🏗️ Soft Story Structure
                      </div>
                      <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '4px' }}>
                        Weak ground floor (parking/retail) increases collapse risk.
                      </div>
                    </div>
                  )}
                  
                  <div style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderLeft: '4px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#93c5fd' }}>
                      💧 Liquefaction Zone
                    </div>
                    <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '4px' }}>
                      Marina's fill soil can liquefy and amplify earthquake shaking.
                    </div>
                  </div>

                  <div style={styles.sectionTitle}>Recommendations</div>
                  {generateRecommendations(editedHome, marinaRisk, selectedHome.neighborResult, editedHome.baseRisk)
                    .slice(0, 3)
                    .map((rec, idx) => (
                      <div key={idx} style={{
                        backgroundColor: '#2d3748',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>
                          {rec.icon} {rec.title}
                        </div>
                        <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '6px' }}>
                          {rec.desc}
                        </div>
                      </div>
                    ))}
                </Tab.Pane>

                {/* Factors Tab */}
                <Tab.Pane eventKey="factors">
                  <div style={styles.sectionTitle}>Score Breakdown</div>
                  
                  {[
                    { label: 'Building Age', value: editedHome.riskFactors.age, detail: editedHome.yearBuilt },
                    { label: 'Material', value: editedHome.riskFactors.material, detail: editedHome.material },
                    { label: 'Floors', value: editedHome.riskFactors.floors, detail: editedHome.floors },
                    { label: 'Liquefaction', value: editedHome.riskFactors.liquefaction, detail: 'Marina zone' },
                    ...(editedHome.retrofitted ? [{ label: 'Retrofit Bonus', value: editedHome.riskFactors.retrofit, detail: 'Applied', isBonus: true }] : []),
                    ...(editedHome.softStory ? [{ label: 'Soft Story Penalty', value: editedHome.riskFactors.softStory, detail: 'Present' }] : [])
                  ].map((factor, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: '1px solid #374151'
                    }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: '#e2e8f0' }}>
                          {factor.label}
                        </div>
                        <div style={{ fontSize: '13px', color: '#718096' }}>
                          {factor.detail}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: factor.isBonus ? '#22c55e' : (factor.value > 15 ? '#ef4444' : '#eab308')
                      }}>
                        {factor.isBonus ? '' : '+'}{factor.value}
                      </div>
                    </div>
                  ))}
                </Tab.Pane>

                {/* What-If Tab */}
                <Tab.Pane eventKey="whatif">
                  <p style={{ fontSize: '14px', color: '#718096', marginBottom: '20px' }}>
                    Adjust building attributes to see how they affect the risk score.
                  </p>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#a0aec0', marginBottom: '8px', display: 'block' }}>
                      Year Built
                    </label>
                    <input
                      type="number"
                      value={editedHome.yearBuilt}
                      onChange={(e) => handleFormChange('yearBuilt', parseInt(e.target.value))}
                      style={{
                        ...styles.searchInput,
                        padding: '12px 14px'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#a0aec0', marginBottom: '8px', display: 'block' }}>
                      Construction Material
                    </label>
                    <select
                      value={editedHome.material}
                      onChange={(e) => handleFormChange('material', e.target.value)}
                      style={{
                        ...styles.searchInput,
                        padding: '12px 14px'
                      }}
                    >
                      <option value="wood">Wood Frame</option>
                      <option value="brick">Brick/Masonry</option>
                      <option value="concrete">Reinforced Concrete</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#a0aec0', marginBottom: '8px', display: 'block' }}>
                      Number of Floors
                    </label>
                    <input
                      type="number"
                      value={editedHome.floors}
                      min={1}
                      max={10}
                      onChange={(e) => handleFormChange('floors', parseInt(e.target.value))}
                      style={{
                        ...styles.searchInput,
                        padding: '12px 14px'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editedHome.retrofitted}
                        onChange={(e) => handleFormChange('retrofitted', e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#6366f1' }}
                      />
                      <span style={{ fontSize: '15px', color: '#e2e8f0' }}>Seismically Retrofitted</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editedHome.softStory}
                        onChange={(e) => handleFormChange('softStory', e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#6366f1' }}
                      />
                      <span style={{ fontSize: '15px', color: '#e2e8f0' }}>Soft Story Building</span>
                    </label>
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </div>
        </div>
      )}

      {/* Welcome State */}
      {!selectedNeighborhood && !selectedHome && (
        <div style={{
          ...styles.card,
          textAlign: 'center',
          padding: '40px 30px'
        }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>🗺️</div>
          <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#f7fafc', marginBottom: '16px' }}>
            Earthquake Risk Assessment
          </h3>
          <p style={{ fontSize: '16px', color: '#a0aec0', lineHeight: '1.6' }}>
            Click on any neighborhood to view its risk profile.
            <br /><br />
            Click on <strong style={{ color: '#a5b4fc' }}>Marina</strong> to explore building-level data.
          </p>
        </div>
      )}
    </div>
  );

  const renderSimulationContent = () => {
    const scenario = scenarios[currentScenario];
    const stats = getDamageStats();
    
    return (
      <div style={styles.container}>
        {/* Scenario Selection */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f7fafc' }}>
              🎬 Scenario Selection
            </div>
          </div>
          <div style={styles.cardBody}>
            {Object.values(scenarios).map(s => (
              <div 
                key={s.id}
                onClick={() => onScenarioChange(s.id)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  backgroundColor: currentScenario === s.id ? 'rgba(99, 102, 241, 0.25)' : '#2d3748',
                  border: currentScenario === s.id ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#f7fafc' }}>{s.name}</span>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: '600',
                    backgroundColor: '#4a5568',
                    color: '#e2e8f0',
                    padding: '4px 10px',
                    borderRadius: '6px'
                  }}>
                    {formatTime(s.duration)}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '6px' }}>
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Damage Statistics */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f7fafc' }}>
              📊 Damage Statistics
            </div>
          </div>
          <div style={styles.cardBody}>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
              {[
                { label: 'Collapsed', value: stats.collapsed, color: '#ef4444' },
                { label: 'Severe', value: stats.severe, color: '#f97316' },
                { label: 'Moderate', value: stats.moderate, color: '#eab308' },
                { label: 'Intact', value: stats.intact, color: '#22c55e' }
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '13px', color: '#a0aec0' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <ProgressBar style={styles.progressBar}>
              <ProgressBar variant="danger" now={(stats.collapsed / Math.max(processedHomes.length, 1)) * 100} key={1} />
              <ProgressBar variant="warning" now={(stats.severe / Math.max(processedHomes.length, 1)) * 100} key={2} />
              <ProgressBar style={{ backgroundColor: '#eab308' }} now={(stats.moderate / Math.max(processedHomes.length, 1)) * 100} key={3} />
              <ProgressBar variant="success" now={(stats.intact / Math.max(processedHomes.length, 1)) * 100} key={4} />
            </ProgressBar>
          </div>
        </div>

        {/* Emergency Guidance */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f7fafc' }}>
              📢 Emergency Guidance
            </div>
          </div>
          <div style={styles.cardBody}>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#93c5fd', marginBottom: '8px' }}>
                👥 For Civilians
              </div>
              <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                {simulationTime === 0 ? 'Press play to start the simulation.' :
                 simulationTime < 60 ? 'Drop, Cover, and Hold On. Move away from windows and heavy objects.' :
                 'Check for injuries. If in a damaged building, evacuate to a shelter.'}
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              borderLeft: '4px solid #f97316',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#fdba74', marginBottom: '8px' }}>
                🚒 For First Responders
              </div>
              <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                {simulationTime === 0 ? 'Awaiting simulation start.' :
                 stats.collapsed > 0 ? `Priority: ${stats.collapsed} collapsed structures. Deploy search and rescue teams.` :
                 'Conduct damage assessments and monitor for aftershocks.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      height: '100%', 
      backgroundColor: '#111827',
      overflowY: 'auto'
    }}>
      {mode === 'assessment' ? renderAssessmentContent() : renderSimulationContent()}
    </div>
  );
}

export default Sidebar;
