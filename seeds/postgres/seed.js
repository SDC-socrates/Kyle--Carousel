const Sequelize = require('sequelize');
const sequelize = require('./config');
const downloadedModels = require('../../imageSeeder/models.js');
const fs = require('fs');
const fsPromises = fs.promises;

const dropExistingTables = true;
const latestModelYear = 2019;
const oldestModelYear = 2000;
const promisesCatMake = [];
const promisesModelLoaded = [];
const modelLoadStarted = new Promise((resolve, reject) => {
  promisesModelLoaded.push({ resolve, reject });
});


// ============================
// HELPER FUNCTIONS
// ============================

// Returns a Promise that resolves to the found category
const getCategoryIdFromName = (name) => {
  return Category.findOne({
    where: { name }
  });
};

// Returns a Promise that resolves to the found make
const getMakeIdFromName = (name) => {
  return Make.findOne({
    where: { name }
  });
};

// ============================
// CATEGORIES
// ============================

// Define schema for Categories in DB
const Category = sequelize.define('category', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

// Identify categories from downloadedModels object
const categories = Object.keys(downloadedModels);

// Create bulk upload compatabile data object
const categoriesToDB = [];
categories.forEach((category) => {
  categoriesToDB.push({name: category});
});

// Write categories to DB
promisesCatMake.push(
  Category.sync({ force: dropExistingTables })
    .then(() => {
      promisesCatMake.push(Category.bulkCreate(categoriesToDB));
    }),
);

// ============================
// MAKES
// ============================

// Define schema for Makes in DB
const Make = sequelize.define('make', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

// Identify makes from models
const makes = new Set();
categories.forEach((category) => {
  downloadedModels[category].forEach((model) => {
    makes.add(model.split(' ')[0]);
  });
});

// Create bulk upload compatabile data object
const makesToDB = [];
makes.forEach((make) => {
  makesToDB.push({ name: make });
});

// Write makes to DB
promisesCatMake.push(
  Make.sync({ force: dropExistingTables })
    .then(() => {
      promisesCatMake.push(Make.bulkCreate(makesToDB));
    }),
);

// ============================
// MODELS
// ============================


// Define schema for Models in DB
const Model = sequelize.define('model', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  year: {
    type: Sequelize.INTEGER,
  },
}, {
  createdAt: false,
  updatedAt: false,
});

Model.belongsTo(Make);
Make.hasMany(Model);
Model.belongsTo(Category);
Category.hasMany(Model);

// Create bulk upload compatabile data object and load to DB
const modelsToDB = [];
Promise.all(promisesCatMake)
  .then(() => {
    const file = fs.readFileSync('../../imageSeeder/uploads.json');
    const images = JSON.parse(file.toString()).map((item) => {
      return item.key;
    });
    images.forEach((image, index) => {
      // image string format: 'category/Make/modelNumber/imageNumber.jpg'
      // e.g. 'crossover/Dodge/2/0.jpg'
      if (image) {
        const category = image.split('/')[0];
        const make = image.split('/')[1];
        promisesModelLoaded.push(
          getCategoryIdFromName(category)
            .then(results => results.dataValues.id)
            .then((categoryId) => {
              promisesModelLoaded.push(
                getMakeIdFromName(make)
                  .then(results => results.dataValues.id)
                  .then((makeId) => {
                    const modelToDB = {
                      // name: first two letters of category - modelNumber
                      name: `${image.split('/')[0].slice(0,2).toUpperCase()}-${image.split('/')[2]}`,
                      // year: random year between oldest and latest
                      year: oldestModelYear
                        + Math.round((Math.random() * (latestModelYear - oldestModelYear))),
                      makeId,
                      categoryId,
                    };
                    modelsToDB.push(modelToDB);
                    promisesModelLoaded[0].resolve('DONE');
                  })
              );
            })
        );
      }
    });
    })

// Write Models to DB
modelLoadStarted.then(() => {
  Promise.all(promisesModelLoaded)
    .then(() => {
      Model.sync({ force: dropExistingTables })
        .then(() => {
          Model.bulkCreate(modelsToDB);
        });
    });
});




// 1) Create random models
  // For each unique model in s3
    // Generate a random name and year

// 2) Create random cars
  // image dir: category/make/modelNumber

// 3) Create random carsPhotos
