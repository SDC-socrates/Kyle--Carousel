const cassandra = require('cassandra-driver');
const client = require('../../db/cassandra/config.js')


// Create 'carsByStatusAndCategory' Table
// Purpose: Get similar cars given some attributes of an existing car 
const queryCreateCBSC = `
  CREATE TABLE IF NOT EXISTS carsByStatusAndCategory (  
    car_id int,
    status text,
    category text,
    make text,
    model text,
    year int,
    lat float,
    long float,
    photos set<text>,
    PRIMARY KEY (category, status, year, car_id)
  ) WITH CLUSTERING ORDER BY (status ASC, year DESC, car_id DESC)
  `;
const createTable = client.execute(queryCreateCBSC)
  .then((result) => {
    console.log(result);
    // Create 'carsByStatusAndCategory' Materialized View
    // Purpose: Given a car id number, get enough attributes to find full info from the other table
    const queryCreateCars = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS cars AS
        SELECT car_id FROM carsByStatusAndCategory
        WHERE status IS NOT NULL AND year IS NOT NULL AND car_id IS NOT NULL
        PRIMARY KEY (car_id, category, status, year)
        WITH CLUSTERING ORDER BY (car_id DESC)
      `;
    client.execute(queryCreateCars)
      .then(secondResult => console.log(secondResult));
  });

module.exports = createTable;
