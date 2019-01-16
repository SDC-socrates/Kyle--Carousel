const async = require('async');
const sequelize = require('./config');


const execute = (queryString, callback) => {
  sequelize.query(queryString)
    .then((result) => {
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

// Get suggested cars given a category, status, year, lat and long
const getSuggestedCars = (requestedProperties, callback) => {
  let lookupProperties = requestedProperties;
  if (requestedProperties === undefined) {
    lookupProperties = {
      long: Math.round(Math.random() * 180 - 90),
      lat: Math.round(Math.random() * 360 - 180),
      year: 2005 + Math.round(Math.random() * 9),
      category: ['suv', 'convertible', 'hatchback', 'pickup', 'crossover', 'van', 'sports', 'electric', 'muscle'][Math.round(Math.random() * 8)]
    };
  }
  execute(`
  SELECT * FROM carsbycatstatuslong
    WHERE long > ${lookupProperties.long}
      AND long < ${lookupProperties.long + 0.5}
      AND lat > ${lookupProperties.lat}
      AND lat < ${lookupProperties.lat + 0.5}
      AND status='Active' 
      AND category='${lookupProperties.category}'
      AND year>${lookupProperties.year - 5} 
      AND year<${lookupProperties.year + 5}
  `, callback);
};

// Uncomment to test query and log execution times to file
// async.timesLimit(1, 1,
//   (iterationIndex, callback) => getSuggestedCars(undefined, callback),
//   () => {
//     console.log('All queries complete.');
//   });

module.exports = { getSpecificCar, getSuggestedCars };
