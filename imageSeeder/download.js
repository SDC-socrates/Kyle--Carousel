var scraper = require('google-image-downloader/dist/ImageDownloader');
var fs = require('fs');

// Directory structure
  // carCategory
    // make
      // model and color

// In my DB data gen script:

// upload to S3 with the following stucture
  // carCategory
    // make
      // incrementing number

var colors = ['Silver', 'Red', 'Blue'];

var models = {
  suv: [
    'Acura MDX',
    'Audi Q3 Quattro Sport',
    'Chevrolet Captiva',
    'Chevrolet Equinox',
    'Chevrolet Suburban',
    'Chevy Trailblazer',
    'Chevrolet Trax',
    'Dodge Durango',
    'Dodge Journey',
    'Ford Escape',
    'Ford Everest',
    'Ford Explorer',
    'Ford Territory',
    'GMC Yukon',
    'Honda HR-V',
    'Honda Pilot',
    'Hummer H2',
    'Hyundai Tucson',
    'Jeep Grand Cherokee',
    'Kia Sorento',
    'Kia Sportage',
    'Lexus RX',
    'Mitsubishi Montero Sport',
    'Nissan Patrol',
    'Nissan Murano',
    'Mazda CX-7',
    'Mazda CX-9',
    'Mitsubishi Pajero',
    'Porsche Cayenne',
    'Subaru Outback',
    'Suzuki Grand Vitara',
    'Toyota FJ Cruiser',
    'Toyota Fortuner'
  ],
  convertible: [
    'Bentley Continental GTC',
    'Cadillac XLR',
    'Chevrolet Camaro',
    'Daihatsu Copen',
    'Ferrari California',
    'Fiat 124 Spider',
    'Ford Fairlane 500 Skyliner',
    'Ford Mustang',
    'Mazda MX 5',
    'Mercedes Benz SLK Class',
    'Maserati GranCabrio Sport',
    'Porsche 911 Carrera Cabriolet',
    'Volvo C70'
  ],
  hatchback: [
    'Chevrolet Spark',
    'Ford Fiesta',
    'Ford Focus',
    'Honda Civic',
    'Honda Fit',
    'Hyundai Elantra GT',
    'Hyundai Eon',
    'Hyundai i10',
    'Kia Forte SX',
    'Kia Picanto',
    'Kia Rio',
    'Mazda3 Maxx',
    'Mitsubishi Mirage',
    'Nissan Juke',
    'Suzuki Celerio',
    'Toyota Prius',
    'Toyota Prius C',
    'Toyota Prius Plug in Hybrid',
    'Toyota WIgo',
    'Toyota Yaris'
  ],
  pickup: [
    'Chevrolet Silverado',
    'Chevrolet Tornado',
    'Ford Ranger',
    'Ford F-150',
    'GMC Sierra 1500',
    'Isuzu D-Max',
    'Mitsubishi Strada',
    'Nissan Navara',
    'Nissan Titan',
    'Toyota Hilux'
  ],
  crossover: [
    'Audi Q3',
    'Acura RDX',
    'Acura ZDX',
    'BMW X1',
    'BMW X6',
    'Buick Enclave',
    'Cadillac SRX',
    'Chevrolet Equinox',
    'Chevrolet Trax',
    'Chrysler Pacifica',
    'Dodge Journey',
    'Ford Edge',
    'Ford Ecosport',
    'Ford Explorer',
    'Hyundai Tucson',
    'Jeep Renegade',
    'Honda BR-V',
    'Honda Crosstour',
    'Lexus NX',
    'Mazda CX-3',
    'Mazda CX-9',
    'Mitsubishi Endeavor',
    'Nissan Murano',
    'Nissan X-Trail',
    'Opel Antara',
    'Peugeot 2008',
    'Renault Kadjar',
    'Tata Aria',
    'Toyota Rav4',
    'Saab 9-4X',
    'Subaru Tribeca',
    'Volvo XC60'
  ],
  van: [
    'GMC Safari',
    'Fiat 242',
    'Ford Galaxy',
    'Ford Pronto',
    'Ford Transit',
    'Lancia Voyager',
    'Renault Dokker',
    'SsangYong Istana',
    'Toyota HiAce'
  ],
  sports: [
    'Audi TT',
    'Bentley Continental GT',
    'Buick Reatta',
    'Bugatti EB110',
    'BMW Z8',
    'Chevrolet Camaro',
    'Dodge Challenger',
    'Dodge Viper',
    'Ferrari 458 Italia',
    'Fiat X19',
    'Ford Mustang',
    'Honda Integra',
    'Honda NSX',
    'Hyundai Genesis Coupe',
    'Hyundai Tiburon',
    'Infiniti Emerg E',
    'Isuzu 117 Coupe',
    'Jaguar F-Type',
    'Lamborghini Murcielago',
    'Lexus LFA',
    'Lotus Elise',
    'Marussia B1',
    'Mazda RX 8',
    'Mastretta MXT',
    'McLaren 12C',
    'Nissan 240SX',
    'Opel Tigra',
    'Pontiac GTO',
    'Porsche 997',
    'Renault Wind',
    'Saturn Sky',
    'Toyota 86'
  ],
  electric: [
    'BMW I3',
    'Bollore Bluecar',
    'BYD e6',
    'Buddy Cab',
    'Chery QQ3',
    'Chevrolet Spark EV',
    'Dynasty IT',
    'Ford Focus Electric',
    'GTA MyCar',
    'Honda Fit EV',
    'JAC J3 iEV',
    'Kia Soul EV',
    'Lightning GT',
    'Mahindra e2o',
    'Mia electric',
    'Mini El',
    'Mitsubishi i-MiEV',
    'Nissan Leaf',
    'Renault Fluence Z.E.',
    'Renault Twizy',
    'Renault Zoe',
    'Smart Fortwo',
    'Tesla Model X',
    'Venturi Fetish',
    'Volkswagen e Golf',
  ],
  muscle: [
    'Chevrolet Camaro',
    'Chevrolet Chevelle',
    'Dodge Dart',
    'Dodge Challenger',
    'Dodge Coronet',
    'Dodge Super Bee',
    'Ford Falcon GT',
    'Ford Galaxie',
    'Ford Mustang',
    'Ford Torino',
    'Ford XB Falcon',
    'Mercury Cyclone',
    'Mercury Cyclone Spoiler II',
    'Mercury Comet',
    'Oldsmobile Cutlass',
    'Oldsmobile Hurst',
    'Oldsmobile 4 4 2',
    'Oldsmobile 88',
    'Plymouth Barracuda',
    'Plymouth Fury',
    'Plymouth GTX',
    'Plymouth Superbird',
    'Pontiac Firebird',
    'Pontiac Tempest',
    'Pursuit Special',
    'Rambler Rebel'
  ]
}

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
          var path = `./${category}/${make}/${modelNoSpaces+color}`;
          var search = `${model} 2017 ${color}`;
          if (!fs.existsSync(path)) {
            fs.mkdirSync(path, {recursive: true});
          }
          var downloader = new scraper.ImageDownloader(path);
          console.log(search, path);
          downloader.downloadImages(search, 4);
        }, timer);
      }(category, make, model));

    });
  });
};
