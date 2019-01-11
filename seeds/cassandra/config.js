const cassandra = require('cassandra-driver');
const client = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'turashc',
});

// If Keyspace is not setup, go into CQL and run this query:
// CREATE KEYSPACE turashc 
  // WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 };

// Enable verbose logging
client.on('log', (level, className, msg, furtherInfo) => {
  console.log(level, className, msg, furtherInfo);
});

// Connect to DB
client.connect(err => console.log(err));

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
client.execute(query)
  .then(result => console.log(result));

module.exports = client;
