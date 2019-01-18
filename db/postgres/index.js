const async = require('async');
const sequelize = require('./config');
const db = require('../../seeds/postgres/models');

const execute = (queryString, callback) => {
  sequelize.query(queryString)
    .then((result) => {
      console.log(result[0]);
      callback(null, result[0]);
    })
    .catch((err) => {
      callback(err, null);
    });
};

// Get car details given a specific car id
const getSpecificCar = (requestedId, callback) => {
  let lookupId = requestedId;
  if (requestedId === undefined) {
    lookupId = Math.round(Math.random() * 10000000);
  }
  execute(`
  SELECT * FROM carsbycatstatuslong
    WHERE id=${lookupId}
  `, callback);
};

// Delete car fro DB given a specific car id
const deleteSpecificCar = (requestedId, callback) => {
  // Delete car. Associated car photos will also get deleted.
  db.Car.destroy({
    where: { id: requestedId },
  })
    .then(success => callback(null, success))
    .catch(err => callback(err, null));
};

// Get suggested cars given a category, status, year, lat and long
const getSuggestedCars = (requestedProperties, callback) => {
  let lookupProperties = requestedProperties;
  if (requestedProperties === undefined) {
    lookupProperties = {
      long: Math.round(Math.random() * 170.1 - 85.05),
      lat: Math.round(Math.random() * 360 - 180),
      year: 2005 + Math.round(Math.random() * 9),
      category: ['suv', 'convertible', 'hatchback', 'pickup', 'crossover', 'sports', 'electric', 'muscle'][Math.round(Math.random() * 7)], // omitted van due to seeding error
    };
  }
  execute(`
  SELECT * FROM carsbycatstatuslong
    WHERE long > ${lookupProperties.long}
      AND long < ${lookupProperties.long + 5}
      AND lat > ${lookupProperties.lat}
      AND lat < ${lookupProperties.lat + 5}
      AND status='Active' 
      AND category='${lookupProperties.category}'
      AND year>${lookupProperties.year - 5} 
      AND year<${lookupProperties.year + 5}
    LIMIT 18
  `, callback);
};

// Uncomment to test query and log execution times to file
// async.timesLimit(1000, 1,
//   (iterationIndex, callback) => getSuggestedCars(undefined, callback),
//   () => {
//     console.log('All queries complete.');
//   });

module.exports = { getSpecificCar, deleteSpecificCar, getSuggestedCars };
