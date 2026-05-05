// Risk calculation utilities

// Calculate distance between two points (returns meters)
export const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + 
            Math.cos(lat1 * Math.PI / 180) * 
            Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Compute base home risk score
export const computeBaseHomeRisk = (home, neighborhoodRisk) => {
  const nr = neighborhoodRisk;
  
  // Building age factor (0-25 points)
  let ageFactor = 0;
  if (home.yearBuilt < 1940) ageFactor = 25;
  else if (home.yearBuilt < 1970) ageFactor = 20;
  else if (home.yearBuilt < 1990) ageFactor = 12;
  else if (home.yearBuilt < 2000) ageFactor = 6;
  else ageFactor = 2;
  
  // Material factor (0-20 points)
  let materialFactor = 0;
  if (home.material === 'brick') materialFactor = 20;
  else if (home.material === 'wood') materialFactor = 14;
  else if (home.material === 'mixed') materialFactor = 10;
  else if (home.material === 'concrete') materialFactor = 5;
  else materialFactor = 8;
  
  // Floor factor (0-15 points)
  let floorFactor = 0;
  if (home.floors >= 4) floorFactor = 15;
  else if (home.floors === 3) floorFactor = 10;
  else if (home.floors === 2) floorFactor = 5;
  else floorFactor = 3;
  
  // Retrofit bonus (-15 to 0 points)
  const retrofitBonus = home.retrofitted ? -15 : 0;
  
  // Soft story penalty (0-15 points)
  const softStoryPenalty = home.softStory ? 15 : 0;
  
  // Neighborhood liquefaction influence (0-20 points)
  const liquefactionFactor = (nr.risks.liquefaction / 100) * 20;
  
  // Calculate base risk
  const baseRisk = Math.min(100, Math.max(0,
    ageFactor + 
    materialFactor + 
    floorFactor + 
    retrofitBonus + 
    softStoryPenalty + 
    liquefactionFactor
  ));
  
  return {
    baseRisk: Math.round(baseRisk),
    factors: {
      age: ageFactor,
      material: materialFactor,
      floors: floorFactor,
      retrofit: retrofitBonus,
      softStory: softStoryPenalty,
      liquefaction: Math.round(liquefactionFactor)
    }
  };
};

// Compute neighbor boost
export const computeNeighborBoost = (home, allHomes, buildingDamage = {}) => {
  const neighbors = allHomes.filter(h => 
    h.id !== home.id && 
    getDistance(home.lat, home.lng, h.lat, h.lng) <= 150
  );
  
  if (neighbors.length === 0) {
    return { boost: 0, neighbors: [], stats: null };
  }
  
  // Calculate risk stats for neighbors
  const neighborRisks = neighbors.map(n => buildingDamage[n.id] || n.baseRisk || 50);
  const avgRisk = neighborRisks.reduce((a, b) => a + b, 0) / neighborRisks.length;
  const highRiskCount = neighborRisks.filter(r => r >= 70).length;
  const vulnerableCount = neighbors.filter(n => 
    !n.retrofitted && (n.yearBuilt < 1970 || n.material === 'brick')
  ).length;
  
  // Calculate boost based on neighbor conditions
  let boost = 0;
  
  // Average risk contribution (0-8)
  if (avgRisk > 80) boost += 8;
  else if (avgRisk > 60) boost += 5;
  else if (avgRisk > 40) boost += 2;
  
  // High-risk neighbor contribution (0-8)
  if (highRiskCount >= 5) boost += 8;
  else if (highRiskCount >= 3) boost += 5;
  else if (highRiskCount >= 1) boost += 2;
  
  // Vulnerable building contribution (0-6)
  if (vulnerableCount >= 4) boost += 6;
  else if (vulnerableCount >= 2) boost += 3;
  else if (vulnerableCount >= 1) boost += 1;
  
  return {
    boost: Math.min(20, boost), // Cap at 20
    neighbors: neighbors.slice(0, 5),
    stats: {
      total: neighbors.length,
      avgRisk: Math.round(avgRisk),
      highRiskCount,
      vulnerableCount
    }
  };
};

// Generate recommendations based on risk factors
export const generateRecommendations = (home, neighborhoodRisk, neighborResult, finalRisk) => {
  const recommendations = [];
  const nr = neighborhoodRisk;
  
  // Priority actions based on risk factors
  if (!home.retrofitted && home.yearBuilt < 1980) {
    recommendations.push({
      icon: '🔧',
      title: 'Seismic Retrofit',
      desc: 'Your building was constructed before modern seismic codes. A retrofit could reduce your risk score by up to 15 points.',
      priority: 'high',
      category: 'structural'
    });
  }
  
  if (home.softStory) {
    recommendations.push({
      icon: '🏗️',
      title: 'Soft Story Reinforcement',
      desc: 'Buildings with soft stories (like parking on ground floor) are vulnerable to collapse. Consider reinforcement.',
      priority: 'high',
      category: 'structural'
    });
  }
  
  if (nr.risks.liquefaction > 70) {
    recommendations.push({
      icon: '🌊',
      title: 'Liquefaction Preparedness',
      desc: 'Your area has high liquefaction risk. Secure heavy furniture and have an evacuation plan.',
      priority: 'medium',
      category: 'preparedness'
    });
  }
  
  if (nr.risks.tsunami > 50) {
    recommendations.push({
      icon: '🏃',
      title: 'Know Evacuation Routes',
      desc: 'You are in a potential tsunami zone. Learn routes to higher ground.',
      priority: 'medium',
      category: 'evacuation'
    });
  }
  
  if (neighborResult.stats && neighborResult.stats.vulnerableCount > 2) {
    recommendations.push({
      icon: '👥',
      title: 'Community Preparedness',
      desc: 'Several nearby buildings are vulnerable. Consider organizing neighborhood emergency planning.',
      priority: 'medium',
      category: 'community'
    });
  }
  
  // Always include basic preparedness
  recommendations.push({
    icon: '📦',
    title: 'Emergency Kit',
    desc: 'Maintain a 72-hour emergency kit with water, food, flashlight, and first aid supplies.',
    priority: 'low',
    category: 'preparedness'
  });
  
  return recommendations;
};

// Calculate earthquake damage based on event and time
export const calculateEventDamage = (home, event, currentTime, neighborhoodRisk) => {
  if (currentTime < event.time) return 0;
  
  const elapsed = currentTime - event.time;
  const distanceMeters = getDistance(home.lat, home.lng, event.location[0], event.location[1]);
  const distanceKm = distanceMeters / 1000;
  
  // Shockwave radius calculation
  const shockwaveDuration = 60;
  const maxRadius = event.magnitude * 15000;
  const currentShockwaveRadius = (Math.min(elapsed, shockwaveDuration) / shockwaveDuration) * maxRadius;
  
  // Only apply damage if shockwave has reached building
  if (distanceMeters > currentShockwaveRadius) {
    return 0;
  }
  
  // Damage ramp factor
  const timeToReachBuilding = (distanceMeters / maxRadius) * shockwaveDuration;
  const timeSinceShockwavePassed = elapsed - timeToReachBuilding;
  const damageRampFactor = Math.min(1, timeSinceShockwavePassed / 5);
  
  // Base damage calculation
  const magnitudeEffect = Math.pow(10, (event.magnitude - 5) * 0.5);
  const distanceEffect = 1 / Math.pow(1 + distanceKm / 10, 2);
  let baseDamage = magnitudeEffect * distanceEffect * 30;
  
  // Building vulnerability factors
  const vulnerability = (home.baseRisk || 50) / 100;
  
  // Material factor
  let materialMultiplier = 1;
  if (home.material === 'brick') materialMultiplier = 1.5;
  else if (home.material === 'wood') materialMultiplier = 1.2;
  else if (home.material === 'concrete') materialMultiplier = 0.8;
  
  // Age factor
  let ageMultiplier = 1;
  if (home.yearBuilt < 1940) ageMultiplier = 1.6;
  else if (home.yearBuilt < 1980) ageMultiplier = 1.3;
  else if (home.yearBuilt >= 2000) ageMultiplier = 0.7;
  
  // Retrofit bonus
  const retrofitMultiplier = home.retrofitted ? 0.6 : 1;
  
  // Soft story penalty
  const softStoryMultiplier = home.softStory ? 1.4 : 1;
  
  // Liquefaction zone
  const liquefactionMultiplier = 1.3;
  
  // Calculate final damage
  const damage = baseDamage * vulnerability * materialMultiplier * ageMultiplier * 
                 retrofitMultiplier * softStoryMultiplier * liquefactionMultiplier * damageRampFactor;
  
  return Math.max(0, damage);
};

// Get damage color based on damage level
export const getDamageColor = (damage) => {
  if (damage < 10) return '#10b981'; // Intact - green
  if (damage < 30) return '#f59e0b'; // Minor - yellow
  if (damage < 60) return '#f97316'; // Moderate - orange
  if (damage < 90) return '#ef4444'; // Severe - red
  return '#1f2937'; // Collapsed - dark
};

// Get damage category
export const getDamageCategory = (damage) => {
  if (damage < 10) return 'intact';
  if (damage < 30) return 'minor';
  if (damage < 60) return 'moderate';
  if (damage < 90) return 'severe';
  return 'collapsed';
};

export default {
  getDistance,
  computeBaseHomeRisk,
  computeNeighborBoost,
  generateRecommendations,
  calculateEventDamage,
  getDamageColor,
  getDamageCategory
};

