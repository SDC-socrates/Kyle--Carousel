const Sequelize = require('sequelize');
const sequelize = require('./config');
const downloadedModels = require('../../imageSeeder/models.js')

// ============================
// CATEGORIES
// ============================

// Identify categories from downloadedModels object
const categories = Object.keys(downloadedModels);

// Write categories to DB
const Category = sequelize.define('category', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
});

var categoriesToDB = [];
categories.forEach(category => {
  categoriesToDB.push({name: category});
});

Category.sync()
  .then(() => {
    Category.bulkCreate(categoriesToDB);
  })


// ============================
// MAKES
// ============================

// Identify makes from models
let makes = new Set();
categories.forEach(category => {
  downloadedModels[category].forEach(model => {
    makes.add(model.split(' ')[0]);
  });
});
console.log(makes);

// Write makes to DB


// ============================
// MODELS
// ============================

// 1) Create random models
  // For each unique model in s3
    // Generate a random name and year

// 2) Create random cars
  // image dir: category/make/modelNumber

// 3) Create random carsPhotos
