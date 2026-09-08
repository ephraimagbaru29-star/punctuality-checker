/**
 * Location utilities using browser Geolocation API + LocationIQ reverse geocoding
 */

const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_KEY || '';

export const getLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error('Location access denied. ' + err.message)),
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
};

export const reverseGeocode = async (lat, lng) => {
  if (!LOCATIONIQ_KEY) return null;
  try {
    const res = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
};

export const getLocationWithAddress = async () => {
  const { lat, lng } = await getLocation();
  const address = await reverseGeocode(lat, lng);
  return { lat, lng, address };
};
