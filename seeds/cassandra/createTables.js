const cassandra = require('cassandra-driver');
const client = require('../../db/cassandra/config.js')


// Create 'cars' Table
// Purpose: Store and get attributes of a specific car
// category and status are needed in the primary key as we can only add one additional column in MV later on
const queryCreateCars = `
  CREATE TABLE IF NOT EXISTS carsstatcatlat (
    car_id int,
    status text,
    category text,
    make text,
    model text,
    year int,
    lat float,
    long float,
    photos set<text>,
    PRIMARY KEY (category, status, lat, car_id)
  ) WITH CLUSTERING ORDER BY (status DESC);
  `;

const createTable = client.execute(queryCreateCars)
  .then((result) => {
    console.log(result);
    // Create 'queryCreateCars' Materialized View
    // Purpose: Find similar cars. e.g. Select SUVs (compound partition key) that are active (compound partition key) between certain lats (clustering) and years (secondary index), and longs
    const queryCreateCSCL = `
    CREATE MATERIALIZED VIEW IF NOT EXISTS cars AS
      SELECT * FROM carsstatcatlat
      WHERE category IS NOT NULL AND status IS NOT NULL AND lat IS NOT NULL AND car_id IS NOT NULL
      PRIMARY KEY (car_id, category, status, lat)
      WITH CLUSTERING ORDER BY (car_id DESC);
    `;
    return client.execute(queryCreateCSCL);
  })
  .then((secondResult) => {
    console.log(secondResult);
  });

module.exports = createTable;
