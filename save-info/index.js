var AWS = require('aws-sdk');
var request = require('request');
var zlib = require('zlib');
var elasticsearch = require('elasticsearch');

var sns = new AWS.SNS({
  region: 'us-east-1'
});

var client = new elasticsearch.Client({
  host: '34.228.32.168:9200',
  log: 'trace'
});


var checkIfExist = function(newMessage, message, callback) {
  client.search({
    index: 'news',
    type: 'indexed',
    body: {
      "query": {
        "filtered": {
          "filter": {
            "bool": {
              "must": [
                {
                  "exists": {
                    "field": "url"
                  }
                },
                {
                  "query": {
                    "match_phrase": {
                      "url": {
                        "query": newMessage.url
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  })
  .then((response) => {
    if (response.hits.total === 0) {
      postNewNews(newMessage, message, callback)
    }    
  })
}

var postNewNews = function(newMessage, message, callback) {
  var buffer = Buffer.from(newMessage.body, 'base64');
  zlib.unzip(buffer, (err, buffer) => {
    if (!err) {
      var body = buffer.toString();
      request({
        method: 'POST',
        uri: 'http://34.228.32.168:9200/news/indexed',
        body: {
          'url': newMessage.url,
          'body': body,
          'host': newMessage.host
        },
        json: true
      }, function(err) {
        if(err) console.log(err)
          var params = {
          Message: message, /* required */
          Subject: 'STRING_VALUE',
          TopicArn: 'arn:aws:sns:us-east-1:097862902341:saved-info'
        };
        sns.publish(params, (err, data) => {
            if(err) console.log(err, err.stack);
        });
        console.log('Message received from SNS:', message); 
        callback(null, "Success");
      });
    }
  });
}

exports.handler = function(event, context, callback) {
// console.log('Received event:', JSON.stringify(event, null, 4));
 
    var message = event.Records[0].Sns.Message;
    var newMessage = JSON.parse(message)

    checkIfExist(newMessage, message, callback)
};



