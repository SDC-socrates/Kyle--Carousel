const Sequelize = require('sequelize');
const async = require('async');
const fs = require('fs');
const sequelize = require('../../db/postgres/config');
const downloadedModels = require('../../imageSeeder/models.js');


// ========================================================
// CONFIGURATION
// ========================================================
const dropExistingTables = true;
const latestModelYear = 2019;
const oldestModelYear = 2000;
const carsPerModel = 17550;


// ========================================================
// GENERAL SETUP
// ========================================================

// Track total time for console logging
console.time('Completed seeding and table setup.');

// Get the list of images uploaded to s3
const uploads = fs.readFileSync('../../imageSeeder/uploads.json');
const images = JSON.parse(uploads.toString()).map((item) => {
  return item.key;
});

const asyncSeries1 = [];
const asyncSeries2 = [];

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
    model: `${string.split('/')[0].slice(0, 2).toUpperCase()}-${string.split('/')[2]}`,
    category: string.split('/')[0],
    make: string.split('/')[1],
    imageNumber: string.split('/')[3].split('.')[0],
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

// Executes raw queries
const execute = (queryString) => {
  return sequelize.query(queryString, { type: sequelize.QueryTypes.RAW });
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

// Queue up operations to write categories to DB
asyncSeries1.push((callback) => {
  Category.sync({ force: dropExistingTables })
    .then(() => Category.bulkCreate(categoriesToDB))
    // Using async, kickoff the next operation after this one is done
    .then(() => callback(null, null));
});

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

// Queue up operations to write makes to DB
asyncSeries1.push((callback) => {
  Make.sync({ force: dropExistingTables })
    .then(() => Make.bulkCreate(makesToDB))
    // Using async, kickoff the next operation after this one is done
    .then(() => callback(null, null));
});


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


// Create bulk upload compatabile data object
const modelsToDB = [];
// Keep a count of Models (to manually insert IDs so we don't have to poll the DB for it)
let modelCount = 1;
images.forEach((image) => {
  if (image) {
    // For each image, identify attributes from the key
    const { category } = attrFromImgKey(image);
    const { make } = attrFromImgKey(image);
    const { imageNumber } = attrFromImgKey(image);
    // Only create a model for the first image of each model
    if (imageNumber == 0) {
      // Get the category ID and make ID
      asyncSeries1.push((callback) => {
        getCategoryIdFromName(category)
          // Using async, kickoff the next operation after this one is done
          .then(results => results.dataValues.id)
          .then((categoryId) => {
            getMakeIdFromName(make)
              .then(({ dataValues }) => {
                const makeId = dataValues.id;
                // Create a Model object compatible with sequelize upload
                const modelToDB = {
                  // Set model year based on counter
                  id: modelCount,
                  name: attrFromImgKey(image).model,
                  // Set model year based on random year between oldest and latest
                  year: oldestModelYear
                    + Math.round((Math.random() * (latestModelYear - oldestModelYear))),
                  makeId,
                  categoryId,
                };
                // Push the model object to array for bulkCreate
                modelsToDB.push(modelToDB);
                // Store model name to id lookup for offline reference
                Model.hash[make + modelToDB.name] = modelToDB.id;
                modelCount += 1;
                // Using async, kickoff the next operation after this one is done
                callback(null, null);
              });
          });
      });
    }
  }
});

// Queue up operations to write models to DB
asyncSeries1.push((callback) => {
  Model.sync({ force: dropExistingTables })
    .then(() => Model.bulkCreate(modelsToDB))
    // Queue up operations to write cars to DB
    .then(() => queueCars())
    // Using async, kickoff the next operation after this one is done
    .then(() => callback(null, null));
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
    photosToDB.push({ url: imageKey });
  }
});

// Queue up operations to write photos to DB
let photos;
asyncSeries1.push((callback) => {
  Photo.sync({ force: dropExistingTables })
    .then(() => Photo.bulkCreate(photosToDB))
    .then(() => Photo.findAll({}))
    .then((photosFromDB) => {
      // Store list of photos for reference and add carPhotos seeding to queue
      photos = photosFromDB;
      queueCarPhotos();
      // Using async, kickoff the next operation after this one is done
      callback(null, null);
    });
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


// Create tables in DB
asyncSeries1.push((callback) => {
  Car.sync({ force: dropExistingTables })
    .then(() => CarsPhoto.sync({ force: dropExistingTables }))
    .then(() => callback(null, null));
});

// Once models are loaded, for each model, load a batch of cars into the DB
// Note: This queuing function gets called after models have been inserted into the DB      
const queueCars = () => {
  let timestart;
  modelsToDB.forEach((model, batch) => {
    asyncSeries2.push((callback) => {
      // Track time for console logging
      if (batch === 0) {
        timeStart = Date.now(); 
      }
      console.log(`Loading cars to DB. Batch size ${carsPerModel}. Batch ${batch + 1}/${modelsToDB.length}.`);
      loadCarsToDB(model.id)
        .then(() => {
          // Log key info about the loading operation to the console
          const timeNow = Date.now();
          const minutesElasped = ((timeNow - timeStart) / 60000).toFixed(2);
          const averageTimePerBatch = ((timeNow - timeStart) / 1000 / batch).toFixed(2);
          const estimatedTimeRemaining = ((modelsToDB.length - (batch + 1)) * averageTimePerBatch / 60).toFixed(2);
          console.log(`Data inserted. ${minutesElasped}m elasped. ${averageTimePerBatch}s/batch. ~${estimatedTimeRemaining}m remaining.`);
          // Using async, kickoff the next operation after this one is done
          callback(null, null);
        });
    });
  });
}

// Once car load is complete, start carsPhotos load
// Note: This queuing function gets called after photos have been fetched by the DB
const queueCarPhotos = () => {
  let timestart;
  // Loop thru each photo
  photos.forEach((photo, batch) => {
    // Extract the key from the photo urls
    const key = photo.dataValues.url;
    const modelName = attrFromImgKey(key).model;
    const { make } = attrFromImgKey(key);
    // For each photo, queue an async operation to create car-to-photo links in the DB
    asyncSeries2.push((callback) => {
      // Track time for console logging
      if (batch === 0) {
        timeStart = Date.now(); 
      }
      console.log(`Load CarsPhotos to DB (${carsPerModel}/batch). Batch ${batch}/${photos.length}`);
      // console.log(photo, Model.hash[make + modelName], photo.dataValues.id);
      attachPhotosToCars(Model.hash[make + modelName], photo.dataValues.id)
        .then(() => {
          // Log key info about the seed operation
          const timeNow = Date.now();
          const minutesElasped = ((timeNow - timeStart) / 60000).toFixed(2);
          const averageTimePerBatch = ((timeNow - timeStart) / 1000 / batch).toFixed(2);
          const estimatedTimeRemaining = ((photos.length - (batch + 1)) * averageTimePerBatch / 60).toFixed(2);
          console.log(`Data inserted. ${minutesElasped}m elasped. ${averageTimePerBatch}s/batch. ~${estimatedTimeRemaining}m remaining.`);
          // Using async, kickoff the next operation after this one is done
          callback(null, null);
        });
    });
  });
};


// Initiate async operations
async.parallelLimit(asyncSeries1, 1, () => {
  async.parallelLimit(asyncSeries2, 4, () => {
    // After all seeding operations are done, create materialized view
    console.log('Seeding complete. Creating materialized view.');
    execute(`
    CREATE MATERIALIZED VIEW carsbycatstatuslong AS
      SELECT cars.id as id, categories.name as category, cars.status, cars.long, cars.lat, makes.name as make, models.name as model, models.year, photos.url 
        FROM cars, models, makes, categories, "carsPhotos", photos 
        WHERE cars."modelId"=models.id 
          AND models."makeId"=makes.id 
          AND models."categoryId"=categories.id 
          AND "carsPhotos"."carId"=cars.id 
          AND photos.id="carsPhotos"."photoId"
        ORDER BY
          categories.name,
          cars.status,
          cars.long
    `)
      // Then, create index
      .then(() => execute('CREATE INDEX catstatuslong ON carsbycatstatuslong (category, status, long);'))
      // Finally, log total time
      .then(() => console.timeEnd('Completed seeding and table setup.'));
  });
});
