const http = require('http');
const https = require('https');
const querystring = require('querystring');

const path = require('path')
const AWS = require('aws-sdk')

const S3 = new AWS.S3({
  signatureVersion: 'v4',
})

const Sharp = require('sharp')
const BUCKET = 'SOURCE.BUCKET.NAME'
const QUALITY = 80

exports.handler = async (event, context, callback) => {
  let response = event.Records[0].cf.response
  let request = event.Records[0].cf.request;
  const headers = response.headers
  const request_headers = request.headers
  const originalKey = decodeURI(request_headers.originalkey[0].value)
  const dimensionincluded = request_headers.dimensionincluded[0].value

  // if (path.extname(uri) === '.webp') {
  if (parseInt(response.status) === 404) {

    const { uri } = request

    // Get the query string params
    let params = querystring.parse(request.querystring);

    // read the required path. Ex: uri /images/100x100/webp/image.jpg
    let path = request.uri;

    // read the S3 key from the path variable.
    // Ex: path variable /images/100x100/webp/image.jpg
    let newKey = path.substring(1);

    // Ex: file_name=images/200x200/webp/image_100x100.jpg
    // Getting the image_100x100.webp part alone
    let file_name = path.split('/').slice(-1)[0]

    // get the source image file

    try {
      if (dimensionincluded == "false" || dimensionincluded == false) {
        let requiredFormat = file_name.split('.')[1]

        const bucketResource = await S3.getObject({ Bucket: BUCKET, Key: originalKey }).promise()

        // perform the resize operation

        const sharpImageBuffer = await Sharp(bucketResource.Body)
          .webp({ quality: +QUALITY })
          .toBuffer()

        // save the resized object to S3 bucket with appropriate object key.
        await S3.putObject({
          Body: sharpImageBuffer,
          Bucket: BUCKET,
          ContentType: 'image/webp',
          CacheControl: 'max-age=31536000',
          Key: newKey,
          StorageClass: 'STANDARD'
        }).promise()

        // generate a binary response with resized image
        response.status = 200;
        response.body = sharpImageBuffer.toString('base64');
        response.bodyEncoding = 'base64';
        response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/' + requiredFormat }];
        response.headers['cache-control'] = [{ key: 'Cache-Control', value: 'public, max-age=31536000'}];
        callback(null, response);
      } else {
        // Getting the 100x100.webp part alone
        let dimension = file_name.split('_')[1].split('.')[0]

        let requiredFormat = file_name.split('_')[1].split('.')[1]

        let width = dimension.split('x')[0]

        let height = dimension.split('x')[1]

        const bucketResource = await S3.getObject({ Bucket: BUCKET, Key: originalKey }).promise()

        const sharpImageBuffer = await Sharp(bucketResource.Body)
          .resize(parseInt(width), parseInt(height))
          .webp({ quality: +QUALITY })
          .toBuffer()
        // save the resized object to S3 bucket with appropriate object key.
        await S3.putObject({
          Body: sharpImageBuffer,
          Bucket: BUCKET,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000',
          Key: newKey,
          StorageClass: 'STANDARD'
        }).promise()

        // generate a binary response with resized image
        response.status = 200;
        response.body = sharpImageBuffer.toString('base64');
        response.bodyEncoding = 'base64';
        response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/' + requiredFormat }];
        response.headers['cache-control'] = [{ key: 'Cache-Control', value: 'public, max-age=31536000'}];
        callback(null, response);
      }
    } catch (e) {
      console.log('Origin Response error: ' + e);
    }
  } 
  callback(null, response)
 }