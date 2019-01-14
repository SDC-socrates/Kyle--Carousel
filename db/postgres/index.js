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

// Given a category, status, year, lat and long...
// Get suggested cars given a specific car id (active status, same category, similar year, similar location) <-- actually this can be fed to you!
// Look car by ID including model year and category
// Calculate nearby cars (interesting challenge... needs to calculate distance to every car in DB...)
  // Can calculate subset of long/lat!
  // Maintain a secondary index of longlat?
  // The final distance calculation is most time consuming, so we want to min the values for that
  // First limit by model, year and category. Then limit by long OR lat. Finally calc distance.

  // I think the key is I need to size of the join.
    // Highest specificity is the long/lat?
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

`
CREATE MATERIALIZED VIEW carsbycatstatuslong AS
  SELECT categories.name as category, cars.status, cars.long, cars.lat, makes.name as make, models.name as model, models.year, photos.url 
    FROM cars, models, makes, categories, "carsPhotos", photos 
    WHERE cars."modelId"=models.id 
      AND models."makeId"=makes.id 
      AND models."categoryId"=categories.id 
      AND "carsPhotos"."carId"=cars.id 
      AND photos.id="carsPhotos"."photoId"
    ORDER BY
      categories.name,
      cars.status,
      cars.long

CREATE INDEX catstatuslong ON carsbycatstatuslong (category, status, long);
`

`
  SELECT make, model, year, url 
    FROM carsbycatstatuslong
    WHERE long > 25
      AND long < 25.5
      AND lat > 38
      AND lat < 38.5
      AND status='Active' 
      AND category='crossover'
      AND (year>2010 OR year<2019)
`
