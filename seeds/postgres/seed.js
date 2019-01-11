const Sequelize = require('sequelize');
const sequelize = require('./config');
const downloadedModels = require('../../imageSeeder/models.js');
const fs = require('fs');
const fsPromises = fs.promises;
let images;


// ========================================================
// CONFIG
// ========================================================
const dropExistingTables = true;
const latestModelYear = 2019;
const oldestModelYear = 2000;


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
    // Get the list of images uploaded to s3
    const file = fs.readFileSync('../../imageSeeder/uploads.json');
    images = JSON.parse(file.toString()).map((item) => {
      return item.key;
    });
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

let carCount = 0;

// After seeding of car models is complete
modelLoadStarted.then(() => {
  Promise.all(modelLoadFinished)
    .then(() => {
      Car.sync({ force: dropExistingTables })
        .then(() => {
          images.forEach((image, index) => {
            // For each image, identify the make and model name from the key
            const make = image.split('/')[1];
            const imageNumber = image.split('/')[3].split('.')[0];
            const modelName = `${image.split('/')[0].slice(0, 2).toUpperCase()}-${image.split('/')[2]}`;
            // For each model (not each image)
            console.log(imageNumber);
            if (imageNumber == 0) {
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
                  carLoadFinished.push(
                    
                  );
                  const carsToDB = [];
                  for (let i = 0; i < 8800; i++) {
                    carsToDB.push({
                      status: 'Active',
                      lat: 123,
                      long: 321,
                      modelId,
                    });
                    carCount++;
                    console.log(carCount);
                  }
                  carLoadFinished.push(
                    Car.bulkCreate(carsToDB)
                      .then(carLoadFinished[0].resolve('DONE'))
                  );
                });
            }
          });
        })
    });
});


// 2) Create random cars
  // image dir: category/make/modelNumber

// 3) Create random carsPhotos
