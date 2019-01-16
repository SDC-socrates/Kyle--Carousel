/* eslint-disable no-console */
const mongodb = require('mongodb');
const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const controllers = require('./controllers')
const app = express();
const url = 'mongodb://localhost:27017'; // DELETE ME
const client = mongodb.MongoClient;
const port = process.env.PORT || 3004;
app.use('/', express.static('./client/public/'));
app.use(/\/\d+\//, express.static('./client/public/'));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use('/', express.static('client/public'));
app.listen(port, () => console.log(`Server connected and listening on ${port}!`));

app.get('/api/cars/:id', (req, res) => {
  controllers.getSpecificCar(req.params.id, (err, results) => {
    if (err) {
      console.log(err);
      res.status(400).send(results);
    } else {
      console.log(results);
      res.send(results);
    }
  });
});

app.get(`/api/cars/similar`, (req, res) => {
  const make = [];
  console.log('MAKE', req.body);
  client.connect(
    url,
    (err, client) => {
      const db = client.db('TuRash');
      const collection = db.collection('testData');
      const query = [
        {
          $match: {
            make: req.body.make
          }
        },
        {
          $match: {
            thumb: {
              $type: 'string'
            }
          }
        },
        {
          $sample: {
            size: req.body.limit
          }
        }
      ];
      const cursor = collection.aggregate(query);
      cursor.forEach(
        (doc, err) => {
          assert.equal(null, err);
          console.log('DOC', doc);
          make.push(doc);
        },
        err => {
          client.close();
          res.json(make);
        }
      );
    }
  );
  console.log(make);
});
