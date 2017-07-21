var request = require('request');
var zlib = require('zlib');
var AWS = require('aws-sdk');

var sns = new AWS.SNS({
  region: 'us-east-1'
});


var hosts = { 
  "edition.cnn.com": true,
  "cnnespanol.cnn.com": true,
  "www.bloomberg.com": true,
  "www.cbsnews.com": true,
  "www.nytimes.com": true,
  "www.ntn24.com": true,
  "www.elcolombiano.com": true,
  "www.eltiempo.com": true,
  "www.semana.com": true,
  "www.aljazeera.com": true
};

exports.handler = function(event, context, callback) {
// console.log('Received event:', JSON.stringify(event, null, 4));
 
    var url = event.Records[0].Sns.Message;

    request(url, (error, response, body) => {
      if (error) {
        console.log(`URL ${url} couldnt be crawled: ${error}`)
      } else {
        var host = response.req._headers.host;
        if (hosts[host]) {
          zlib.deflate(body, (err, buffer) => {
            if (!err) {
              var messageinfo = {
                "url": url,
                "body": buffer.toString('base64'),
                "host": host
              }
              var params = {
                Message: JSON.stringify(messageinfo), /* required */
                Subject: 'STRING_VALUE',
                TopicArn: 'arn:aws:sns:us-east-1:097862902341:publish-body'
              };
              sns.publish(params, (err, data) => {
                  if(err) console.log(err, err.stack);
              });
              
              console.log('Message received from SNS:', url); 
              callback(null, "Success");
            }
          });
        }
      }
  })
};

  



