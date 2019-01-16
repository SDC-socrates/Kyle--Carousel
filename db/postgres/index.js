const sequelize = require('./config');

const execute = (queryString) => {
  sequelize.query(queryString).spread((results, metadata) => {
    return (metadata);
  });
};

// Get car details given a specific car id

execute(`
  SELECT * FROM cars, models, makes, categories, "carsPhotos", photos 
    WHERE cars.id=300 
      AND cars."modelId"=models.id 
      AND models."makeId"=makes.id 
      AND models."categoryId"=categories.id 
      AND "carsPhotos"."carId"=cars.id 
      AND photos.id="carsPhotos"."photoId"
`);

// Get suggested cars given a category, status, year, lat and long

  execute(`
  SELECT * FROM carsbycatstatuslong
    WHERE long > 25
      AND long < 25.5
      AND lat > 38
      AND lat < 38.5
      AND status='Active' 
      AND category='crossover'
      AND year>2010 
      AND year<2019
`);
