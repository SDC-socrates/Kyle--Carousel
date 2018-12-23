// /// <reference types="aws-sdk" />
// const S3 = require('aws-sdk/clients/s3');
const mongodb = require("mongodb");
const client = mongodb.MongoClient;
const assert = require("assert");
const url = "mongodb://localhost:27017";
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 3005;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", express.static("client/public"));
app.listen(port, () =>
  console.log(`Server connected and listening on ${port}!`)
);
// console.log(db);

app.get("/:id", function(req, res) {
  var cars = [];
  client.connect(
    url,
    function(err, client) {
      var db = client.db("TuRash");
      var collection = db.collection("testData");
      console.log(req.params.id);
      var query = { id: Number(req.params.id) };

      var cursor = collection
        .find({ id: Number(req.params.id) })
        .project({ Key: 1, _id: 0, id: 1 });

      cursor.forEach(
        function(doc, err) {
          assert.equal(null, err);
          cars.push(doc);
        },
        function(err) {
          client.close();
          res.json(cars);
        }
      );
    }
  );
});
