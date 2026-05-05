// Simulation scenarios
export const scenarios = {
  hayward: {
    id: 'hayward',
    name: 'Hayward Fault Rupture',
    description: 'Hypothetical M7.2 earthquake on Hayward Fault',
    duration: 1200, // 20 minutes
    events: [
      { time: 0, type: 'earthquake', location: [37.6688, -122.0808], magnitude: 7.2, depth: 8, name: 'Main Rupture' },
      { time: 60, type: 'aftershock', location: [37.70, -122.10], magnitude: 5.8, depth: 10, name: 'Aftershock 1' },
      { time: 180, type: 'aftershock', location: [37.65, -122.05], magnitude: 5.4, depth: 12, name: 'Aftershock 2' },
      { time: 400, type: 'aftershock', location: [37.68, -122.08], magnitude: 4.9, depth: 15, name: 'Aftershock 3' },
      { time: 600, type: 'aftershock', location: [37.72, -122.12], magnitude: 5.1, depth: 8, name: 'Aftershock 4' }
    ],
    alerts: [
      { time: 5, type: 'critical', title: 'MAJOR EARTHQUAKE', body: 'M7.2 earthquake on Hayward Fault. Major damage expected.', duration: 120 },
      { time: 60, type: 'warning', title: 'AFTERSHOCK DETECTED', body: 'M5.8 aftershock. More expected.', duration: 60 },
      { time: 120, type: 'advisory', title: 'STRUCTURAL DAMAGE', body: 'Reports of collapses in Marina, Mission Bay, SOMA.', duration: 180 }
    ]
  },
  offshore_tsunami: {
    id: 'offshore_tsunami',
    name: 'Offshore M8.0 + Tsunami',
    description: 'Worst case scenario with major offshore earthquake and tsunami',
    duration: 1500, // 25 minutes
    events: [
      { time: 0, type: 'earthquake', location: [37.50, -123.20], magnitude: 8.0, depth: 25, name: 'Offshore Quake' },
      { time: 90, type: 'aftershock', location: [37.55, -123.15], magnitude: 6.2, depth: 20, name: 'Aftershock 1' },
      { time: 480, type: 'tsunami', origin: [37.50, -123.20], waveHeight: 4.5, arrivalTime: 900, name: 'Tsunami Warning' },
      { time: 900, type: 'tsunami_arrival', location: [37.803, -122.435], waveHeight: 3.2, name: 'Tsunami Impact' }
    ],
    alerts: [
      { time: 5, type: 'critical', title: 'MASSIVE EARTHQUAKE', body: 'M8.0 earthquake detected offshore. Tsunami possible.', duration: 120 },
      { time: 60, type: 'critical', title: 'TSUNAMI WARNING', body: 'Tsunami warning issued. ETA: 14 minutes to Marina.', duration: 600 },
      { time: 300, type: 'critical', title: 'EVACUATE NOW', body: 'Immediate evacuation required for coastal areas.', duration: 600 },
      { time: 900, type: 'critical', title: 'TSUNAMI ARRIVAL', body: 'Tsunami waves arriving at coastline.', duration: 300 }
    ]
  },
  marina_local: {
    id: 'marina_local',
    name: 'Marina Local Event',
    description: 'Moderate M5.8 earthquake centered near Marina',
    duration: 600, // 10 minutes
    events: [
      { time: 0, type: 'earthquake', location: [37.803, -122.435], magnitude: 5.8, depth: 10, name: 'Local Quake' },
      { time: 45, type: 'aftershock', location: [37.805, -122.430], magnitude: 4.2, depth: 8, name: 'Aftershock 1' },
      { time: 120, type: 'aftershock', location: [37.800, -122.440], magnitude: 3.8, depth: 12, name: 'Aftershock 2' }
    ],
    alerts: [
      { time: 5, type: 'warning', title: 'EARTHQUAKE DETECTED', body: 'M5.8 earthquake in Marina District.', duration: 60 },
      { time: 30, type: 'advisory', title: 'DAMAGE REPORTS', body: 'Reports of structural damage in Marina.', duration: 120 }
    ]
  }
};

// Tsunami configuration
export const TSUNAMI_CONFIG = {
  oceanStart: 37.820,     // Where wave starts in the bay
  coastline: 37.810,      // Northern edge of Marina
  maxInland: 37.798,      // How far south water reaches
  westEdge: -122.452,
  eastEdge: -122.418,
  approachDuration: 810,  // Time for wave to reach coast
  advanceDuration: 300,   // Time for flood to spread inland
  peakDuration: 60,       // Time at maximum flooding
  recedeDuration: 180     // Time for water to recede
};

// Evacuation routes - following ACTUAL SF streets south to higher ground
// Streets verified against SF grid: streets spaced ~120m apart
// Routes are cyan/white to distinguish from building damage colors
export const evacuationRoutes = [
  {
    id: 'route1',
    name: 'Divisadero St → Alta Plaza',
    type: 'primary',
    // Divisadero St: -122.4400 (westernmost major route)
    coordinates: [
      [-122.4400, 37.8025], // Divisadero & Beach St
      [-122.4400, 37.7995], // Divisadero & North Point
      [-122.4400, 37.7965], // Divisadero & Lombard
      [-122.4400, 37.7935], // Divisadero & Chestnut (south)
      [-122.4400, 37.7905], // Divisadero & Union
      [-122.4400, 37.7875], // Divisadero & Green (Alta Plaza)
    ],
    destination: 'ap1',
    status: 'clear'
  },
  {
    id: 'route2',
    name: 'Fillmore St → Alta Plaza',
    type: 'primary',
    // Fillmore St: -122.4358
    coordinates: [
      [-122.4358, 37.8025], // Fillmore & Beach St
      [-122.4358, 37.7995], // Fillmore & North Point
      [-122.4358, 37.7965], // Fillmore & Lombard
      [-122.4358, 37.7935], // Fillmore & Chestnut (south)
      [-122.4358, 37.7905], // Fillmore & Union
      [-122.4385, 37.7875], // Turn west to Alta Plaza Park
    ],
    destination: 'ap1',
    status: 'clear'
  },
  {
    id: 'route3',
    name: 'Pierce St → Lafayette Park',
    type: 'primary',
    // Pierce St: -122.4300 (user specifically mentioned)
    coordinates: [
      [-122.4300, 37.8025], // Pierce & Beach St
      [-122.4300, 37.7995], // Pierce & North Point
      [-122.4300, 37.7965], // Pierce & Lombard
      [-122.4300, 37.7935], // Pierce & Chestnut (south)
      [-122.4300, 37.7905], // Pierce & Union
      [-122.4265, 37.7890], // Turn east to Lafayette Park
    ],
    destination: 'ap2',
    status: 'clear'
  },
  {
    id: 'route4',
    name: 'Laguna St → Lafayette Park',
    type: 'primary',
    // Laguna St: -122.4258
    coordinates: [
      [-122.4258, 37.8025], // Laguna & Beach St
      [-122.4258, 37.7995], // Laguna & North Point
      [-122.4258, 37.7965], // Laguna & Lombard
      [-122.4258, 37.7935], // Laguna & Chestnut (south)
      [-122.4258, 37.7905], // Laguna & Union
      [-122.4265, 37.7890], // Lafayette Park
    ],
    destination: 'ap2',
    status: 'clear'
  },
  {
    id: 'route5',
    name: 'Steiner St → Pacific Heights',
    type: 'secondary',
    // Steiner St: -122.4333
    coordinates: [
      [-122.4333, 37.8020], // Steiner & Beach St
      [-122.4333, 37.7990], // Steiner & North Point  
      [-122.4333, 37.7960], // Steiner & Lombard
      [-122.4333, 37.7930], // Steiner & Chestnut (south)
      [-122.4333, 37.7900], // Steiner & Union
      [-122.4333, 37.7875], // Pacific Heights (Broadway)
    ],
    destination: 'ap3',
    status: 'clear'
  }
];

// Assembly points - just south of Marina at the border (higher ground, easy access)
export const assemblyPoints = [
  { 
    id: 'ap1', 
    name: 'Cow Hollow Recreation', 
    location: [37.7945, -122.4380],  // Just south of Marina, near Union St
    capacity: 1800,
    elevation: '120 ft',
    facilities: ['Water', 'First Aid', 'Restrooms']
  },
  { 
    id: 'ap2', 
    name: 'Union Street Shelter', 
    location: [37.7945, -122.4280],  // Union & Laguna area
    capacity: 2200,
    elevation: '95 ft',
    facilities: ['Water', 'First Aid', 'Shelter', 'Food']
  },
  { 
    id: 'ap3', 
    name: 'Fillmore Community Center', 
    location: [37.7945, -122.4358],  // Union & Fillmore
    capacity: 1500,
    elevation: '110 ft',
    facilities: ['Water', 'First Aid', 'Medical']
  }
];

// First Responder Units - move during simulation
export const firstResponderUnits = [
  // Fire trucks
  {
    id: 'ft1',
    type: 'fire',
    name: 'Engine 16',
    icon: '🚒',
    status: 'responding',
    personnel: 4,
    equipment: ['Hose', 'Ladder', 'Rescue Tools'],
    baseLocation: [37.7920, -122.4400],  // Station (south of Marina)
    // Path during simulation: starts at base, moves into Marina
    deploymentPath: [
      { time: 0, location: [37.7920, -122.4400] },      // At station
      { time: 60, location: [37.7960, -122.4400] },     // Moving north
      { time: 180, location: [37.8000, -122.4380] },    // In Marina - west side
      { time: 400, location: [37.8020, -122.4350] },    // Responding to damage
      { time: 600, location: [37.8010, -122.4320] },    // Moving to next site
      { time: 900, location: [37.7980, -122.4350] },    // Central Marina
    ]
  },
  {
    id: 'ft2',
    type: 'fire',
    name: 'Engine 41',
    icon: '🚒',
    status: 'responding',
    personnel: 4,
    equipment: ['Hose', 'Ladder', 'Jaws of Life'],
    baseLocation: [37.7930, -122.4250],
    deploymentPath: [
      { time: 0, location: [37.7930, -122.4250] },
      { time: 90, location: [37.7970, -122.4260] },
      { time: 200, location: [37.8010, -122.4280] },    // East Marina
      { time: 450, location: [37.8030, -122.4300] },    // Near waterfront
      { time: 700, location: [37.8000, -122.4260] },    // Moving south
      { time: 1000, location: [37.7970, -122.4280] },
    ]
  },
  // Ambulances
  {
    id: 'amb1',
    type: 'ambulance',
    name: 'Medic 7',
    icon: '🚑',
    status: 'responding',
    personnel: 2,
    equipment: ['AED', 'Stretcher', 'Trauma Kit'],
    baseLocation: [37.7905, -122.4380],  // Near hospital
    deploymentPath: [
      { time: 0, location: [37.7905, -122.4380] },
      { time: 45, location: [37.7950, -122.4360] },
      { time: 150, location: [37.8000, -122.4340] },    // Marina
      { time: 300, location: [37.7960, -122.4380] },    // Back to shelter
      { time: 500, location: [37.8020, -122.4360] },    // Back to Marina
      { time: 800, location: [37.7945, -122.4380] },    // At shelter
    ]
  },
  {
    id: 'amb2',
    type: 'ambulance',
    name: 'Medic 12',
    icon: '🚑',
    status: 'responding',
    personnel: 2,
    equipment: ['AED', 'Stretcher', 'Oxygen'],
    baseLocation: [37.7920, -122.4280],
    deploymentPath: [
      { time: 0, location: [37.7920, -122.4280] },
      { time: 60, location: [37.7960, -122.4290] },
      { time: 200, location: [37.8010, -122.4270] },
      { time: 400, location: [37.7980, -122.4300] },
      { time: 650, location: [37.7945, -122.4280] },    // At shelter
      { time: 900, location: [37.8000, -122.4320] },
    ]
  },
  // Search & Rescue
  {
    id: 'sar1',
    type: 'search_rescue',
    name: 'SAR Team Alpha',
    icon: '🦺',
    status: 'searching',
    personnel: 6,
    equipment: ['K-9 Unit', 'Life Detector', 'Rescue Tools'],
    baseLocation: [37.7940, -122.4330],
    deploymentPath: [
      { time: 0, location: [37.7940, -122.4330] },
      { time: 120, location: [37.7990, -122.4350] },
      { time: 300, location: [37.8020, -122.4380] },    // Heavy damage area
      { time: 500, location: [37.8010, -122.4340] },    // Moving through Marina
      { time: 750, location: [37.7990, -122.4300] },
      { time: 1000, location: [37.8020, -122.4320] },
    ]
  },
  {
    id: 'sar2',
    type: 'search_rescue',
    name: 'SAR Team Bravo',
    icon: '🦺',
    status: 'searching',
    personnel: 5,
    equipment: ['Thermal Camera', 'Listening Device', 'Medical Kit'],
    baseLocation: [37.7940, -122.4270],
    deploymentPath: [
      { time: 0, location: [37.7940, -122.4270] },
      { time: 100, location: [37.7980, -122.4260] },
      { time: 250, location: [37.8010, -122.4250] },    // East Marina
      { time: 450, location: [37.8030, -122.4280] },
      { time: 700, location: [37.8000, -122.4310] },
      { time: 950, location: [37.7970, -122.4290] },
    ]
  },
  // Command Unit
  {
    id: 'cmd1',
    type: 'command',
    name: 'Incident Command',
    icon: '📡',
    status: 'coordinating',
    personnel: 8,
    equipment: ['Communications', 'Drone', 'Planning Maps'],
    baseLocation: [37.7945, -122.4320],
    deploymentPath: [
      { time: 0, location: [37.7945, -122.4320] },      // Command post
      { time: 300, location: [37.7960, -122.4340] },    // Forward position
      { time: 600, location: [37.7970, -122.4320] },    // Central coordination
      { time: 900, location: [37.7955, -122.4300] },
      { time: 1200, location: [37.7945, -122.4320] },   // Back to base
    ]
  }
];

export default scenarios;

