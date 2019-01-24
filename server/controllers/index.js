const db = require('../../db/postgres/')
const imageRootURL = 'https://turash-assets.s3.us-west-2.amazonaws.com/';

const getSpecificCar = (carId, callback) => {
  // console.timeEnd('Server to controller');
  // console.time('Controller to DB request');
  db.getSpecificCar(carId, (err, results) => {
    // console.timeEnd('DB request to response');
    // console.time('Transform response to client shape');
    // Transform data to client expected shape
    // console.log('DB Results: ', results);
    const output = {
      id: results[0].qid,
      make: `${results[0].qmake} ${results[0].qmodel} ${results[0].qyear}`,
      city: results[0].qcity,
      long: results[0].qlong,
      lat: results[0].qlat,
      category: results[0].qcategory,
      year: results[0].qyear,
      images: [],
    };
    results.forEach(item => output.images.push([`${item.qmake} ${item.qmodel} ${item.qyear}`, imageRootURL + item.qurl]));
    // console.timeEnd('Transform response to client shape');
    // console.time('Pass client data to respond');
    callback(err, output);
  });
};

const postSpecificCar = (carId, carProperties, callback) => {
  db.postSpecificCar(carId, carProperties, callback);
};

const putSpecificCar = (carId, carProperties, callback) => {
  const output = {
    successes: [],
    errors: [],
  };
  // Delete the specified car
  db.deleteSpecificCar(carId, (errDelete, resultsDelete) => {
    if (errDelete) {
      output.errors.push(errDelete);
    } else {
      output.successes.push(resultsDelete);
      // Then, insert a new car with the provided info
      db.postSpecificCar(carId, carProperties, (errPost, resultsPost) => {
        if (errPost) {
          output.errors.push(errPost);
        } else {
          output.successes.push(resultsPost);
          if (output.errors.length > 0) {
            callback(output, null);
          } else {
            callback(null, output);
          }
        }
      });
    }
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
        long: car.long,
        lat: car.lat,
        thumb: imageRootURL + car.url
      };
    }
//    console.log('RESULTS', Object.values(suggestedCars));
    callback(err, Object.values(suggestedCars));
  });
};

module.exports = { getSpecificCar, postSpecificCar, putSpecificCar, deleteSpecificCar, getSuggestedCars };
