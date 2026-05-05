# Architecture & Design

Deep-dive into the system architecture, algorithms, performance characteristics, and scaling considerations for the Earthquake Risk Dashboard.

---

## System Architecture

### Technology Stack

| Technology | Alternatives Considered | Rationale |
|---|---|---|
| React 19 | Vue.js, Angular, Svelte | Largest ecosystem, best documentation, optimal for complex state (19 variables) |
| Leaflet 1.9 | Mapbox GL JS, Google Maps, OpenLayers | Open-source, no API keys, excellent GeoJSON support, 39 KB gzipped |
| Bootstrap 5.3 | Material-UI, Tailwind, Ant Design | Rapid prototyping, familiar patterns, good accessibility defaults |
| Client-side only | Django + Leaflet, Node.js backend | Faster iteration, no server costs, static hosting via GitHub Pages |

### Data Flow

```
User Interaction → State Update (React hooks) → Derived Calculations →
Virtual DOM Diff → Leaflet Layer Updates → Browser Render
```

### State Management

React Hooks exclusively (no Redux/MobX):

- `mode`: `'assessment' | 'simulation'` — determines UI and calculation logic
- `selectedNeighborhood` / `selectedHome`: current selection context
- `simulationTime`: current time position in simulation (seconds)
- `buildingDamage`: map of `buildingId → damageLevel` (0–100)
- `tsunamiDamage`: separate tracking for tsunami-induced damage
- `layerVisibility`: boolean flags for map layer toggles

Performance hooks: `useCallback` for stable event handlers, `useRef` for animation frame IDs and time tracking.

### Component Hierarchy

```
App (main orchestrator)
├── Navbar (mode toggle, branding)
├── MapContainer
│   ├── TileLayer (CartoDB dark basemap)
│   ├── NeighborhoodsLayer (custom Leaflet wrapper)
│   ├── Building Polygons (GeoJSON components)
│   ├── Shockwave Circles (earthquake propagation)
│   ├── Tsunami Wave + Flood Zone
│   ├── Evacuation Shelters (dynamic capacity)
│   └── First Responder Units (animated movement)
├── Sidebar
│   ├── Assessment Panel (search, risk profile, what-if)
│   └── Simulation Panel (scenario selector, damage stats)
├── TimelineControls (play/pause, scrubber, speed)
├── LayerPanel (toggle visibility)
├── AlertPanel (emergency notifications)
├── TsunamiBanner (countdown/status)
└── SummaryModal (post-disaster report)
```

### Data Architecture

**GeoJSON Files (loaded at runtime):**
- `SanFrancisco.Neighborhoods.json` — 12 neighborhood boundaries (~2.5 MB)
- `Marina_Buildings.geojson` — 782 building footprints (~850 KB)

**Static Data Modules:**
- `neighborhoods.js` — risk profiles, scoring criteria, explanatory text
- `scenarios.js` — event definitions, alerts, emergency assets (assembly points, first responders)
- `riskCalculations.js` — risk scoring algorithms, damage models

---

## Risk Assessment Algorithms

### Building Risk Score

```javascript
baseRisk = min(100, max(0,
  ageFactor +           // 0-25 points
  materialFactor +      // 0-20 points
  floorFactor +         // 0-15 points
  retrofitBonus +       // -15 to 0 points
  softStoryPenalty +    // 0-15 points
  liquefactionFactor    // 0-20 points (from neighborhood)
))
```

**Factor breakdown:**

| Factor | Range | Key thresholds |
|---|---|---|
| Age | 0–25 | Pre-1940: 25 pts, 1940–69: 20, 1970–89: 12, 1990–99: 6, 2000+: 2 |
| Material | 0–20 | Brick: 20, Wood: 14, Mixed: 10, Concrete: 5 |
| Soft Story | 0–15 | +15 for open ground floors (4x collapse rate in 1989) |
| Retrofit | -15–0 | -15 if seismically retrofitted |
| Liquefaction | 0–20 | Scaled from neighborhood liquefaction score (Marina: 95/100) |

### Neighbor Context Analysis

```javascript
neighbors = filter(buildings, distance <= 150m)
boost = f(avgRisk, highRiskCount, vulnerableCount)    // max +20
finalRisk = min(100, baseRisk + boost)
```

Neighboring building collapses cause cascading failures, debris impact, fire spread, and blocked evacuation routes. The boost accounts for avg neighbor risk (>80: +8), high-risk count (5+: +8), and vulnerable neighbors (4+: +6).

### Recommendation Engine

Decision tree adapts to building characteristics, neighborhood hazards, social context, and financial feasibility:

```
IF not retrofitted AND yearBuilt < 1980 → Seismic Retrofit (-15 risk points)
IF softStory                            → Soft Story Reinforcement
IF neighborhood.liquefaction > 70       → Liquefaction preparedness kit
IF neighborhood.tsunami > 50            → Evacuation route planning
IF vulnerableNeighbors > 2              → Community emergency planning
ALWAYS                                  → 72-hour emergency kit
```

---

## Disaster Simulation Engine

### Animation System

```javascript
requestAnimationFrame(timestamp) →
  calculateDelta(timestamp) →
  updateSimulationTime(time + delta * speed) →
  processEvents(scenario, time) →
  updateVisualization() →
  requestAnimationFrame(next)
```

Target: 60 FPS. Actual: 35–45 FPS with 782 visible building polygons. Bottleneck is React re-renders for each `<GeoJSON>` component per frame.

### Earthquake Damage Model

**Shockwave propagation:**
```javascript
maxRadius = magnitude * 15000   // meters
currentRadius = (elapsed / 60) * maxRadius
```

**Per-building damage:**
```javascript
damage = baseDamage * magnitudeEffect * distanceDecay
       * materialMult * ageMult * retrofitMult
       * softStoryMult * liquefactionMult * rampFactor
```

Multipliers: Brick x1.5, Wood x1.2, Concrete x0.8 | Pre-1940 x1.6 | Retrofit x0.6 | Soft Story x1.4 | Liquefaction x1.3 | Ramp 0→1 over 5s.

Validation: model produces ~15% severe damage in Marina for M6.9 at 100km, vs. ~18% observed in 1989 Loma Prieta.

### Tsunami Modeling

Four-phase animation with distinct easing functions:

| Phase | Duration | Easing | Description |
|---|---|---|---|
| Approach | 0–810s | Linear | Wave moves from 1.2 km offshore to coastline |
| Inundation | 810–1110s | Ease-out quadratic `t(2-t)` | Wave advances inland, decelerating |
| Peak | 1110–1170s | Static | Maximum flooding at 1.3 km penetration |
| Recession | 1170–1350s | Ease-in cubic `t³` | Water recedes (gravity-driven, faster than advance) |

Tsunami damage: `baseDamage = 40 + (1 - depthRatio) * 45`, modified by age/material/retrofit factors. Buildings closer to the coast take more damage. Damage persists after water recedes.

### Emergency Response Layer

**Evacuation Shelters (3):** Dynamic capacity fill rate, color-coded by occupancy (green <50%, yellow 50–75%, red >75%). Clickable popups with elevation, facilities, and real-time occupancy.

**First Responder Units (7):** Fire engines, ambulances, search & rescue, command. Movement via linear interpolation between timed waypoints, converging on damage hotspots.

**Alert System:** 4 severity levels (critical/warning/advisory/info) with auto-dismiss timers, tsunami countdown banner, and post-simulation summary modal.

---

## Performance Analysis

### Benchmarks

| Operation | Time/FPS |
|---|---|
| Initial load (incl. GeoJSON parse) | 2.3s |
| Neighborhood click (flyTo + re-render) | 45ms |
| Building click | 12ms |
| Simulation FPS (no buildings visible) | 60 |
| Simulation FPS (782 buildings) | 35–45 |
| Single building risk calculation | 0.08ms |
| Batch tsunami damage (782 buildings) | 4.2ms |

**Memory:** 85 MB initial → 145 MB with buildings → 180 MB during simulation → 195 MB after 10 min (minor leak from alert accumulation).

### Bottlenecks & Mitigations

1. **782 `<GeoJSON>` React components** — each recalculates style per frame. Mitigated with batched damage calculations. Production fix: Canvas/WebGL rendering.

2. **React-Leaflet `onEachFeature` bug** — broken for `GeometryCollection` types. Solved by dropping to native `L.geoJSON` with manual event binding.

3. **State update cascades** — `simulationTime` update triggers `buildingDamage` recalc triggers 782 re-renders. Partially mitigated with `useCallback`. Better: `React.memo`, `useMemo`, or `useReducer`.

### Optimization Roadmap

1. **Viewport virtualization** — only render buildings currently visible
2. **Level of Detail** — zoom <14: circles, zoom >=14: polygons
3. **Web Workers** — offload risk calculations to background thread
4. **Canvas rendering** — replace SVG polygons (10–50x faster)
5. **TopoJSON** — reduce file sizes by ~60% via shared boundaries
6. **IndexedDB** — cache GeoJSON locally to avoid re-fetch

---

## Scaling to Production

### Backend Architecture

```
Frontend (React) <-> API Gateway (Node.js/Express) <-> Microservices
                                                    |- Risk Service (Python/Flask)
                                                    |- Simulation Service (Python/FastAPI)
                                                    |- Map Service (Node.js/tile-server)
                                                    '- User Service (Node.js/Auth0)
                                                    |
                                                    PostGIS Database
```

- **Risk Service:** Pre-computed scores (nightly batch), Redis cache (24h TTL), p99 < 50ms
- **Simulation Service:** Queue-based (Celery + RabbitMQ), 30–60s for city-wide sim
- **Map Service:** Vector tiles (.pbf) via Mapbox GL JS, CDN-cached

### Data Pipeline

```
Raw Sources -> ETL (Airflow) -> Data Warehouse -> Feature Engineering (dbt) -> PostGIS -> API
```

Sources: SF Assessor parcel data (weekly), USGS seismic hazard (quarterly), building permits (daily).

### Real-Time Integration

- **USGS ShakeAlert** — WebSocket feed, display alert within 3s of M5+ detection
- **Crowdsourced damage reports** — user-submitted photos, moderated, overlaid as "observed damage" layer

### Geographic Scale

| Scale | Buildings | Approach |
|---|---|---|
| Current (Marina) | 782 | Client-side GeoJSON, React components |
| City-wide (SF) | ~150k | Tiled vector layers, backend pre-computation |
| Bay Area | ~3M | PostGIS spatial queries, clustering, CDN tiles |

---

## Known Limitations

**Data:** Synthetic building attributes (procedurally generated). Production needs SF Assessor parcel data, USGS NSHM, CGS liquefaction zones, NOAA MOST tsunami models.

**Algorithms:** Linearly additive risk model (real risk is non-linear). No soil-structure interaction, resonance effects, cumulative aftershock damage, or fire-following modeling.

**Rendering:** 782 polygons at 35–45 FPS. City-wide (150k) would need WebGL + tiled vector layers.

**UX:** No mobile layout, no user accounts, no side-by-side comparison, no PDF export, no multilingual support.
