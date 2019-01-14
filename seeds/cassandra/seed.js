/* eslint-disable no-loop-func */
const cassandra = require('cassandra-driver');
const client = require('../../db/cassandra/config.js')
const createTables = require('./createTables.js');
const seedHelpers = require('../seedHelpers.js');


// ========================================================
// SPECIFIC CONFIGS (See seed-helpers for general configs)
// ========================================================

const loadBatchSize = 17550;
const totalBatches = Object.keys(seedHelpers.carModels).length;


// ========================================================
// SEED
// ========================================================

// Define a container for batch query statement
let queries = [];

// Define a template for each query in the batch query statement
const queryTemplate = {
  query: `
    INSERT INTO cars 
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

  // Iterate through car models. For each, generate a batch of data and load into DB
  Object.keys(seedHelpers.carModels).forEach((makeModel, batch) => {
    // Use promises to kick off next DB operation only after the last one has resolved
    seedHelpers.promises.push(new Promise((resolve, reject) => {
      seedHelpers.promises[batch].then(() => {
        // Clear the batch query statement
        queries = [];
        // Fill the batch query statement with queries
        for (let queryCount = 1; queryCount <= loadBatchSize; queryCount++) {
          const query = { ...queryTemplate };
          query.params = [
            carId,
            seedHelpers.randomStatus(),
            seedHelpers.carModels[makeModel].category,
            seedHelpers.carModels[makeModel].make,
            seedHelpers.carModels[makeModel].model,
            seedHelpers.randomYear(),
            seedHelpers.randomLat(),
            seedHelpers.randomLong(),
            seedHelpers.carModels[makeModel].photos,
          ];
          if (seedHelpers.carModels[makeModel].photos.length > 0) {
            queries.push(query);
          }
          carId += 1;
        }
        // Set consistency to 'any' for lowest latency
        const queryOptions = { prepare: true, consistency: cassandra.types.consistencies.any };
        console.log(`Loading cars to DB. Batch size ${loadBatchSize}. Batch ${batch + 1}/${totalBatches}.`)
        console.log(`query array length : ${queries.length}`);
        client.batch(queries, queryOptions, (err) => {
          if (err) { console.log(err); }
          // Log key info about the seed operation
          const timeNow = Date.now();
          const minutesElasped = ((timeNow - timeStart) / 60000).toFixed(2);
          const averageTimePerBatch = ((timeNow - timeStart) / 1000 / batch).toFixed(2);
          const estimatedTimeRemaining = ((totalBatches - (batch + 1)) * averageTimePerBatch / 60).toFixed(2);
          console.log(`Data updated on cluster. ${minutesElasped}m elasped. ${averageTimePerBatch}s/batch. ~${estimatedTimeRemaining}m remaining.`);
          resolve('Done');
        });
      });
    }));
  });


  // Log when all seeding is done
  Promise.all(seedHelpers.promises)
    .then(() => {
      console.timeEnd('Completed full seeding'); 
    });
});
