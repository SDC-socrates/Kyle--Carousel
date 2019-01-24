/* eslint-disable no-console */
const nr = require('newrelic');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const url = require('url');
const cluster = require('cluster');
const path = require('path');
const numCPUs = require('os').cpus().length;
const controllers = require('./controllers');
const app = express();
const port = process.env.PORT || 3004;

let timeReqStartToResp;

// For debugging purposes
app.use((req, res, next) => {
  timeReqStartToResp = process.hrtime();
  console.log('NEW REQUEST RECEIVED:', req.method, req.path);
  next();
});

// ========================================================
// SERVE STATIC FILES
// ========================================================

app.use('/', express.static('./client/public/'));
app.use(/\/\d+\//, express.static('./client/public/'));


// ========================================================
// SETUP LISTENING & CLUSTERING
// ========================================================

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  app.listen(port, () => console.log(`Server connected and listening on ${port}!`));

  console.log(`Worker ${process.pid} started`);
}


// ========================================================
// ROUTES
// ========================================================

const sendErrOrResults = (res, err, results) => {
  if (err) {
    console.log(err);
    res.status(400).send(JSON.stringify(err));
  } else {
    console.info(`timeReqStartToResp: ${process.hrtime(timeReqStartToResp)[1]/1000000} ms`);
    res.send(JSON.stringify(results));
  }
};

app.get(/\/api\/cars\/\d+/, (req, res) => {
  const carId = req.path.split('/').pop();
  controllers.getSpecificCar(carId, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});

app.post(/\/api\/cars\/\d+/, (req, res) => {
  const carId = req.path.split('/').pop();
  controllers.postSpecificCar(carId, req.body, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});

app.put(/\/api\/cars\/\d+/, (req, res) => {
  const carId = req.path.split('/').pop();
  controllers.putSpecificCar(carId, req.body, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});

app.delete(/\/api\/cars\/\d+/, (req, res) => {
  const carId = req.path.split('/').pop();
  controllers.deleteSpecificCar(carId, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});

app.get('/api/cars', (req, res) => {
  const requestedProperties = url.parse(req.url, true).query;
  requestedProperties.long = Number.parseFloat(requestedProperties.long, 10);
  requestedProperties.lat = Number.parseFloat(requestedProperties.lat, 10);
  requestedProperties.year = Number.parseInt(requestedProperties.year, 10);
  controllers.getSuggestedCars(requestedProperties, (err, results) => {
    sendErrOrResults(res, err, results);
  });
});
