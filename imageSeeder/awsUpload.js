const AWS = require('aws-sdk');
const fs = require('fs');
const fsPromises = fs.promises;
const env = require('../.env');

// Initialize the Amazon Cognito credentials provider
AWS.config.region = env.awsRegion;
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: env.awsIdentityPool,
});
AWS.config.update({
  accessKeyId: env.awsAccessId,
  secretAccessKey: env.awsAccessKey,
});
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {
    Bucket: env.awsS3Bucket,
  },
});

const bucketRoot = 'https://turash-assets.s3.us-west-2.amazonaws.com';
let fileCount = 0;
let s3Count = 0;
let s3Uploads = 0;

let promises = [];

// TODO: Refactor to use promises correctly without nesting
// Set rootDir to the directory where download.js downloaded images
const rootDir = 'upload';
// Iterate through rootDir/category/make/model/output/images directory structure
fsPromises.readdir(`./${rootDir}`)
  .then((categories) => {
    categories.forEach((category) => {
      fsPromises.readdir(`./${rootDir}/${category}`)
        .then((makes) => {
          makes.forEach((make) => {
            fsPromises.readdir(`./${rootDir}/${category}/${make}`)
              .then((models) => {
                models.forEach((model, modelNumber) => {
                  fsPromises.readdir(`./${rootDir}/${category}/${make}/${model}/output/images`)
                    .then((images) => {
                      images.forEach((image, imageNumber) => {
                        // Determine the file extension
                        const fileExt = image.split('.').pop();
                        if (fileExt !== 'DS_Store') {
                          fileCount += 1;
                          fsPromises.readFile(`./${rootDir}/${category}/${make}/${model}/output/images/${image}`)
                            .then((file) => {
                              promises.push(new Promise((resolve, reject) => {
                                const params = {
                                  Bucket: env.awsS3Bucket,
                                  Key: `${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`
                                };
                                s3.headObject(params, (err, data) => {
                                  console.log(`Reviewing file ${s3Count}: ${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`);
                                  if (err) {
                                    console.log('File not found on S3. Uploading....');
                                    // If 404 error, the item does not exist and need to be created
                                    s3.upload({
                                      Key: `${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`,
                                      Body: file,
                                      ACL: 'public-read',
                                    }, (uploadErr, uploadData) => {
                                      s3Count += 1;
                                      s3Uploads += 1;
                                      if (uploadErr) {
                                        console.log('Upload ERROR: ', uploadErr);
                                        reject(uploadErr);
                                      } else {
                                        resolve(uploadData);
                                        console.log('File uploaded success.');
                                      }
                                    });
                                  } else {
                                    // Otherwise, if no 404, the item already exists and does not need to be created
                                    s3Count += 1;
                                    console.log(`File skipped as already exists: ${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`)
                                    resolve({
                                      Bucket: env.awsS3Bucket,
                                      ETag: data.ETag,
                                      Key: `${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`,
                                      Location: `${bucketRoot}/${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`,
                                      key: `${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`,
                                    });
                                  }
                                });
                              }));
                            })
                            .then(() => {
                              // On reaching last file, print a summary success message
                              if (promises.length === fileCount) {
                                Promise.all(promises).then((values) => {
                                  console.log(`${s3Uploads} files uploaded. ${s3Count - s3Uploads} files skipped as already exists.`);
                                  fsPromises.writeFile('./uploads.json', JSON.stringify(values))
                                    .then(console.log('Results written to uploads.json.'));
                                });
                              }
                            });
                        }
                      });
                    });
                });
              });
          });
        });
    });
  });
