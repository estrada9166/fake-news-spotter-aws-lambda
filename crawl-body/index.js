var AWS = require('aws-sdk');
var htmlparser  = require('htmlparser2');
var zlib = require('zlib');

var sns = new AWS.SNS({
  region: 'us-east-1'
});

var getUrls = function(body, host, callback) {
  var parser = new htmlparser.Parser({
    onopentag(name, attribs) {
      if (name === "a") {
        let url = attribs.href;
        if (url && (url.startsWith("http") || url.startsWith("https") || url.startsWith("/"))) {
          if (url.startsWith("/")) {
            url = 'http://' + host + url;
          }
          var params = {
            Message: url, /* required */
            Subject: 'STRING_VALUE',
            TopicArn: ''
          };
          sns.publish(params, (err, data) => {
            if(err) console.log(err, err.stack);
            console.log('Message received from SNS:', url); 
            callback(null, "Success"); 
          });
        }
      }
    }
  }, { decodeEntities: true })
  parser.write(body);
  parser.end();
}

exports.handler = function(event, context, callback) {
// console.log('Received event:', JSON.stringify(event, null, 4));
 
    var message = event.Records[0].Sns.Message;
    var newMessage = JSON.parse(message)
    var buffer = Buffer.from(newMessage.body, 'base64');
    zlib.unzip(buffer, (err, buffer) => {
      if (!err) {
        var body = buffer.toString();
        getUrls(body, newMessage.host, callback);
      }
    })
};
