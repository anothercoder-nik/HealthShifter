// Haversine distance in meters
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function insidePerimeter(userLat, userLng, centerLat, centerLng, radiusMeters) {
  if (
    [userLat, userLng, centerLat, centerLng, radiusMeters].some(
      (v) => v === undefined || v === null || Number.isNaN(Number(v))
    )
  ) return false;
  return distanceMeters(userLat, userLng, centerLat, centerLng) <= radiusMeters;
}
