/* eslint-disable no-console */
const mongodb = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const url = require('url');
const controllers = require('./controllers');
const app = express();
const port = process.env.PORT || 3004;
app.use('/', express.static('./client/public/'));
app.use(/\/\d+\//, express.static('./client/public/'));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use('/', express.static('client/public'));
app.listen(port, () => console.log(`Server connected and listening on ${port}!`));

app.get(/\/api\/cars\/\d+/g, (req, res) => {
  console.log('Route triggered for getting specific car.')
  // FIX ME - PULL ID FROM ROUTE
  const carId = req.path.split('/').pop();
  controllers.getSpecificCar(carId, (err, results) => {
    if (err) {
      console.log(err);
      res.status(400).send(results);
    } else {
      console.log(results);
      res.send(results);
    }
  });
});

app.get('/api/cars', (req, res) => {
  console.log('Route triggered for getting suggested cars.')
  const requestedProperties = url.parse(req.url, true).query;
  requestedProperties.long = Number.parseInt(requestedProperties.long, 10);
  requestedProperties.lat = Number.parseInt(requestedProperties.lat, 10);
  requestedProperties.year = Number.parseInt(requestedProperties.year, 10);
  controllers.getSuggestedCars(requestedProperties, (err, results) => {
    if (err) {
      console.log(err);
      res.status(400).send(results);
    } else {
      console.log('all results', results);
      res.send(results);
    }
  });
});
