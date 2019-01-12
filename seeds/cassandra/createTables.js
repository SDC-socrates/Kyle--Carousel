const cassandra = require('cassandra-driver');
const client = require('./config.js')


// Create 'carsByStatusAndCategory' Table
let query = `
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
const createTable = client.execute(query)
  .then(result => console.log(result));

module.exports = createTable;
