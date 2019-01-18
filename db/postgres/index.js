const async = require('async');
const sequelize = require('./config');
const db = require('../../seeds/postgres/models');

// ========================================================
// HELPER FUNCTIONS
// ========================================================

const execute = (queryString, callback) => {
  console.log('DB queryString: ',queryString);
  sequelize.query(queryString)
    .then((result) => {
      console.log('DB Result: ', result[0]);
      callback(null, result[0]);
    })
    .catch((err) => {
      callback(err, null);
    });
};


// ========================================================
// DATABASE OPERATIONS
// ========================================================

// Get car details given a specific car id
const getSpecificCar = (requestedId, callback) => {
  let lookupId = requestedId;
  // If no carId is provided, lookup a random car
  if (requestedId === undefined) {
    lookupId = Math.round(Math.random() * 10000000);
  }
  execute(`
  SELECT cars.id, makes.name as make, models.name as model, models.year, cars.long, cars.lat, photos.url, categories.name as category 
  FROM cars, models, makes, categories, "carsPhotos", photos 
    WHERE cars.id=${lookupId}
    AND cars."modelId"=models.id 
    AND models."makeId"=makes.id 
    AND models."categoryId"=categories.id 
    AND "carsPhotos"."carId"=cars.id 
    AND photos.id="carsPhotos"."photoId"
  `, callback);
};

// Insert new car into DB given a specific car id and car properties
const postSpecificCar = (requestedId, carProps, callback) => {
  // carProps expected shape: {
  //   "id":10000103,
  //   "status":"Active",
  //   "make":"Bugatti",
  //   "model":"SP-0",
  //   "year": 2012
  //   "long":77.39,
  //   "lat":56.18,
  //   "images":["https://turash-assets.s3.us-west-2.amazonaws.com/sports/Bugatti/0/0.jpeg","https://turash-assets.s3.us-west-2.amazonaws.com/sports/Bugatti/0/1.jpeg"]
  //  }
  // First lookup makeId given the make name
  db.Make.findOne({
    where: { name: carProps.make },
  })
    .then(({ dataValues }) => dataValues.id)
    // Then lookup ModelId given name/year/makeId
    .then(makeId => db.Model.findOne({
      where: {
        name: carProps.model,
        year: carProps.year,
        makeId,
      },
    }))
    .then(({ dataValues }) => dataValues.id)
    // Create the car with given info plus matching modelId and makeId
    .then(modelId => db.Car.create({
      id: carProps.id,
      status: carProps.status,
      lat: carProps.lat,
      long: carProps.long,
      modelId,
    }))
    // Create images and link them to the newly created car
    .then(() => {
      carProps.images.forEach((url) => {
        db.Photo.create({ url })
          .then(({ dataValues }) => dataValues.id)
          .then(photoId => db.CarsPhoto.create({
            carId: carProps.id,
            photoId,
          }));
      });
      callback(null, 'Car inserted successfully into DB.')
    })
    .catch((err) => {
      callback(err, null);
    });
};

// Delete car from DB given a specific car id
const deleteSpecificCar = (requestedId, callback) => {
  // Delete car (associated car photos will also get deleted)
  db.Car.destroy({
    where: { id: requestedId },
  })
    .then(success => callback(null, success))
    .catch(err => callback(err, null));
};

// Get suggested cars given a category, status, year, lat and long
const getSuggestedCars = (requestedProperties, callback) => {
  let lookupProperties = requestedProperties;
  // If no specific properties are provided, perform a random lookup
  if (requestedProperties === undefined) {
    lookupProperties = {
      long: Math.round(Math.random() * 170.1 - 85.05),
      lat: Math.round(Math.random() * 360 - 180),
      year: 2005 + Math.round(Math.random() * 9),
      category: ['suv', 'convertible', 'hatchback', 'pickup', 'crossover', 'sports', 'electric', 'muscle'][Math.round(Math.random() * 7)], // omitted van due to seeding error
    };
  }
  execute(`
  SELECT cars.id, makes.name as make, models.name as model, models.year, cars.long, cars.lat, photos.url 
    FROM cars, models, makes, categories, "carsPhotos", photos 
    WHERE cars."modelId"=models.id 
      AND models."makeId"=makes.id 
      AND models."categoryId"=categories.id 
      AND "carsPhotos"."carId"=cars.id 
      AND photos.id="carsPhotos"."photoId"
      AND cars.long > ${lookupProperties.long}
      AND cars.long < ${lookupProperties.long + 5}
      AND cars.lat > ${lookupProperties.lat}
      AND cars.lat < ${lookupProperties.lat + 5}
      AND cars.status='Active' 
      AND categories.name='${lookupProperties.category}'
      AND models.year>${lookupProperties.year - 5} 
      AND models.year<${lookupProperties.year + 5}
    LIMIT 18;
  `, callback);
};

// Uncomment to test query and log execution times to file
// async.timesLimit(1000, 1,
//   (iterationIndex, callback) => getSuggestedCars(undefined, callback),
//   () => {
//     console.log('All queries complete.');
//   });

module.exports = { getSpecificCar, postSpecificCar, deleteSpecificCar, getSuggestedCars };
