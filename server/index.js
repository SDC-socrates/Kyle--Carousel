// /// <reference types="aws-sdk" />
// const S3 = require('aws-sdk/clients/s3');
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
