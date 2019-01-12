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

module.exports = { carLoadStarted, carLoadFinished, promises };
