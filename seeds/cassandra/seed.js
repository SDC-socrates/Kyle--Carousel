const cassandra = require('cassandra-driver');
const client = require('./config.js');
const createTables = require('./createTables.js');
const seedHelpers = require('../seedHelpers.js');


// ========================================================
// SPECIFIC CONFIGS (See seed-helpers for general configs)
// ========================================================

const loadBatchSize = 1000;
const totalBatches = 0;


// ========================================================
// SEED
// ========================================================

// Define a container for batch query statement
let queries = [];

// Define a template for each query in the batch query statement
const queryTemplate = {
  query: `
    INSERT INTO carsByStatusAndCategory 
      (car_id, status, category, make, model, year, lat, long, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
};

// Prepare batched queries with prepared statements (per Datastax efficiency recommendations)
// Keep a counter to increment carIds
let carId = 1;
// Track time for console logging
let timeStart = Date.now();
// After table has been created
createTables.then(() => {
  // Track time for console logging
  console.time('Completed full seeding');

  for (let batch = 1; batch <= totalBatches; batch++) {
    // Use promises to kick off next DB operation only after the last one has resolved
    seedHelpers.promises.push( new Promise((resolve, reject) => {
    seedHelpers.promises[batch - 1].then(() => {
      // Clear the batch query statement
      queries = [];
      // Fill the batch query statement with queries
      for (let queryCount = 1; queryCount <= loadBatchSize; queryCount++) {
        const query = { ...queryTemplate };
        query.params = [carId, 'status', 'category', 'make', 'model', 2015, 10.25, -53.1, ['test1', 'test2']];
        queries.push(query);
        carId += 1;
      }
      // Set consistency to 'any' for lowest latency
      const queryOptions = { prepare: true, consistency: cassandra.types.consistencies.any };
      console.log(`Loading cars to DB. Batch size ${loadBatchSize}. Batch ${batch}/${totalBatches}.`)
        const promise = client.batch(queries, queryOptions, (err) => {
          if (err) { console.log(err); }
          // Log key info about the seed operation
          let timeNow = Date.now();
          let minutesElasped = ((timeNow - timeStart) / 60000).toFixed(2);
          let averageTimePerBatch = ((timeNow - timeStart) / 1000 / batch).toFixed(2);
          let estimatedTimeRemaining = ((totalBatches - batch) * averageTimePerBatch / 60).toFixed(2);
          console.log(`Data updated on cluster. ${minutesElasped}m elasped. ${averageTimePerBatch}s/batch. ~${estimatedTimeRemaining}m remaining.`);
          resolve('Done');
        });
      })
    }));
  }
  
  // Log when all seeding is done
  Promise.all(seedHelpers.promises)
    .then(() => { 
      console.timeEnd('Completed full seeding'); 
    });
});
