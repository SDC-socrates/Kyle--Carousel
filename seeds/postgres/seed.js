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
const carLoadInterval = 1000;

// ========================================================
// PROMISES TO HELP SEQUENCE ASYNC OPERATIONS
// ========================================================
const catMakesLoadFinished = [];
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

// Returns a Promise that resolves to the found models with make
const getModelsFromName = (name) => {
  return Model.findAll({
    where: { name },
    include: [Make]
  });
};

// Returns a Promise that resolves to the found cars with model, make and category
const getCarsFromModelName = (name) => {
  return Model.findAll({
    where: { name },
    include: [Make]
  });
};

const randomStatus = () => {
  if (Math.random() < 0.5) {
    return 'Active';
  } return 'Retired';
};

const randomLat = () => {
  return (Math.random() * 360 - 180).toFixed(2);
};

const randomLong = () => {
  return (Math.random() * 170.1 - 85.05).toFixed(2);
};

// Creates 8800 random cars per model, loads it the DB and returns the Sequelize Promise
let carCount = 0;
const loadCarsToDB = (modelId) => {
  const carsToDB = [];
  for (let i = 0; i < 8800; i++) {
    carsToDB.push({
      status: randomStatus(),
      lat: randomLat(),
      long: randomLong(),
      modelId,
    });
    carCount++;
  }
  return Car.bulkCreate(carsToDB);
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
  categoriesToDB.push({name: category});
});

// Write categories to DB
catMakesLoadFinished.push(
  Category.sync({ force: dropExistingTables })
    .then(() => {
      catMakesLoadFinished.push(Category.bulkCreate(categoriesToDB));
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
catMakesLoadFinished.push(
  Make.sync({ force: dropExistingTables })
    .then(() => {
      catMakesLoadFinished.push(Make.bulkCreate(makesToDB));
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


// Create bulk upload compatabile data object and load to DB
const modelsToDB = [];
// When categories and modesl have been loaded
Promise.all(catMakesLoadFinished)
  .then(() => {
    images.forEach((image, index) => {
      // image string format: 'category/Make/modelNumber/imageNumber.jpg'
      // e.g. 'crossover/Dodge/2/0.jpg'
      if (image) {
        // For each image, identify the category and make from the key
        const category = image.split('/')[0];
        const make = image.split('/')[1];
        const imageNumber = image.split('/')[3].split('.')[0];
        // Only create a model for the first image of each model
        if (imageNumber == 0) {
          // Get the categoryId and MakeId from the DB, holding those promises in an array so we can track when DB operations are done
          modelGenFinished.push(
            getCategoryIdFromName(category)
              .then(results => results.dataValues.id)
              .then((categoryId) => {
                modelGenFinished.push(
                  getMakeIdFromName(make)
                    .then(results => results.dataValues.id)
                    .then((makeId) => {
                      const modelToDB = {
                        // Create model name based on first two letters of category - modelNumber
                        name: `${image.split('/')[0].slice(0,2).toUpperCase()}-${image.split('/')[2]}`,
                        // Create model year based on random year between oldest and latest
                        year: oldestModelYear
                          + Math.round((Math.random() * (latestModelYear - oldestModelYear))),
                        makeId,
                        categoryId,
                      };
                      // Push the model object to array for bulkCreate
                      modelsToDB.push(modelToDB);
                      // Resolve modelGenStarted now that we've started the load and modelGenFinished contains new promises
                      modelGenFinished[0].resolve('DONE');
                    })
                );
              })
          );
        }
      }
    });
  })

// Write Models to DB
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

// Create bulk upload compatabile data object
const photosToDB = [];
images.forEach((imageKey) => {
  photosToDB.push({url: `https://turash-assets.s3.us-west-2.amazonaws.com/${imageKey}`});
});

// Write Photos to DB
Photo.sync({ force: dropExistingTables })
  .then(() => {
    Photo.bulkCreate(photosToDB);
  });

// Get all photos in the DB
  // Loop thru each photo
    // Based on the key, get the model name
    // Get the model_id from the model name
    // Get all cars with the same model_id
    // seed carPhotos progressively with car_id and photo_id


// ========================================================
// CARS
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


// Create bulk upload compatabile data object and load to DB
// Going thru image list, for each model (by name), seed 8800 cars

let batch = 1;
// After seeding of car models is complete
modelLoadStarted.then(() => {
  Promise.all(modelLoadFinished)
    .then(() => {
      Car.sync({ force: dropExistingTables })
        .then(() => {
          images.forEach((image, index) => {
            if (image) {
              // For each image, identify the make and model name from the key
              const make = image.split('/')[1];
              const imageNumber = image.split('/')[3].split('.')[0];
              const modelName = `${image.split('/')[0].slice(0, 2).toUpperCase()}-${image.split('/')[2]}`;
              // For each model (not each image)
              if (imageNumber == 0 && index >= 0) {
                // Get the modelId from the DB
                getModelsFromName(modelName)
                  .then((results) => {
                    return results.filter((result) => {
                      return result.dataValues.make.name === make;
                    })[0].dataValues.id;
                  })
                  .then((modelId) => {
                    // Create 8800 cars from each model and load into DB
                    // Push a new promise into carLoadFinish that waits for the prior promise to finish
                    // Push a new unresolved promise into the queue
                    carLoadFinished[0].resolve('DONE');
                    carLoadFinished.push(
                      new Promise((resolve, reject) => {
                        // If first upload, execute immediately
                        var currentPromiseIndex = carLoadFinished.length;
                        if (currentPromiseIndex === 1) {
                          loadCarsToDB()
                            // Promise should resolve after successful DB load
                            .then(resolve('DONE'));
                        } else {
                          // Otherwise, when prior promise is resolved, execute this one.
                          carLoadFinished[currentPromiseIndex-1].then(() => {
                            // load cars to DB, taking into account delay setting
                            setTimeout(() => {
                              console.log('DB BATCH LOAD #: ', batch);
                              batch++;
                              loadCarsToDB(modelId)
                                // Promise should resolve after successful DB load
                                .then(resolve('DONE'));
                            }, carLoadInterval);
                          });
                        }
                      })
                    )  
                  });
              }
            }
          });
        })
    });
});


// ========================================================
// CARSPHOTOS
// ========================================================

// Get cars of a certain model from the DB, including their model, make and category
// Create carPhotos for all cars of the same model at one time (as they will have the same images)

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
