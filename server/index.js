/* eslint-disable no-console */
const mongodb = require('mongodb');
const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const url = 'mongodb://localhost:27017';
const client = mongodb.MongoClient;
const port = process.env.PORT || 3005;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', express.static('client/public'));
app.listen(port, () => console.log(`Server connected and listening on ${port}!`));

app.get('/:id', (req, res) => {
  const cars = [];
  client.connect(
    url,
    // eslint-disable-next-line no-shadow
    (err, client) => {
      const db = client.db('TuRash');
      const collection = db.collection('testData');
      const query = {
        id: Number(req.params.id)
      };

      const cursor = collection
        .find({
          id: Number(req.params.id)
        })
        .project({
          Key: 1,
          _id: 0,
          id: 1
        });

      cursor.forEach(
        // eslint-disable-next-line no-shadow
        (doc, err) => {
          assert.equal(null, err);
          cars.push(doc);
        },
        err => {
          client.close();
          res.json(cars);
        }
      );
    }
  );
});
