const client = require('./config.js');
const async = require('async');
const fs = require('fs');


const execute = (queryString, callback) => {
  client.execute(queryString, [], { prepare: true, traceQuery: true })
    .then((result) => {
      const { traceId } = result.info;
      let executionTime;
      client.metadata.getTrace(traceId, (err, trace) => {
        executionTime = trace.duration / 1000;
        console.log(`${queryString} | Execution time: ${executionTime}ms | Result: `, result.rows);
        callback(executionTime);
      });
    });
};

// Get car details given a specific car id
const getCar = (callback) => {
  const randomCar = Math.round(Math.random() * 10000000);
  execute(`SELECT * FROM cars WHERE car_id = ${randomCar};`, callback);
};

// Get suggested cars given a category, status, year, lat and long
const getSuggestedCars = (callback) => {
  const randomLong = Math.round(Math.random() * 170.1 - 85.05); // Rotated due to error in seeding script
  const randomLat = Math.round(Math.random() * 360 - 180); // Rotated due to error in seeding script
  const randomYearRangeStart = 2005 + Math.round(Math.random() * 9);
  const categories = ['suv', 'convertible', 'hatchback', 'pickup', 'crossover', 'sports', 'electric', 'muscle']; // omitted van due to seeding error
  const randomCategory = categories[Math.round(Math.random() * 7)];  
  execute(`
  SELECT * 
    FROM carsstatcatlat 
    WHERE category = '${randomCategory}'
      AND status = 'Active' 
      AND lat > ${randomLat}
      AND lat < ${randomLat + 5}
      AND year > ${randomYearRangeStart - 5} 
      AND year < ${randomYearRangeStart + 5}
      AND long > ${randomLong}
      AND long < ${randomLong + 5}
      LIMIT 18
      ALLOW FILTERING;
  `, callback);
};

// Uncomment to test query and log execution times to file
// let queryTimesSpecificCar = '';
// let queryTimesSuggestedCars = '';
// async.timesLimit(2, 1,
//   (iterationIndex, callback) => getCar((executionTime) => {
//     queryTimesSpecificCar += `${executionTime}\n`;
//     callback(null, null);
//   }),
//   () => {
//     async.timesLimit(0, 1,
//       (iterationIndex, callback) => getSuggestedCars((executionTime) => {
//         queryTimesSuggestedCars += `${executionTime}\n`;
//         callback(null, null);
//       }),
//       () => {
//         fs.writeFileSync('./queryTimesSuggestedCars.csv', queryTimesSuggestedCars);
//         fs.writeFileSync('./queryTimesSpecificCars.csv', queryTimesSpecificCar);
//       });
//   });
