const sequelize = require('./config');
const async = require('async');


const execute = (queryString, callback) => {
  sequelize.query(queryString).spread((results, metadata) => {
    console.log(results);
    callback(null, null);
    return (metadata);
  });
};

// Get car details given a specific car id

const getCar = (requestedId, callback) => {
  let lookupId = requestedId;
  if (requestedId === undefined) {
    lookupId = Math.round(Math.random() * 10000000);
  }
  console.log(lookupId);
  execute(`
  SELECT * FROM carsbycatstatuslong
    WHERE id=${lookupId}
  `, callback);
};

// Get suggested cars given a category, status, year, lat and long
const getSuggestedCars = (callback) => {
  const randomLat = Math.round(Math.random() * 180 - 90);
  const randomLong = Math.round(Math.random() * 360 - 180);
  const randomYearRangeStart = 2000 + Math.round(Math.random() * 9);
  const categories = ['suv', 'convertible', 'hatchback', 'pickup', 'crossover', 'van', 'sports', 'electric', 'muscle'];
  const randomCategory = categories[Math.round(Math.random() * 8)];
  execute(`
  SELECT * FROM carsbycatstatuslong
    WHERE long > ${randomLong}
      AND long < ${randomLong + 0.5}
      AND lat > ${randomLat}
      AND lat < ${randomLat + 0.5}
      AND status='Active' 
      AND category='${randomCategory}'
      AND year>${randomYearRangeStart} 
      AND year<${randomYearRangeStart + 10}
  `, callback);
};

// Uncomment to test query and log execution times to file
async.timesLimit(1, 1,
  (iterationIndex, callback) => getCar(undefined, callback),
  () => {
    console.log('All queries complete.');
  });
