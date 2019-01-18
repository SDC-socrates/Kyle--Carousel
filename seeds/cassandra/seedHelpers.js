const fs = require('fs');

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
  return Math.round((Math.random() * 360 - 180) * 100) / 100;
};

// Returns a random longtitude value
const randomLong = () => {
  return Math.round((Math.random() * 170.1 - 85.05) * 100) / 100;
};

// Returns a random year between the years in the config
const randomYear = () => oldestModelYear
  + Math.round((Math.random() * (latestModelYear - oldestModelYear)));

// Returns certain car properties inferred from the image key
// image string format: 'category/Make/modelNumber/imageNumber.jpg'
// e.g. 'crossover/Dodge/2/0.jpg'
const attrFromImgKey = (string) => {
  return {
    model: `${string.split('/')[0].slice(0, 2).toUpperCase()}-${string.split('/')[2]}`,
    category: string.split('/')[0],
    make: string.split('/')[1],
    imageNumber: string.split('/')[3].split('.')[0]
  }
};

// Create a list of images and car models for reference
const uploads = fs.readFileSync('../../imageSeeder/uploads.json');
const carModels = {};
const images = JSON.parse(uploads.toString()).map((item) => {
  if (item.key) {
    const carObj = attrFromImgKey(item.key);
    if (carModels[carObj.make + carObj.model]) {
      carModels[carObj.make + carObj.model].photos.push(item.key);
    } else {
      carModels[carObj.make + carObj.model] = {
        category: carObj.category,
        make: carObj.make,
        model: carObj.model,
        photos: [item.key],
      };
    }
  }
  return item.key;
});


module.exports = {
  carLoadStarted,
  carLoadFinished,
  promises,
  randomYear,
  randomStatus,
  randomLat,
  randomLong,
  carModels,
};
