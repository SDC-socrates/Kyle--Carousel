const cassandra = require('cassandra-driver');
const client = require('./config.js')


// ========================================================
// SPECIFIC CONFIGS (See seed-helpers for general configs)
// ========================================================




// ========================================================
// SEED
// ========================================================

// Use Prepared Statements and Batch Statements
const query = {
  query: `
    INSERT INTO carsByStatusAndCategory 
      (car_id, status, category, make, model, year, lat, long, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  params: []
};

let queries = []
let params = [12, 'status', 'category', 'make', 'model', 2015, 10.25, -53.1, ['test1', 'test2']];

// Consistency set to 'any' for lowest latency
const queryOptions = { prepare: true, consistency: cassandra.types.consistencies.any };

query.params = params;
queries.push(query);

client.batch(queries, queryOptions, (err) => {
  if (err) { console.log(err); }
  console.log('Data updated on cluster');
});
