// Date and time assertions are written for Indian Standard Time, which is where the app's
// users are. Pinning the zone keeps the tests deterministic on CI machines that run in UTC.
process.env.TZ = 'Asia/Kolkata';

module.exports = {
  preset: '@react-native/jest-preset',
};
