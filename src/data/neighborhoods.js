// Neighborhood risk data for San Francisco
export const marinaRisk = {
  name: "Marina",
  risks: { 
    seismic: 78, 
    liquefaction: 95, 
    tsunami: 72, 
    infrastructure: 58, 
    displacement: 52, 
    property: 88 
  },
  overallRisk: 74,
  summary: "Built on 1906 earthquake rubble fill. Severe liquefaction damage occurred during 1989 Loma Prieta earthquake."
};

export const neighborhoodRiskData = {
  "Marina": marinaRisk,
  "Rincon Hill": { 
    name: "Rincon Hill", 
    risks: { seismic: 65, liquefaction: 70, tsunami: 50, infrastructure: 55, displacement: 40, property: 75 }, 
    overallRisk: 59, 
    summary: "High-rise residential area on filled land near the bay. Modern construction but high liquefaction potential." 
  },
  "South Beach": { 
    name: "South Beach", 
    risks: { seismic: 68, liquefaction: 78, tsunami: 65, infrastructure: 50, displacement: 42, property: 78 }, 
    overallRisk: 64, 
    summary: "Waterfront development on filled land. High liquefaction and tsunami exposure due to proximity to bay." 
  },
  "Chinatown": { 
    name: "Chinatown", 
    risks: { seismic: 70, liquefaction: 32, tsunami: 15, infrastructure: 78, displacement: 85, property: 72 }, 
    overallRisk: 59, 
    summary: "Historic dense neighborhood with many older buildings. High displacement vulnerability." 
  },
  "Nob Hill": { 
    name: "Nob Hill", 
    risks: { seismic: 38, liquefaction: 15, tsunami: 10, infrastructure: 42, displacement: 32, property: 65 }, 
    overallRisk: 34, 
    summary: "Hilltop on solid rock. Historic buildings generally well-maintained." 
  },
  "Ingleside": { 
    name: "Ingleside", 
    risks: { seismic: 40, liquefaction: 28, tsunami: 8, infrastructure: 45, displacement: 50, property: 42 }, 
    overallRisk: 36, 
    summary: "Residential neighborhood with moderate risk. Generally stable ground conditions." 
  },
  "Castro": { 
    name: "Castro", 
    risks: { seismic: 45, liquefaction: 22, tsunami: 8, infrastructure: 48, displacement: 42, property: 55 }, 
    overallRisk: 37, 
    summary: "Hillside neighborhood with good bedrock. Well-maintained Victorians." 
  },
  "Treasure Island": { 
    name: "Treasure Island", 
    risks: { seismic: 82, liquefaction: 98, tsunami: 88, infrastructure: 75, displacement: 70, property: 85 }, 
    overallRisk: 83, 
    summary: "Artificial island with extreme liquefaction risk. Limited evacuation routes." 
  },
  "Mission Bay": { 
    name: "Mission Bay", 
    risks: { seismic: 65, liquefaction: 75, tsunami: 55, infrastructure: 35, displacement: 38, property: 70 }, 
    overallRisk: 56, 
    summary: "Modern development on filled land. New construction codes but high liquefaction potential." 
  },
  "Financial District": { 
    name: "Financial District", 
    risks: { seismic: 62, liquefaction: 65, tsunami: 35, infrastructure: 55, displacement: 30, property: 90 }, 
    overallRisk: 56, 
    summary: "Dense commercial area with mix of old and new high-rises. Some buildings on filled land." 
  },
  "Pacific Heights": { 
    name: "Pacific Heights", 
    risks: { seismic: 35, liquefaction: 12, tsunami: 15, infrastructure: 38, displacement: 25, property: 55 }, 
    overallRisk: 30, 
    summary: "Affluent hillside neighborhood with solid bedrock foundation." 
  },
  "Sunset": { 
    name: "Sunset", 
    risks: { seismic: 48, liquefaction: 35, tsunami: 25, infrastructure: 45, displacement: 55, property: 48 }, 
    overallRisk: 43, 
    summary: "Large residential area with varied soil conditions. Some soft-story buildings." 
  },
  "Richmond": { 
    name: "Richmond", 
    risks: { seismic: 45, liquefaction: 32, tsunami: 22, infrastructure: 42, displacement: 52, property: 45 }, 
    overallRisk: 40, 
    summary: "Residential neighborhood with moderate seismic risk. Near Golden Gate Park." 
  }
};

// Get risk level from score
export const getRiskLevel = (score) => {
  if (score >= 75) return { level: 'extreme', color: '#ef4444', label: 'Extreme' };
  if (score >= 55) return { level: 'high', color: '#f97316', label: 'High' };
  if (score >= 35) return { level: 'medium', color: '#f59e0b', label: 'Medium' };
  return { level: 'low', color: '#10b981', label: 'Low' };
};

// Get color for choropleth based on risk
export const getRiskColor = (score) => {
  if (score >= 75) return '#ef4444';
  if (score >= 55) return '#f97316';
  if (score >= 35) return '#f59e0b';
  return '#10b981';
};

export default neighborhoodRiskData;

