const client = require('./config.js');

const execute = (queryString) => {
  client.execute(queryString, [], { prepare: true, traceQuery: true })
    .then((result) => {
      const { traceId } = result.info;
      client.metadata.getTrace(traceId, (err, trace) => {
        console.log(`${queryString} | Execution time: ${trace.duration / 1000}ms | Result: `, result.columns);
      });
    });
};
// Get car details given a specific car id

execute(`SELECT * FROM cars WHERE car_id = 9999999;`);

// Get suggested cars given a category, status, year, lat and long

execute(`
  SELECT * 
    FROM carsstatcatlat 
    WHERE category = 'crossover' 
      AND status = 'Active' 
      AND lat > 35
      AND lat < 35.5
      AND year > 2000 
      AND year < 2010
      AND long > 28
      AND long < 28.5
      ALLOW FILTERING;
  `);
