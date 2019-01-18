/* eslint-disable no-console */
require('newrelic');
const mongodb = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const url = require('url');
const controllers = require('./controllers');
const app = express();
const port = process.env.PORT || 3004;

// For debugging purposes
app.use((req, res, next) => {
  console.log('NEW REQUEST RECEIVED:', req.method, req.path);
  next();
});

app.use('/', express.static('./client/public/'));
app.use(/\/\d+\//, express.static('./client/public/'));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use('/', express.static('client/public'));
app.listen(port, () => console.log(`Server connected and listening on ${port}!`));

const sendErrOrResults = (res, err, results) => {
  if (err) {
    console.log(err);
    res.status(400).send(JSON.stringify(err));
  } else {
    console.log(results);
    res.send(JSON.stringify(results));
  }
};

app.get(/\/api\/cars\/\d+/, (req, res) => {
  console.log('GET specific car.')
  const carId = req.path.split('/').pop();
  controllers.getSpecificCar(carId, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});

app.post(/\/api\/cars\/\d+/, (req, res) => {
  console.log('POST specific car:', req.body);
  const carId = req.path.split('/').pop();
  controllers.postSpecificCar(carId, req.body, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});

app.put(/\/api\/cars\/\d+/, (req, res) => {
  console.log('PUT specific car.')
  const carId = req.path.split('/').pop();
  controllers.putSpecificCar(carId, req.body, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});

app.delete(/\/api\/cars\/\d+/, (req, res) => {
  console.log('DELETE specific car.')
  const carId = req.path.split('/').pop();
  controllers.deleteSpecificCar(carId, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});

app.get('/api/cars', (req, res) => {
  console.log('Route triggered for getting suggested cars.')
  const requestedProperties = url.parse(req.url, true).query;
  requestedProperties.long = Number.parseInt(requestedProperties.long, 10);
  requestedProperties.lat = Number.parseInt(requestedProperties.lat, 10);
  requestedProperties.year = Number.parseInt(requestedProperties.year, 10);
  controllers.getSuggestedCars(requestedProperties, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});
