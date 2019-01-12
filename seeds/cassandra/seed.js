const cassandra = require('cassandra-driver');
const client = require('./config.js');
const createTables = require('./createTables.js');
const seedHelpers = require('../seedHelpers.js');


// ========================================================
// SPECIFIC CONFIGS (See seed-helpers for general configs)
// ========================================================

const loadBatchSize = 20000;
const totalBatches = 1;


// ========================================================
// SEED
// ========================================================

let queries = [];

const queryTemplate = {
  query: `
    INSERT INTO carsByStatusAndCategory 
      (car_id, status, category, make, model, year, lat, long, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
};

// Prepare batched queries with prepared statements per Datastax efficiency recommendations
let carId = 1;
createTables.then(() => {
  console.time('seed');
  for (let batch = 1; batch <= totalBatches; batch++) {
    seedHelpers.promises.push( new Promise((resolve, reject) => {
    seedHelpers.promises[batch - 1].then(() => {
      // Clear queries
      queries = [];
      for (let queryCount = 1; queryCount <= loadBatchSize; queryCount++) {
        const query = { ...queryTemplate };
        query.params = [carId, 'status', 'category', 'make', 'model', 2015, 10.25, -53.1, ['test1', 'test2']];
        queries.push(query);
        carId += 1;
      }
      // Consistency set to 'any' for lowest latency
      const queryOptions = { prepare: true, consistency: cassandra.types.consistencies.any };
      console.log(`Loading cars to DB. Batch size ${loadBatchSize}. Batch ${batch}/${totalBatches}.`)
        const promise = client.batch(queries, queryOptions, (err) => {
          if (err) { console.log(err); }
          console.log('Data updated on cluster');
          resolve('Done');
        });
      })
    }));
  }
  Promise.all(seedHelpers.promises)
    .then(() => { console.timeEnd('seed'); });
});
