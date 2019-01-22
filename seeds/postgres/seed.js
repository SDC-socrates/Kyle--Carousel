const Sequelize = require('sequelize');
const async = require('async');
const fs = require('fs');
const sequelize = require('../../db/postgres/config');
const downloadedModels = require('../../imageSeeder/models.js');
const db = require('./models.js');
const majorCities = require('../usdmas');

// ========================================================
// CONFIGURATION
// ========================================================

const dropExistingTables = true;
const latestModelYear = 2019;
const oldestModelYear = 2000;
const carsPerModel = 17600;


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
  return db.Category.findOne({
    where: { name }
  });
};

// Returns a Promise that resolves to the found make
const getMakeIdFromName = (name) => {
  return db.Make.findOne({
    where: { name }
  });
};

// Returns a Promise that resolves to the found modelId
const getModelIdFromName = (name, make) => {
  const promise = new Promise((resolve, reject) => {
    db.Model.findAll({
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
  return db.Car.findAll({
    where: { modelId },
  });
};

// Returns a random car status
const randomStatus = () => {
  if (Math.random() < 0.5) {
    return 'Active';
  } return 'Withheld';
};

// Returns a random major US city
const randomCity = () => {
  return majorCities[Math.floor(Math.random() * majorCities.length)];
}

// // Returns a random latitude value
// const randomLat = () => {
//   return (Math.random() * 360 - 180).toFixed(2);
// };

// // Returns a random longtitude value
// const randomLong = () => {
//   return (Math.random() * 170.1 - 85.05).toFixed(2);
// };

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
    const city = randomCity();
    carsToDB.push({
      id: ((modelId - 1) * carsPerModel + i),
      status: randomStatus(),
      city: city.city.toLowerCase(),
      lat: city.latitude + (0.3 - Math.random() * 0.6),
      long: city.longitude + (0.3 - Math.random() * 0.6),
      modelId,
    });
  }
  return db.Car.bulkCreate(carsToDB);
};

// Creates a CarsPhoto record for each car given a modelId and photo id
const attachPhotosToCars = (modelId, photoId) => {
  const carPhotosToDB = [];
  const carIdStart = (modelId - 1) * carsPerModel + 1;
  const carIdEnd = modelId * carsPerModel;
  for (var carId = carIdStart; carId <= carIdEnd; carId++) {
    carPhotosToDB.push({ carId, photoId });
  }
  return db.CarsPhoto.bulkCreate(carPhotosToDB);
};

// Executes raw queries
const execute = (queryString) => {
  return sequelize.query(queryString, { type: sequelize.QueryTypes.RAW });
};

// ========================================================
// CATEGORIES
// ========================================================

// Identify categories from downloadedModels object
const categories = Object.keys(downloadedModels);

// Create bulk upload compatabile data object
const categoriesToDB = [];
categories.forEach((category) => {
  categoriesToDB.push({ name: category });
});

// Queue up operations to write categories to DB
asyncSeries1.push((callback) => {
  db.Category.sync({ force: dropExistingTables })
    .then(() => db.Category.bulkCreate(categoriesToDB))
    // Using async, kickoff the next operation after this one is done
    .then(() => callback(null, null));
});

// ========================================================
// MAKES
// ========================================================

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
  db.Make.sync({ force: dropExistingTables })
    .then(() => db.Make.bulkCreate(makesToDB))
    // Using async, kickoff the next operation after this one is done
    .then(() => callback(null, null));
});


// ========================================================
// MODELS
// ========================================================

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
                db.Model.hash[make + modelToDB.name] = modelToDB.id;
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
  db.Model.sync({ force: dropExistingTables })
    .then(() => db.Model.bulkCreate(modelsToDB))
    // Queue up operations to write cars to DB
    .then(() => queueCars())
    // Using async, kickoff the next operation after this one is done
    .then(() => callback(null, null));
});


// ========================================================
// PHOTOS
// ========================================================

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
  db.Photo.sync({ force: dropExistingTables })
    .then(() => db.Photo.bulkCreate(photosToDB))
    .then(() => db.Photo.findAll({}))
    .then((photosFromDB) => {
      // Store list of photos for reference and add carPhotos seeding to queue
      photos = photosFromDB;
      queueCarPhotos();
      // Using async, kickoff the next operation after this one is done
      callback(null, null);
    });
});


// ========================================================
// CARS AND CARSPHOTOS - SEED DB
// ========================================================

// Create tables in DB
asyncSeries1.push((callback) => {
  // console.log('CREATING CARS TABLE!!');
  sequelize.query('CREATE SEQUENCE carsid START 1;')
    .then(() => sequelize.query(`
      CREATE TABLE public.cars
      (
          id integer NOT NULL DEFAULT nextval('carsid'),
          status character varying(255) COLLATE pg_catalog."default",
          city character varying(255) COLLATE pg_catalog."default",
          lat double precision,
          "long" double precision,
          "modelId" integer,
          CONSTRAINT cars_pkey PRIMARY KEY (city, id),
          CONSTRAINT "cars_modelId_fkey" FOREIGN KEY ("modelId")
              REFERENCES public.models (id) MATCH SIMPLE
              ON UPDATE CASCADE
              ON DELETE SET NULL
      )
      PARTITION BY LIST(city)
      WITH (
          OIDS = FALSE
      )
      TABLESPACE pg_default;
  `))
  .then(() => sequelize.query(`
    CREATE TABLE cars_global PARTITION OF cars DEFAULT;
  `))
  .then(() => db.Car.sync({ force: false }))
    .then(() => db.CarsPhoto.sync({ force: dropExistingTables }))
    .then(() => callback(null, null));
});

majorCities.forEach((city) => {
  asyncSeries1.push((callback) => {
    const cityName = city.city.toLowerCase();
    sequelize.query(`
    CREATE TABLE cars_${cityName} PARTITION OF cars FOR VALUES IN ('${cityName}');
    `)
      .then(() => callback(null, null));
  });
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
  asyncSeries2.push((callback) => {
    sequelize.query('CREATE TABLE carcitylookup AS SELECT id, city FROM cars')
      .then(() => sequelize.query('CREATE INDEX ixcarlookupid ON carcitylookup (id DESC);'))
      .then(() => sequelize.query(`
      CREATE OR REPLACE FUNCTION car_details_by_id(
        carid NUMERIC) 
        RETURNS TABLE (qid integer, qmake character varying, qmodel character varying, qyear integer, qcity character varying, qlong double precision, qlat double precision, qurl character varying, qcategory character varying)
        AS $$
        DECLARE
          dynamic_sql TEXT;
          partition character varying;
        BEGIN
            EXECUTE 'SELECT city FROM carcitylookup WHERE id = ' || carid
              INTO partition;
            dynamic_sql := 'SELECT '
            || concat('cars_',partition)::regclass
            || '.id, makes.name as make, models.name as model, models.year, '
            || concat('cars_',partition)::regclass
            || '.city, '
            || concat('cars_',partition)::regclass
            || '.long, '
            || concat('cars_',partition)::regclass
            || '.lat, photos.url, categories.name as category FROM ' 
            || concat('cars_',partition)::regclass 
            || ', models, makes, categories, "carsPhotos", photos WHERE '
            || concat('cars_',partition)::regclass 
            || '.id = '
            || carid
            || ' AND '
            || concat('cars_',partition)::regclass 
            || '."modelId"=models.id
              AND models."makeId"=makes.id
              AND models."categoryId"=categories.id
              AND "carsPhotos"."carId"='
            || concat('cars_',partition)::regclass 
            || '.id AND photos.id="carsPhotos"."photoId"';
            
          RAISE DEBUG '%', dynamic_sql; 
          RETURN QUERY EXECUTE dynamic_sql;
        END;
        $$ language plpgsql;
      `))
      .then(() => callback(null, null));
  });
};

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
      // console.log(photo, db.Model.hash[make + modelName], photo.dataValues.id);
      attachPhotosToCars(db.Model.hash[make + modelName], photo.dataValues.id)
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
  async.parallelLimit(asyncSeries2, 3, () => {
    sequelize.query(`
    CREATE OR REPLACE FUNCTION
    public.carsphotos_pseudo_fk_constraints()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      DECLARE
        carid numeric;
        photoid numeric;
      BEGIN
        EXECUTE 'SELECT id FROM carcitylookup WHERE id = ' || NEW."carId"
          INTO carid;
        IF carid IS NULL THEN
          raise exception 'Pseudo FK error: Inserting carsPhoto for carId not found: %', NEW."carId";
        END IF;
        EXECUTE 'SELECT id FROM photos WHERE id = ' || NEW."photoId"
          INTO photoid;
        IF photoid IS NULL THEN
          raise exception 'Pseudo FK error: Inserting carsPhoto for photoId not found: %', NEW."photoId";
        END IF;
        RETURN NEW;
      END;
    $function$;
      `)
      .then(() => sequelize.query(`
        CREATE TRIGGER insert_trigger BEFORE INSERT OR UPDATE ON "carsPhotos" FOR EACH ROW EXECUTE PROCEDURE carsphotos_pseudo_fk_constraints();
        `))
      .then(() => sequelize.query('CREATE INDEX ixphotocarid ON "carsPhotos" ("carId" DESC);'))
      // Finally, log total time
      .then(() => console.timeEnd('Completed seeding and table setup.'));
  });
});
