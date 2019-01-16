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
        console.log(`${queryString} | Execution time: ${executionTime}ms | Result: `, result.columns);
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
  const randomLat = Math.round(Math.random() * 180 - 90);
  const randomLong = Math.round(Math.random() * 360 - 180);
  const randomYearRangeStart = 2000 + Math.round(Math.random() * 9);
  const categories = ['suv', 'convertible', 'hatchback', 'pickup', 'crossover', 'van', 'sports', 'electric', 'muscle'];
  const randomCategory = categories[Math.round(Math.random() * 8)];  
  execute(`
  SELECT * 
    FROM carsstatcatlat 
    WHERE category = '${randomCategory}'
      AND status = 'Active' 
      AND lat > ${randomLat}
      AND lat < ${randomLat + 0.5}
      AND year > ${randomYearRangeStart} 
      AND year < ${randomYearRangeStart + 10}
      AND long > ${randomLong}
      AND long < ${randomLong + 0.5}
      ALLOW FILTERING;
  `, callback);
};

let queryTimesSpecificCar = '';
let queryTimesSuggestedCars = '';
async.timesLimit(1000, 1,
  (iterationIndex, callback) => getCar((executionTime) => {
    queryTimesSpecificCar += `${executionTime}\n`;
    callback(null, null);
  }),
  () => {
    async.timesLimit(1000, 1,
      (iterationIndex, callback) => getSuggestedCars((executionTime) => {
        queryTimesSuggestedCars += `${executionTime}\n`;
        callback(null, null);
      }),
      () => {
        fs.writeFileSync('./queryTimesSuggestedCars.csv', queryTimesSuggestedCars);
        fs.writeFileSync('./queryTimesSpecificCars.csv', queryTimesSpecificCar);
      });
  });
