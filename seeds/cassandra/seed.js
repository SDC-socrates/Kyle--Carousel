const cassandra = require('cassandra-driver');
const client = require('./config.js')


// ========================================================
// SPECIFIC CONFIGS (See seed-helpers for general configs)
// ========================================================

const loadBatchSize = 10;
const totalBatches = 10;

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
for (let batch = 1; batch <= totalBatches; batch++) {
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

  client.batch(queries, queryOptions, (err) => {
    if (err) { console.log(err); }
    console.log('Data updated on cluster');
  });
}
