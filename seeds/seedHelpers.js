// ========================================================
// CONFIGS
// ========================================================
const latestModelYear = 2019;
const oldestModelYear = 2000;
const photoRootUrl = 'https://turash-assets.s3.us-west-2.amazonaws.com/';
const carsPerModel = 17550;


// ========================================================
// PROMISES TO HELP SEQUENCE ASYNC OPERATIONS
// ========================================================
const promises = [Promise.resolve(null)];
const categoryAndMakesLoaded = [];
const modelGenFinished = [];
const modelGenStarted = new Promise((resolve, reject) => {
  modelGenFinished.push({ resolve, reject });
});
const modelLoadFinished = [];
const modelLoadStarted = new Promise((resolve, reject) => {
  modelLoadFinished.push({ resolve, reject });
});
const carLoadFinished = [];
const carLoadStarted = new Promise((resolve, reject) => {
  carLoadFinished.push({ resolve, reject });
});
const carsPhotosLoadFinished = [];
const carsPhotosLoadStarted = new Promise((resolve, reject) => {
  carsPhotosLoadFinished.push({ resolve, reject });
});


// ========================================================
// HELPER FUNCTIONS
// ========================================================

// Returns a random car status
const randomStatus = () => {
  if (Math.random() < 0.5) {
    return 'Active';
  } return 'Retired';
};

// Returns a random latitude value
const randomLat = () => {
  return (Math.random() * 360 - 180).toFixed(2);
};

// Returns a random longtitude value
const randomLong = () => {
  return (Math.random() * 170.1 - 85.05).toFixed(2);
};


module.exports = { carLoadStarted, carLoadFinished, promises };
