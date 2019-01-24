const sequelize = require('../../db/postgres/config');
const majorCities = require('../usdmas');

const execute = (queryString, callback) => {
  sequelize.query(queryString)
    .then((result) => {
      callback(null, result[0]);
    })
    .catch((err) => {
      callback(err, null);
    });
};

// Purely to improve project presentation, this function can be used to reorder cars so same models / images will not appear side by side for suggested cars.
majorCities.forEach((city) => {
  const table = `cars_${city.city.toLowerCase()}`;
  execute(`CREATE INDEX ${city.city.toLowerCase()}long on ${table}(long)`, (err, result) => {
    if (err) {console.log(err)} else {
      execute(`CLUSTER ${table} USING ${city.city.toLowerCase()}long`, (err, result) => {
        if (err) {console.log(err)} else {
          console.log('Clustered table:', table);
        }
      });
    }
  });
});
