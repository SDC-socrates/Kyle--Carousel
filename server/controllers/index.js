const db = require('../../db/postgres/')
const imageRootURL = 'https://turash-assets.s3.us-west-2.amazonaws.com/';

const getSpecificCar = (carId, callback) => {
  db.getSpecificCar(carId, (err, results) => {
    // Transform data to client expected shape
    const output = {
      id: results[0].id,
      make: `${results[0].make} ${results[0].model} ${results[0].year}`,
      long: results[0].long,
      lat: results[0].lat,
      category: results[0].category,
      year: results[0].year,
      random: [],
    };
    results.forEach(item => output.random.push([`${item.make} ${item.model} ${item.year}`, imageRootURL + item.url]));
    callback(err, output);
  });
};

const deleteSpecificCar = (carId, callback) => {
  db.deleteSpecificCar(carId, callback);
};

const getSuggestedCars = (requestedProperties, callback) => {
  db.getSuggestedCars(requestedProperties, (err, results) => {
    // Transform data to client expected shape
    const suggestedCars = {};
    for (let i = 0; i < results.length; i += 1) {
      const car = results[i];
      suggestedCars[car.make + car.model + car.year + car.long + car.lat] = {
        id: car.id,
        make: `${car.make} ${car.model} ${car.year}`,
        thumb: imageRootURL + car.url
      };
    }
    callback(err, Object.values(suggestedCars));
  });
};

module.exports = { getSpecificCar, deleteSpecificCar, getSuggestedCars };
