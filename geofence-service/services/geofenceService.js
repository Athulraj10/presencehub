const { getDistance } = require("geolib");
const db = require("../config/db");

const getGeofence = async () => {
  const [results] = await db.query("SELECT * FROM geofences LIMIT 1");
  if (results.length === 0) throw new Error("No geofence found");
  return results[0];
};

const validateLocation = async (latitude, longitude) => {
  const geofence = await getGeofence();

  const distance = getDistance(
    { latitude: Number(latitude), longitude: Number(longitude) },
    { latitude: Number(geofence.latitude), longitude: Number(geofence.longitude) }
  );

  return {
    officeName: geofence.office_name,
    distance,
    radius: geofence.radius,
    insideGeofence: distance <= geofence.radius
  };
};

module.exports = { validateLocation };