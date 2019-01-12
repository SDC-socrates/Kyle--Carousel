const sequelize = require('./config');

const execute = (queryString) => {
  sequelize.query(queryString).spread((results, metadata) => {
    return (metadata);
  });
};

// Get car details given a specific car id

execute(`SELECT * from cars WHERE cars.id=9999999`); // 13ms
execute(`SELECT * from models WHERE id = 570`); // 17ms
execute(`SELECT * from makes WHERE id = 41`); // 9ms
execute(`SELECT * from categories WHERE id = 7`); // 4ms
execute(`SELECT * from "carsPhotos" WHERE "carsPhotos"."carId"=9999999`); // 3ms
execute(`SELECT * from photos WHERE id=1139 OR id=655`); // 12ms

execute(`
  SELECT * from cars, models, makes, categories, "carsPhotos", photos WHERE cars.id=300 
      AND cars."modelId"=models.id 
      AND models."makeId"=makes.id 
      AND models."categoryId"=categories.id 
      AND "carsPhotos"."carId"=cars.id 
      AND photos.id="carsPhotos"."photoId"
`);




// Get similar cars given a specific car id
