const AWS = require('aws-sdk');
const fs = require('fs');
const fsPromises = fs.promises;

// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'INSERT_AWS_IAM_REGION';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'INSERT_AWS_IAM_IDENTITY_POOL_ID',
});
AWS.config.update({
  accessKeyId: 'INSERT_AWS_IAM_USER_ACCESS_KEY_ID',
  secretAccessKey: 'INSERT_AWS_IAM_USER_SECRET_ACCESS_KEY',
});
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {
    Bucket: 'INSERT_S3_BUCKET_NAME',
  },
});

let fileCount = 0;
let uploadCount = 0;

let promises = [];

// Set rootDir to the directory where download.js downloaded images
const rootDir = 'upload';
// Iterate through rootDir/category/make/model/output/images directory structure
fsPromises.readdir(`./${rootDir}`)
  .then(categories => {
    categories.forEach(category => {
      fsPromises.readdir(`./${rootDir}/${category}`)
        .then(makes => {
          makes.forEach(make => {
            fsPromises.readdir(`./${rootDir}/${category}/${make}`)
              .then(models => {
                models.forEach((model, modelNumber) => {
                  fsPromises.readdir(`./${rootDir}/${category}/${make}/${model}/output/images`)
                    .then(images => {
                      images.forEach((image, imageNumber) => {
                        // Determine the file extension
                        let fileExt = image.split('.').pop();
                        // Only upload the first two images
                        if (imageNumber < 2) {
                          fileCount++;
                          fsPromises.readFile(`./${rootDir}/${category}/${make}/${model}/output/images/${image}`)
                            .then(file => {
                              promises.push(new Promise((resolve, reject) => {
                                s3.upload({
                                  Key: `${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`,
                                  Body: file,
                                  ACL: 'public-read',
                                }, (err, data) => {
                                  uploadCount++;
                                  console.log(`UPLOAD ${uploadCount}: ${category}/${make}/${modelNumber}/${imageNumber}.${fileExt}`);
                                  if (err) {
                                    console.log('Error: ', err);
                                    reject(err);
                                  } else {
                                    resolve(data);
                                    console.log('Success.');
                                  }
                                });
                              }));
                            })
                            .then(() => {
                              // On reaching last file, print a summary success message
                              if (promises.length === fileCount) {
                                Promise.all(promises).then(values => {
                                  console.log(`${values.length} files uploaded successfully.`);
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
