// Date and time assertions are written for Indian Standard Time, which is where the app's
// users are. Pinning the zone keeps the tests deterministic on CI machines that run in UTC.
process.env.TZ = 'Asia/Kolkata';

module.exports = {
  preset: '@react-native/jest-preset',
  // The first test in a file pays for loading and transforming the whole screen's modules.
  // That takes about 3 seconds on a fast machine with no cache, and more on GitHub's
  // shared runners, so Jest's default 5 second limit fails release builds at random.
  testTimeout: 20000,
};
