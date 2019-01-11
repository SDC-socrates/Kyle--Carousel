const Sequelize = require('sequelize');
const sequelize = require('./config');
const downloadedModels = require('../../imageSeeder/models.js');
const fs = require('fs');
const fsPromises = fs.promises;

// Get the list of images uploaded to s3
const uploads = fs.readFileSync('../../imageSeeder/uploads.json');
const images = JSON.parse(uploads.toString()).map((item) => {
  return item.key;
});


// ========================================================
// CONFIG
// ========================================================
const dropExistingTables = true;
const latestModelYear = 2019;
const oldestModelYear = 2000;
const carLoadInterval = 1500;
const carsPhotoLoadInterval = 1500;
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

// Returns a Promise that resolves to the found category
const getCategoryIdFromName = (name) => {
  return Category.findOne({
    where: { name }
  });
};

// Returns a Promise that resolves to the found make
const getMakeIdFromName = (name) => {
  return Make.findOne({
    where: { name }
  });
};

// Returns a Promise that resolves to the found modelId
const getModelIdFromName = (name, make) => {
  const promise = new Promise((resolve, reject) => {
    Model.findAll({
      where: { name },
      include: [Make]
    })
      .then((results) => {
        return results.filter((result) => {
          return result.dataValues.make.name === make;
        })[0].dataValues.id;
      })
      .then((id) => { resolve(id); });
  });
  return promise;
};

// Returns a Promise that resolves to the found cars with model, make and category
const getCarsFromModelId = (modelId) => {
  return Car.findAll({
    where: { modelId },
  });
};

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

// Returns certain car properties inferred from the image key
// image string format: 'category/Make/modelNumber/imageNumber.jpg'
// e.g. 'crossover/Dodge/2/0.jpg'
const attrFromImgKey = (string) => {
  return {
    model: `${string.split('/')[0].slice(0,2).toUpperCase()}-${string.split('/')[2]}`,
    category: string.split('/')[0],
    make: string.split('/')[1],
    imageNumber: string.split('/')[3].split('.')[0]
  }
};

// Creates 'carsPerModel' random cars per model, loads it the DB and returns the Sequelize Promise
const loadCarsToDB = (modelId) => {
  const carsToDB = [];
  for (let i = 1; i <= carsPerModel; i++) {
    carsToDB.push({
      id: ((modelId - 1) * carsPerModel + i),
      status: randomStatus(),
      lat: randomLat(),
      long: randomLong(),
      modelId,
    });
  }
  return Car.bulkCreate(carsToDB);
};

// Creates a CarsPhoto record for each car given a modelId and photo id
const attachPhotosToCars = (modelId, photoId) => {
  const carPhotosToDB = [];
  const carIdStart = (modelId - 1) * carsPerModel + 1;
  const carIdEnd = modelId * carsPerModel;
  for (var carId = carIdStart; carId <= carIdEnd; carId++) {
    carPhotosToDB.push({ carId, photoId });
  }
  return CarsPhoto.bulkCreate(carPhotosToDB);
};


// ========================================================
// CATEGORIES
// ========================================================

// Define schema for Categories in DB
const Category = sequelize.define('category', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

// Identify categories from downloadedModels object
const categories = Object.keys(downloadedModels);

// Create bulk upload compatabile data object
const categoriesToDB = [];
categories.forEach((category) => {
  categoriesToDB.push({ name: category });
});

// Write categories to DB
categoryAndMakesLoaded.push(
  Category.sync({ force: dropExistingTables })
    .then(() => {
      categoryAndMakesLoaded.push(Category.bulkCreate(categoriesToDB));
    }),
);

// ========================================================
// MAKES
// ========================================================

// Define schema for Makes in DB
const Make = sequelize.define('make', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

// Identify makes from models
const makes = new Set();
categories.forEach((category) => {
  downloadedModels[category].forEach((model) => {
    makes.add(model.split(' ')[0]);
  });
});

// Create bulk upload compatabile data object
const makesToDB = [];
makes.forEach((make) => {
  makesToDB.push({ name: make });
});

// Write makes to DB
categoryAndMakesLoaded.push(
  Make.sync({ force: dropExistingTables })
    .then(() => {
      categoryAndMakesLoaded.push(Make.bulkCreate(makesToDB));
    }),
);

// ========================================================
// MODELS
// ========================================================


// Define schema for Models in DB
const Model = sequelize.define('model', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  year: {
    type: Sequelize.INTEGER,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

Model.belongsTo(Make);
Make.hasMany(Model);
Model.belongsTo(Category);
Category.hasMany(Model);

Model.hash = {};

// Create bulk upload compatabile data object and load to DB
const modelsToDB = [];
// When categories and models have been loaded
Promise.all(categoryAndMakesLoaded)
  .then(() => {
    // We will manually insert IDs so we don't have to poll the DB for it
    // Keep a manual count of Models
    let modelCount = 1;
    images.forEach((image) => {
      if (image) {
        // For each image, identify attributes from the key
        const {category} = attrFromImgKey(image);
        const {make} = attrFromImgKey(image);
        const {imageNumber} = attrFromImgKey(image);
        // Only create a model for the first image of each model
        if (imageNumber == 0) {
          // Get the categoryId and MakeId from the DB
          // For DB operations, hold promises in an array so we can track when operations are done
          modelGenFinished.push(
            getCategoryIdFromName(category)
              .then(results => results.dataValues.id)
              .then((categoryId) => {
                modelGenFinished.push(
                  getMakeIdFromName(make)
                    .then(results => results.dataValues.id)
                    .then((makeId) => {
                      // Create a Model object compatible with sequelize upload
                      const modelToDB = {
                        id: modelCount,
                        name: attrFromImgKey(image).model,
                        // Create model year based on random year between oldest and latest
                        year: oldestModelYear
                          + Math.round((Math.random() * (latestModelYear - oldestModelYear))),
                        makeId,
                        categoryId,
                      };
                      // Push the model object to array for bulkCreate
                      modelsToDB.push(modelToDB);
                      // Store model name to id lookup for offline reference
                      Model.hash[make + modelToDB.name] = modelToDB.id;
                      modelCount++;
                      // Resolve modelGenStarted now that we've started the load and modelGenFinished contains new promises
                      modelGenFinished[0].resolve('DONE');
                    })
                );
              })
          );
        }
      }
    });
  });

// After models have been generated, write Models to DB
modelGenStarted.then(() => {
  Promise.all(modelGenFinished)
    .then(() => {
      Model.sync({ force: dropExistingTables })
        .then(() => {
          Model.bulkCreate(modelsToDB)
            .then(modelLoadFinished[0].resolve('DONE'));
        });
    });
});


// ========================================================
// PHOTOS
// ========================================================

// Define schema for Photos in DB
const Photo = sequelize.define('photo', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  url: {
    type: Sequelize.STRING,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

// Create bulk upload compatible data object
const photosToDB = [];
images.forEach((imageKey) => {
  if (imageKey) {
    photosToDB.push({ url: photoRootUrl + imageKey });
  }
});

// Write Photos to DB
Photo.sync({ force: dropExistingTables })
  .then(() => {
    Photo.bulkCreate(photosToDB);
  });


  
// ========================================================
// CARS - DEFINE SCHEMA
// ========================================================

// Define schema for Cars in DB
const Car = sequelize.define('car', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  status: {
    type: Sequelize.STRING,
  },
  lat: {
    type: Sequelize.FLOAT,
  },
  long: {
    type: Sequelize.FLOAT,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

Car.belongsTo(Model);
Model.hasMany(Car);


// ========================================================
// CARSPHOTOS - DEFINE SCHEMA
// ========================================================


// Define schema for carsPhoto in DB
const CarsPhoto = sequelize.define('carsPhoto', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

CarsPhoto.belongsTo(Car);
CarsPhoto.belongsTo(Photo);
Car.hasMany(CarsPhoto);
Photo.hasMany(CarsPhoto);


// ========================================================
// CARS AND CARSPHOTOS - SEED DB
// ========================================================

// Craete counters so we can display progress
let carsPhotoBatch = 1;
let carsBatch = 1;
// Create timers so we can space out DB operations
let carsPhototimer = 0;
let carsTimer = 0;

// Once model load is complete, start seeding models
modelLoadStarted.then(() => {
  Promise.all(modelLoadFinished)
    .then(() => Car.sync({ force: dropExistingTables }))
    .then(() => { 
    // For each car model, seed cars
      modelsToDB.forEach((model, index) => {
        // This conditional allows us to reduce range of seeding for debugging 
        if (index >= 0) {
          carLoadFinished[0].resolve('DONE');
          // Keep DB operations in an array of promises so we can track when all are complete
          carLoadFinished.push(promise = new Promise((resolve, reject) => {
            // Delay each DB operation based on delay config
            setTimeout(() => {
              loadCarsToDB(model.id)
                .then(() => {
                  console.log(`Load Cars to DB (${carsPerModel}/batch). Batch #:`, carsBatch); 
                  carsBatch++;
                  resolve('DONE');
                  return;
                })
                .catch((err) => { console.log(err); });
            }, carsTimer);
            carsTimer += carLoadInterval;
          }
          ));
        }
     })
    })
});

// Once car load is complete, start carsPhotos load
carLoadStarted.then(() => {
  Promise.all(carLoadFinished)
  .then(() => { return CarsPhoto.sync({ force: dropExistingTables }); })
    // Get all photos in the DB
    .then(() => { return Photo.findAll({}); })
    .then((photos) => {
      // Loop thru each photo
      photos.forEach((photo) => {
        // Extract the key from the photo urls
        const regex = new RegExp(photoRootUrl, 'g');
        const key = photo.dataValues.url.replace(regex, '');
        const modelName = attrFromImgKey(key).model;
        const {make} = attrFromImgKey(key);
        // Delay each DB operation based on delay config
        setTimeout(() => {
          // seed carPhotos based on car_id (infererd from model id) and photo id
          attachPhotosToCars(Model.hash[make+modelName], photo.dataValues.id)
            .then(() => {
              console.log(`Load CarsPhotos to DB (${carsPerModel}/batch). Batch #:`, carsPhotoBatch);
              carsPhotoBatch++;
              return;
            })
            .catch((err) => { console.log(err); });
        }, carsPhototimer);
        carsPhototimer += carsPhotoLoadInterval;
      });
    });
});
