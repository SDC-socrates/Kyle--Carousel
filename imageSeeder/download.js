var scraper = require('google-image-downloader/dist/ImageDownloader');
var fs = require('fs');

// Define car categories and models to search
var models = require('./models.js');

// Define color variants to search
var colors = ['Silver', 'Red', 'Blue'];

// Create directory structure and run scraper based on models and colors 
var timer = -2000;
for (var category in models) {
  models[category].forEach(model => {
    var make = model.split(' ')[0];
    colors.forEach(color => {
      // Spread out search interval to prevent erroring
      timer += 2000;
      // We need to capture the category, make and model in a closure so the original values are available for the function when it is invoked.
      (function(category, make, model) {
        setTimeout(() => {
          var modelNoSpaces = model.replace(/ /g, '');
          var path = `./upload/${category}/${make}/${modelNoSpaces+color}`;
          var search = `${model} 2017 ${color}`;
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, {recursive: true});
          }
          var downloader = new scraper.ImageDownloader(path);
          console.log(search, path);
          // Set the number of images to download for each model/color variant
          downloader.downloadImages(search, 4);
        }, timer);
      }(category, make, model));

    });
  });
};

module.exports = models;
