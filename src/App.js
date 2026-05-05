import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Navbar, Nav, Button, ButtonGroup } from 'react-bootstrap';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Circle, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Components
import Sidebar from './components/Sidebar';
import TimelineControls from './components/TimelineControls';
import LayerPanel from './components/LayerPanel';
import AlertPanel from './components/AlertPanel';
import TsunamiBanner from './components/TsunamiBanner';
import SummaryModal from './components/SummaryModal';
import MapLegend from './components/MapLegend';

// Data and Utils
import { neighborhoodRiskData, getRiskColor, marinaRisk } from './data/neighborhoods';
import { scenarios, TSUNAMI_CONFIG, assemblyPoints, firstResponderUnits } from './data/scenarios';
import { computeBaseHomeRisk, computeNeighborBoost, calculateEventDamage, getDamageColor } from './utils/riskCalculations';

// Map Controller Component for flying to locations
function MapController({ center, zoom }) {
  const map = useMap();
  const initialRender = React.useRef(true);
  
  React.useEffect(() => {
    // Skip the initial render since MapContainer already sets initial view
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (center && zoom) {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Interactive Neighborhoods Layer
function NeighborhoodsLayer({ data, onNeighborhoodClick, showMarinaBuildings }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (!data || !data.features) {
      console.log('No neighborhood data loaded');
      return;
    }
    
    console.log(`Loading ${data.features.length} neighborhoods`);
    const layers = [];
    
    data.features.forEach((feature) => {
      const name = feature.properties?.neighborhood;
      const riskData = neighborhoodRiskData[name];
      const risk = riskData ? riskData.overallRisk : 40;
      
      const style = {
        fillColor: getRiskColor(risk),
        weight: name === 'Marina' && showMarinaBuildings ? 2 : 1,
        opacity: 1,
        color: name === 'Marina' && showMarinaBuildings ? '#6366f1' : '#ffffff',
        fillOpacity: name === 'Marina' && showMarinaBuildings ? 0.2 : 0.6
      };
      
      const layer = L.geoJSON(feature, { style });
      
      layer.on('click', () => {
        console.log(`Clicked on: ${name}`);
        onNeighborhoodClick(feature);
      });
      
      layer.on('mouseover', (e) => {
        if (!(name === 'Marina' && showMarinaBuildings)) {
          e.target.setStyle({ fillOpacity: 0.8 });
        }
      });
      
      layer.on('mouseout', (e) => {
        e.target.setStyle({ 
          fillOpacity: name === 'Marina' && showMarinaBuildings ? 0.2 : 0.6 
        });
      });
      
      layer.addTo(map);
      layers.push(layer);
    });
    
    return () => {
      layers.forEach(layer => map.removeLayer(layer));
    };
  }, [data, map, onNeighborhoodClick, showMarinaBuildings]);
  
  return null;
}

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() {
  // Mode state
  const [mode, setMode] = useState('assessment'); // 'assessment' or 'simulation'
  
  // Map state
  const [neighborhoods, setNeighborhoods] = useState(null);
  const [processedHomes, setProcessedHomes] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [selectedHome, setSelectedHome] = useState(null);
  const [showMarinaBuildings, setShowMarinaBuildings] = useState(false);
  const [mapView, setMapView] = useState({ center: [37.76, -122.44], zoom: 12.4 });
  
  // Simulation state
  const [currentScenario, setCurrentScenario] = useState('offshore_tsunami');
  const [simulationTime, setSimulationTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const [buildingDamage, setBuildingDamage] = useState({});
  const [tsunamiDamage, setTsunamiDamage] = useState({});
  const [tsunamiDamagedBuildings, setTsunamiDamagedBuildings] = useState(new Set());
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState(new Set());
  const [showSummary, setShowSummary] = useState(false);
  const [summaryShown, setSummaryShown] = useState(false);
  
  // Layer visibility
  const [layerVisibility, setLayerVisibility] = useState({
    shockwave: true,
    damage: true,
    epicenter: true,
    evacuation: true,
    responders: true,
    tsunami: true
  });
  
  // Tsunami state
  const [tsunamiBannerState, setTsunamiBannerState] = useState({ visible: false, phase: 'warning', eta: 0 });
  const [tsunamiWaveFront, setTsunamiWaveFront] = useState(null);
  const [floodZone, setFloodZone] = useState(null);
  
  // Shockwave state
  const [shockwaves, setShockwaves] = useState([]);
  const [epicenters, setEpicenters] = useState([]);
  
  // Refs
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  
  // Load GeoJSON data
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/SanFrancisco.Neighborhoods.json`)
      .then(res => res.json())
      .then(data => setNeighborhoods(data))
      .catch(err => console.error('Error loading neighborhoods:', err));
    
    fetch(`${process.env.PUBLIC_URL}/data/Marina_Buildings.geojson`)
      .then(res => res.json())
      .then(data => {
        const processed = processBuildings(data);
        setProcessedHomes(processed);
      })
      .catch(err => console.error('Error loading buildings:', err));
  }, []);
  
  // Process building data
  const processBuildings = (data) => {
    return data.features.map((f, i) => {
      const coords = f.geometry.coordinates[0][0];
      const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
      const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
      const heightM = parseFloat(f.properties.hgt_median_m) || 3;
      
      // Generate varied building attributes based on location
      const latBand = Math.floor((lat - 37.795) * 1000);
      const lngBand = Math.floor((lng + 122.45) * 1000);
      const seed = i * 17 + latBand * 31 + lngBand * 47;
      const pseudoRandom = Math.abs((Math.sin(seed) * 10000) % 1);
      
      // Create spatial zones with different characteristics
      let yearBuilt, material, retrofitted;
      const isNorthernCoastal = lat > 37.803;
      const isOldCore = lat > 37.800 && lat < 37.805 && lng > -122.44 && lng < -122.43;
      
      if (isNorthernCoastal) {
        yearBuilt = 1920 + Math.floor(pseudoRandom * 35);
        material = pseudoRandom < 0.6 ? 'wood' : 'brick';
        retrofitted = pseudoRandom > 0.8;
      } else if (isOldCore) {
        yearBuilt = 1935 + Math.floor(pseudoRandom * 30);
        material = pseudoRandom < 0.4 ? 'brick' : pseudoRandom < 0.7 ? 'wood' : 'mixed';
        retrofitted = pseudoRandom > 0.6;
      } else {
        yearBuilt = 1960 + Math.floor(pseudoRandom * 50);
        material = pseudoRandom < 0.3 ? 'concrete' : pseudoRandom < 0.6 ? 'wood' : 'mixed';
        retrofitted = pseudoRandom > 0.4;
      }
      
      const floors = Math.max(1, Math.min(6, Math.round(heightM / 3.5)));
      const softStory = floors >= 2 && pseudoRandom < 0.3 && !retrofitted;
      const nearCoast = lat > 37.805;
      
      const home = {
        id: `home-${i}`,
        lat,
        lng,
        address: `${Math.floor(1000 + pseudoRandom * 3000)} ${['Marina Blvd', 'Beach St', 'Bay St', 'Chestnut St', 'Lombard St'][Math.floor(pseudoRandom * 5)]}`,
        yearBuilt,
        material,
        floors,
        retrofitted,
        softStory,
        nearCoast,
        geometry: f.geometry
      };
      
      // Compute base risk
      const riskResult = computeBaseHomeRisk(home, marinaRisk);
      home.baseRisk = riskResult.baseRisk;
      home.riskFactors = riskResult.factors;
      
      return home;
    });
  };
  
  // Simulation loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const animate = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      
      setSimulationTime(prev => {
        const scenario = scenarios[currentScenario];
        const newTime = Math.min(prev + delta * playbackSpeed, scenario.duration);
        return newTime;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentScenario]);
  
  // Update simulation state when time changes
  useEffect(() => {
    if (mode !== 'simulation') return;
    
    const scenario = scenarios[currentScenario];
    updateSimulation(scenario, simulationTime);
  }, [simulationTime, currentScenario, mode]);
  
  // Update simulation
  const updateSimulation = useCallback((scenario, time) => {
    // Update shockwaves
    const newShockwaves = [];
    const newEpicenters = [];
    
    scenario.events.forEach(event => {
      if (event.type === 'earthquake' || event.type === 'aftershock') {
        const elapsed = time - event.time;
        if (elapsed >= 0 && elapsed < 60) {
          const maxRadius = event.magnitude * 15000;
          const radius = (elapsed / 60) * maxRadius;
          const opacity = Math.max(0.1, 0.8 - (elapsed / 60) * 0.7);
          newShockwaves.push({
            id: `shockwave-${event.time}`,
            center: event.location,
            radius,
            opacity,
            color: event.type === 'earthquake' ? '#ef4444' : '#f97316'
          });
        }
        if (elapsed >= 0 && elapsed < 300) {
          newEpicenters.push({
            id: `epicenter-${event.time}`,
            position: event.location,
            magnitude: event.magnitude,
            name: event.name
          });
        }
      }
    });
    
    setShockwaves(newShockwaves);
    setEpicenters(newEpicenters);
    
    // Update building damage
    if (layerVisibility.damage && processedHomes.length > 0) {
      const newDamage = {};
      processedHomes.forEach(home => {
        let totalDamage = 0;
        scenario.events.forEach(event => {
          if (event.type === 'earthquake' || event.type === 'aftershock') {
            totalDamage += calculateEventDamage(home, event, time, marinaRisk);
          }
        });
        // Add tsunami damage
        totalDamage += tsunamiDamage[home.id] || 0;
        newDamage[home.id] = Math.min(100, totalDamage);
      });
      setBuildingDamage(newDamage);
    }
    
    // Update alerts
    scenario.alerts.forEach(alert => {
      const alertKey = `${currentScenario}-${alert.title}-${alert.time}`;
      if (alert.time <= time && !triggeredAlerts.has(alertKey)) {
        setAlerts(prev => [...prev, { ...alert, id: alertKey }]);
        setTriggeredAlerts(prev => new Set([...prev, alertKey]));
        // Auto-dismiss after duration
        setTimeout(() => {
          setAlerts(prev => prev.filter(a => a.id !== alertKey));
        }, alert.duration * 100);
      }
    });
    
    // Update tsunami visualization
    updateTsunamiVisualization(scenario, time);
    
    // Check for simulation end
    checkSimulationEnd(scenario, time);
  }, [processedHomes, triggeredAlerts, tsunamiDamage, layerVisibility.damage, currentScenario]);
  
  // Tsunami visualization update
  const updateTsunamiVisualization = (scenario, time) => {
    const tsunamiEvent = scenario.events.find(e => e.type === 'tsunami');
    const tsunamiArrival = scenario.events.find(e => e.type === 'tsunami_arrival');
    
    if (!tsunamiEvent || !layerVisibility.tsunami) {
      setTsunamiBannerState({ visible: false, phase: 'warning', eta: 0 });
      setTsunamiWaveFront(null);
      setFloodZone(null);
      return;
    }
    
    const elapsedSinceWarning = time - tsunamiEvent.time;
    
    if (elapsedSinceWarning < 0) {
      setTsunamiBannerState({ visible: false, phase: 'warning', eta: 0 });
      return;
    }
    
    const cfg = TSUNAMI_CONFIG;
    const arrivalTime = tsunamiArrival ? tsunamiArrival.time : tsunamiEvent.time + cfg.approachDuration;
    const eta = arrivalTime - time;
    const elapsedSinceArrival = time - arrivalTime;
    
    // Update banner state
    if (eta > 0) {
      setTsunamiBannerState({ visible: true, phase: 'warning', eta });
    } else if (elapsedSinceArrival < cfg.advanceDuration + cfg.peakDuration) {
      setTsunamiBannerState({ visible: true, phase: 'arrived', eta: 0 });
    } else if (elapsedSinceArrival < cfg.advanceDuration + cfg.peakDuration + cfg.recedeDuration) {
      setTsunamiBannerState({ visible: true, phase: 'receding', eta: 0 });
    } else {
      setTsunamiBannerState({ visible: true, phase: 'clear', eta: 0 });
    }
    
    // Calculate wave position
    let waveFrontLat = cfg.oceanStart;
    let floodPolygon = null;
    
    if (elapsedSinceArrival < 0) {
      // Approaching
      const approachProgress = Math.max(0, elapsedSinceWarning / (arrivalTime - tsunamiEvent.time));
      waveFrontLat = cfg.oceanStart - (cfg.oceanStart - cfg.coastline) * approachProgress;
    } else if (elapsedSinceArrival < cfg.advanceDuration) {
      // Advancing
      const t = elapsedSinceArrival / cfg.advanceDuration;
      const advanceProgress = t * (2 - t); // Ease out
      const maxPenetration = cfg.coastline - cfg.maxInland;
      waveFrontLat = cfg.coastline - (maxPenetration * advanceProgress);
      
      // Flood polygon
      floodPolygon = [
        [cfg.coastline + 0.002, cfg.westEdge],
        [cfg.coastline + 0.002, cfg.eastEdge],
        [waveFrontLat, cfg.eastEdge],
        [waveFrontLat, cfg.westEdge]
      ];
      
      // Apply tsunami damage
      applyTsunamiDamage(waveFrontLat);
    } else if (elapsedSinceArrival < cfg.advanceDuration + cfg.peakDuration) {
      // Peak
      waveFrontLat = cfg.maxInland;
      floodPolygon = [
        [cfg.coastline + 0.002, cfg.westEdge],
        [cfg.coastline + 0.002, cfg.eastEdge],
        [cfg.maxInland, cfg.eastEdge],
        [cfg.maxInland, cfg.westEdge]
      ];
    } else if (elapsedSinceArrival < cfg.advanceDuration + cfg.peakDuration + cfg.recedeDuration) {
      // Receding
      const t = (elapsedSinceArrival - cfg.advanceDuration - cfg.peakDuration) / cfg.recedeDuration;
      const recedeProgress = t * t * t; // Ease in
      const maxPenetration = cfg.coastline - cfg.maxInland;
      waveFrontLat = cfg.maxInland + (maxPenetration * recedeProgress);
      
      floodPolygon = [
        [cfg.coastline + 0.002, cfg.westEdge],
        [cfg.coastline + 0.002, cfg.eastEdge],
        [waveFrontLat, cfg.eastEdge],
        [waveFrontLat, cfg.westEdge]
      ];
    }
    
    setTsunamiWaveFront(waveFrontLat < cfg.oceanStart ? waveFrontLat : null);
    setFloodZone(floodPolygon);
  };
  
  // Apply tsunami damage
  const applyTsunamiDamage = (waterEdgeLat) => {
    const cfg = TSUNAMI_CONFIG;
    const maxDepth = cfg.coastline - cfg.maxInland;
    
    processedHomes.forEach((home, index) => {
      const inLngBounds = home.lng >= cfg.westEdge && home.lng <= cfg.eastEdge;
      const inFloodZone = home.lat >= waterEdgeLat && home.lat <= cfg.coastline && inLngBounds;
      
      if (inFloodZone && !tsunamiDamagedBuildings.has(home.id)) {
        const depthFromCoast = cfg.coastline - home.lat;
        const normalizedDepth = Math.min(1, depthFromCoast / maxDepth);
        
        const ageFactor = home.yearBuilt < 1970 ? 1.3 : (home.yearBuilt < 1990 ? 1.15 : 1.0);
        const materialFactor = home.material === 'wood' ? 1.25 : (home.material === 'brick' ? 1.1 : 1.0);
        const retrofitFactor = home.retrofitted ? 0.75 : 1.0;
        
        const seed = index * 7919 + 54321;
        const pseudoRandom = Math.abs((Math.sin(seed) * 10000) % 1);
        
        const baseDamage = 40 + (1 - normalizedDepth) * 45;
        const variability = pseudoRandom * 15 - 7.5;
        
        const calculatedDamage = Math.max(30, baseDamage * ageFactor * materialFactor * retrofitFactor + variability);
        
        setTsunamiDamage(prev => ({ ...prev, [home.id]: calculatedDamage }));
        setTsunamiDamagedBuildings(prev => new Set([...prev, home.id]));
      }
    });
  };
  
  // Check for simulation end
  const checkSimulationEnd = (scenario, time) => {
    if (summaryShown) return;
    
    const hasTsunami = scenario.events.some(e => e.type === 'tsunami');
    
    if (hasTsunami) {
      const tsunamiArrival = scenario.events.find(e => e.type === 'tsunami_arrival');
      if (tsunamiArrival) {
        const elapsedSinceArrival = time - tsunamiArrival.time;
        const totalTsunamiDuration = TSUNAMI_CONFIG.advanceDuration + TSUNAMI_CONFIG.peakDuration + TSUNAMI_CONFIG.recedeDuration;
        
        if (elapsedSinceArrival >= totalTsunamiDuration + 30) {
          setIsPlaying(false);
          setShowSummary(true);
          setSummaryShown(true);
        }
      }
    } else {
      if (time >= scenario.duration * 0.9) {
        setIsPlaying(false);
        setShowSummary(true);
        setSummaryShown(true);
      }
    }
  };
  
  // Reset simulation
  const resetSimulation = () => {
    setSimulationTime(0);
    setIsPlaying(false);
    setBuildingDamage({});
    setTsunamiDamage({});
    setTsunamiDamagedBuildings(new Set());
    setAlerts([]);
    setTriggeredAlerts(new Set());
    setShockwaves([]);
    setEpicenters([]);
    setTsunamiWaveFront(null);
    setFloodZone(null);
    setTsunamiBannerState({ visible: false, phase: 'warning', eta: 0 });
    setSummaryShown(false);
    lastTimeRef.current = 0;
  };
  
  // Handle scenario change
  const handleScenarioChange = (scenarioId) => {
    setCurrentScenario(scenarioId);
    resetSimulation();
  };
  
  // Handle neighborhood click
  const onNeighborhoodClick = useCallback((feature) => {
    const name = feature.properties.neighborhood;
    console.log(`onNeighborhoodClick called with: ${name}`);
    const riskData = neighborhoodRiskData[name];
    
    if (riskData) {
      setSelectedNeighborhood(riskData);
      setSelectedHome(null);
      
      if (name === 'Marina') {
        setShowMarinaBuildings(true);
        setMapView({ center: [37.803, -122.435], zoom: 15 });
      } else {
        setShowMarinaBuildings(false);
      }
    } else {
      // Show basic info even for neighborhoods without detailed risk data
      setSelectedNeighborhood({
        name: name,
        overallRisk: 50,
        summary: `${name} neighborhood in San Francisco.`,
        risks: { seismic: 50, liquefaction: 30, tsunami: 20, infrastructure: 40, displacement: 45, property: 55 }
      });
      setSelectedHome(null);
      setShowMarinaBuildings(false);
    }
  }, []);
  
  // Handle building click
  const onBuildingClick = (home) => {
    const neighborResult = computeNeighborBoost(home, processedHomes, buildingDamage);
    setSelectedHome({ ...home, neighborResult });
  };
  
  // Render building marker
  const renderBuildingMarker = (home) => {
    const damage = buildingDamage[home.id] || 0;
    // In simulation mode, always show damage colors (green = intact at start)
    // In assessment mode, show risk colors
    const color = mode === 'simulation' 
      ? getDamageColor(damage) 
      : getRiskColor(home.baseRisk);
    
    return (
      <GeoJSON
        key={home.id}
        data={home.geometry}
        style={{
          fillColor: color,
          weight: selectedHome?.id === home.id ? 3 : 1,
          opacity: 1,
          color: selectedHome?.id === home.id ? '#ffffff' : color,
          fillOpacity: 0.8
        }}
        eventHandlers={{
          click: () => onBuildingClick(home)
        }}
      />
    );
  };

  return (
    <div className="App">
      {/* Header */}
      <Navbar bg="dark" variant="dark" className="bg-dark-custom px-3">
        <Navbar.Brand>
          <span className="me-2">🌍</span>
          Quake Risk <span className="text-muted">Assessment</span>
        </Navbar.Brand>
        <Nav className="mx-auto">
          <ButtonGroup className="mode-toggle">
            <Button
              variant={mode === 'assessment' ? 'primary' : 'outline-light'}
              onClick={() => setMode('assessment')}
            >
              📊 Risk Assessment
            </Button>
            <Button
              variant={mode === 'simulation' ? 'danger' : 'outline-light'}
              onClick={() => {
                setMode('simulation');
                // Auto-zoom to Marina with building data for simulation
                setShowMarinaBuildings(true);
                setSelectedNeighborhood(neighborhoodRiskData['Marina']);
                setMapView({ center: [37.803, -122.435], zoom: 15 });
              }}
            >
              🎬 Event Simulation
            </Button>
          </ButtonGroup>
        </Nav>
        <span className="badge bg-warning text-dark">
          <span className="me-1">⚠️</span>
          High Seismic Activity
        </span>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="p-0">
        <Row className="g-0">
          {/* Map Column */}
          <Col md={8} className="map-container">
            <MapContainer
              center={[37.76, -122.44]}
              zoom={12.4}
              style={{ height: '100%', width: '100%' }}
            >
              <MapController center={mapView.center} zoom={mapView.zoom} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {/* Neighborhoods */}
              <NeighborhoodsLayer 
                data={neighborhoods}
                onNeighborhoodClick={onNeighborhoodClick}
                showMarinaBuildings={showMarinaBuildings}
              />
              
              {/* Marina Buildings */}
              {showMarinaBuildings && processedHomes.map(home => renderBuildingMarker(home))}
              
              {/* Shockwaves */}
              {mode === 'simulation' && layerVisibility.shockwave && shockwaves.map(sw => (
                <Circle
                  key={sw.id}
                  center={sw.center}
                  radius={sw.radius}
                  pathOptions={{
                    color: sw.color,
                    fillColor: sw.color,
                    fillOpacity: sw.opacity * 0.15,
                    weight: 2,
                    opacity: sw.opacity
                  }}
                />
              ))}
              
              {/* Epicenters */}
              {mode === 'simulation' && layerVisibility.epicenter && epicenters.map(ep => (
                <Marker key={ep.id} position={ep.position}>
                  <Popup>
                    <strong>💥 {ep.name}</strong><br />
                    Magnitude: {ep.magnitude}
                  </Popup>
                </Marker>
              ))}
              
              {/* Flood Zone */}
              {mode === 'simulation' && floodZone && (
                <Polygon
                  positions={floodZone}
                  pathOptions={{
                    fillColor: '#3b82f6',
                    fillOpacity: 0.25,
                    stroke: false
                  }}
                />
              )}
              
              {/* Tsunami Wave Front - Realistic Curved Wave */}
              {mode === 'simulation' && tsunamiWaveFront && (() => {
                const cfg = TSUNAMI_CONFIG;
                const waveWidth = cfg.eastEdge - cfg.westEdge;
                const numPoints = 30;
                const waveHeight = 0.002; // Wave curve amplitude in degrees
                const foamHeight = 0.0008; // Foam/crest height
                
                // Generate curved wave front points
                const wavePoints = [];
                const foamPoints = [];
                const backPoints = [];
                
                for (let i = 0; i <= numPoints; i++) {
                  const t = i / numPoints;
                  const lng = cfg.westEdge + t * waveWidth;
                  
                  // Create natural wave curve using sine waves
                  const curve = Math.sin(t * Math.PI * 3) * waveHeight * 0.5 +
                               Math.sin(t * Math.PI * 7 + 1.5) * waveHeight * 0.3 +
                               Math.sin(t * Math.PI * 11) * waveHeight * 0.2;
                  
                  const waveLat = tsunamiWaveFront + curve;
                  wavePoints.push([waveLat, lng]);
                  
                  // Foam/crest follows wave with slight offset
                  const foamCurve = curve + foamHeight;
                  foamPoints.push([tsunamiWaveFront + foamCurve, lng]);
                  
                  // Back of wave body (for polygon fill)
                  backPoints.push([tsunamiWaveFront + 0.004, lng]);
                }
                
                return (
                  <>
                    {/* Wave body - deep blue */}
                    <Polygon
                      positions={[...wavePoints, ...backPoints.reverse()]}
                      pathOptions={{
                        fillColor: '#1e40af',
                        fillOpacity: 0.7,
                        stroke: false
                      }}
                    />
                    {/* Wave crest - lighter blue */}
                    <Polygon
                      positions={[
                        ...wavePoints,
                        ...wavePoints.map(([lat, lng]) => [lat + 0.0015, lng]).reverse()
                      ]}
                      pathOptions={{
                        fillColor: '#3b82f6',
                        fillOpacity: 0.8,
                        stroke: false
                      }}
                    />
                    {/* Foam/whitecap */}
                    <Polyline
                      positions={foamPoints}
                      pathOptions={{
                        color: '#ffffff',
                        weight: 4,
                        opacity: 0.95
                      }}
                    />
                    {/* Spray effect - dotted line ahead of wave */}
                    <Polyline
                      positions={foamPoints.map(([lat, lng]) => [lat - 0.0005, lng])}
                      pathOptions={{
                        color: '#93c5fd',
                        weight: 2,
                        opacity: 0.6,
                        dashArray: '4, 8'
                      }}
                    />
                  </>
                );
              })()}
              
              {/* Evacuation Shelters - showing capacity fill over time */}
              {mode === 'simulation' && layerVisibility.evacuation && assemblyPoints.map(ap => {
                // Calculate current occupancy based on simulation time
                const maxTime = scenarios[currentScenario].duration;
                const fillRate = simulationTime / maxTime;
                const currentOccupancy = Math.min(
                  Math.floor(ap.capacity * fillRate * 0.85),
                  ap.capacity
                );
                const fillPercent = (currentOccupancy / ap.capacity) * 100;
                const spotsRemaining = ap.capacity - currentOccupancy;
                
                // Color based on fill level
                const getStatusColor = () => {
                  if (fillPercent < 50) return '#10b981';
                  if (fillPercent < 75) return '#f59e0b';
                  return '#ef4444';
                };
                const statusColor = getStatusColor();
                
                return (
                  <React.Fragment key={ap.id}>
                    {/* Clickable marker with capacity label */}
                    <Marker 
                      position={ap.location}
                      icon={L.divIcon({
                        className: 'shelter-marker',
                        html: `<div style="
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          cursor: pointer;
                        ">
                          <div style="
                            background: ${statusColor};
                            color: white;
                            width: 44px;
                            height: 44px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 22px;
                            border: 3px solid white;
                            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                          ">🏕️</div>
                          <div style="
                            background: ${statusColor};
                            color: white;
                            padding: 2px 8px;
                            border-radius: 10px;
                            font-size: 11px;
                            font-weight: bold;
                            margin-top: 4px;
                            white-space: nowrap;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                          ">${currentOccupancy}/${ap.capacity}</div>
                        </div>`,
                        iconSize: [60, 70],
                        iconAnchor: [30, 35]
                      })}
                    >
                      <Popup>
                        <div style={{ minWidth: '220px' }}>
                          <div style={{ 
                            background: statusColor, 
                            color: 'white', 
                            padding: '12px', 
                            margin: '-13px -20px 12px -20px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '11px', opacity: 0.9 }}>🏕️ EVACUATION SHELTER</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>{ap.name}</div>
                          </div>
                          
                          {/* Capacity section */}
                          <div style={{ 
                            background: '#f3f4f6', 
                            padding: '12px', 
                            borderRadius: '8px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                              <div style={{ fontSize: '28px', fontWeight: 'bold', color: statusColor }}>
                                {currentOccupancy.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                of <strong>{ap.capacity.toLocaleString()}</strong> capacity
                              </div>
                            </div>
                            
                            {/* Progress bar */}
                            <div style={{ 
                              background: '#e5e7eb', 
                              borderRadius: '6px', 
                              height: '14px',
                              overflow: 'hidden'
                            }}>
                              <div style={{ 
                                background: statusColor, 
                                height: '100%', 
                                width: `${fillPercent}%`,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginTop: '6px',
                              fontSize: '11px'
                            }}>
                              <span style={{ color: '#6b7280' }}>{fillPercent.toFixed(0)}% full</span>
                              <span style={{ color: statusColor, fontWeight: 'bold' }}>
                                {spotsRemaining.toLocaleString()} spots left
                              </span>
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div style={{ fontSize: '12px', color: '#374151' }}>
                            <div style={{ marginBottom: '6px' }}>
                              ⛰️ Elevation: <strong>{ap.elevation}</strong>
                            </div>
                            <div>
                              {ap.facilities.map(f => (
                                <span key={f} style={{ 
                                  background: '#dbeafe', 
                                  padding: '3px 8px', 
                                  borderRadius: '4px',
                                  marginRight: '4px',
                                  fontSize: '11px',
                                  display: 'inline-block',
                                  marginBottom: '4px'
                                }}>{f}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}
              
              {/* First Responder Units - move during simulation */}
              {mode === 'simulation' && layerVisibility.responders && firstResponderUnits.map(unit => {
                // Calculate current position based on simulation time
                const path = unit.deploymentPath;
                let currentPos = path[0].location;
                
                // Find current position along deployment path
                for (let i = 0; i < path.length - 1; i++) {
                  if (simulationTime >= path[i].time && simulationTime < path[i + 1].time) {
                    // Interpolate between waypoints
                    const progress = (simulationTime - path[i].time) / (path[i + 1].time - path[i].time);
                    currentPos = [
                      path[i].location[0] + (path[i + 1].location[0] - path[i].location[0]) * progress,
                      path[i].location[1] + (path[i + 1].location[1] - path[i].location[1]) * progress
                    ];
                    break;
                  } else if (simulationTime >= path[path.length - 1].time) {
                    currentPos = path[path.length - 1].location;
                  }
                }
                
                // Unit colors by type
                const getUnitColor = () => {
                  switch (unit.type) {
                    case 'fire': return '#ef4444';        // Red
                    case 'ambulance': return '#3b82f6';   // Blue
                    case 'search_rescue': return '#f97316'; // Orange
                    case 'command': return '#8b5cf6';     // Purple
                    default: return '#6b7280';
                  }
                };
                
                const unitColor = getUnitColor();
                
                return (
                  <Marker
                    key={unit.id}
                    position={currentPos}
                    icon={L.divIcon({
                      className: 'responder-marker',
                      html: `<div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                      ">
                        <div style="
                          background: ${unitColor};
                          width: 32px;
                          height: 32px;
                          border-radius: 50%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 16px;
                          border: 2px solid white;
                          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                        ">${unit.icon}</div>
                      </div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16]
                    })}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <div style={{ 
                          background: unitColor, 
                          color: 'white', 
                          padding: '10px 12px', 
                          margin: '-13px -20px 12px -20px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '18px' }}>{unit.icon}</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>{unit.name}</div>
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ 
                            background: unitColor + '20',
                            color: unitColor,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {unit.status}
                          </span>
                        </div>
                        
                        <div style={{ fontSize: '13px', color: '#374151' }}>
                          <div style={{ marginBottom: '6px' }}>
                            👥 <strong>{unit.personnel}</strong> personnel
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Equipment:</strong>
                            <div style={{ marginTop: '4px' }}>
                              {unit.equipment.map(eq => (
                                <span key={eq} style={{ 
                                  background: '#f3f4f6', 
                                  padding: '2px 8px', 
                                  borderRadius: '4px',
                                  marginRight: '4px',
                                  marginBottom: '4px',
                                  fontSize: '11px',
                                  display: 'inline-block'
                                }}>{eq}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
            
            {/* Map Overlays */}
            {mode === 'simulation' && !showSummary && (
              <>
                <LayerPanel 
                  visibility={layerVisibility} 
                  onToggle={(layer) => setLayerVisibility(prev => ({
                    ...prev,
                    [layer]: !prev[layer]
                  }))}
                />
                <AlertPanel alerts={alerts} onDismiss={(id) => setAlerts(prev => prev.filter(a => a.id !== id))} />
                {tsunamiBannerState.visible && <TsunamiBanner state={tsunamiBannerState} />}
                <TimelineControls
                  scenario={scenarios[currentScenario]}
                  time={simulationTime}
                  isPlaying={isPlaying}
                  speed={playbackSpeed}
                  onPlayPause={() => setIsPlaying(!isPlaying)}
                  onReset={resetSimulation}
                  onSpeedChange={setPlaybackSpeed}
                  onSeek={setSimulationTime}
                />
              </>
            )}
            
            <MapLegend mode={mode} />
          </Col>
          
          {/* Sidebar */}
          <Col md={4} className="sidebar">
            <Sidebar
              mode={mode}
              selectedNeighborhood={selectedNeighborhood}
              selectedHome={selectedHome}
              processedHomes={processedHomes}
              buildingDamage={buildingDamage}
              currentScenario={currentScenario}
              scenarios={scenarios}
              simulationTime={simulationTime}
              onScenarioChange={handleScenarioChange}
              onHomeUpdate={(updatedHome) => {
                const neighborResult = computeNeighborBoost(updatedHome, processedHomes, buildingDamage);
                setSelectedHome({ ...updatedHome, neighborResult });
              }}
              onHomeSelect={(home) => {
                // Enable Marina buildings view, zoom to the home, and select it
                setShowMarinaBuildings(true);
                setSelectedNeighborhood(neighborhoodRiskData['Marina']);
                setMapView({ center: [home.lat, home.lng], zoom: 18 });
                onBuildingClick(home);
              }}
            />
          </Col>
        </Row>
      </Container>
      
      {/* Summary Modal */}
      <SummaryModal
        show={showSummary}
        onHide={() => setShowSummary(false)}
        scenario={scenarios[currentScenario]}
        buildingDamage={buildingDamage}
        tsunamiDamagedBuildings={tsunamiDamagedBuildings}
        processedHomes={processedHomes}
      />
    </div>
  );
}

export default App;
