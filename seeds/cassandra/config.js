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


module.exports = client;
