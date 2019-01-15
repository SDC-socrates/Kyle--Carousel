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
  SELECT makes.name, models.name, models.year, photos.url 
    FROM cars, models, makes, categories, "carsPhotos", photos 
    WHERE cars.long > 25
      AND cars.long < 25.5
      AND cars.lat > 38
      AND cars.lat < 38.5
      AND cars.status='Active' 
      AND categories.name='crossover'
      AND (models.year>2010 OR models.year<2019)
      AND cars."modelId"=models.id 
      AND models."makeId"=makes.id 
      AND models."categoryId"=categories.id 
      AND "carsPhotos"."carId"=cars.id 
      AND photos.id="carsPhotos"."photoId"
`);
