const db = require('../../db/postgres/')
const imageRootURL = 'https://turash-assets.s3.us-west-2.amazonaws.com/';

const getSpecificCar = (carId, callback) => {
  db.getSpecificCar(carId, (err, results) => {
    // Transform data to client expected shape
    const output = {
      id: results[0].id,
      make: `${results[0].make} ${results[0].model} ${results[0].year}`,
      random: [],
    };
    results.forEach(item => output.random.push([`${item.make} ${item.model} ${item.year}`, imageRootURL + item.url]));
    callback(err, output);
  });
};

module.exports = { getSpecificCar };
