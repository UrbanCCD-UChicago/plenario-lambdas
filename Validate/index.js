var aws = require('aws-sdk');
var kinesis = new aws.Kinesis();
var firehose = new aws.Firehose();


var expect = ['network', 'meta_id', 'node_id', 'sensor', 'data', 'datetime'];


/**
 * Extract the base64 data encoded in the kinesis record to an object. 
 * @return {Object}
 */
function decode(record) {
    var data = new Buffer(record.kinesis.data, 'base64').toString();
    try {
        return JSON.parse(data);
    } catch (SyntaxError) {
        return {};
    }
}


/**
 * Leaving it in causes an error when submitting to a firehose stream.
 * @return {Object}
 */ 
function deletePartitionKey(record) {
    delete record.PartitionKey;
    return record;
}


/**
 * Determine if the candidate observation is formatted in the way we specified.
 * @return {bool}
 */ 
function validate(record) {
    var result = true;
    expect.forEach((key) => {
        if (!record.hasOwnProperty(key)) result = false;
    });
    return result;
}


/**
 * Format an object so that can be submitted to kinesis.
 * @return {Object}
 */
function format(record) {
    record.node = record.node_id;
    delete record.node_id;
    record.sensor = record.sensor.toLowerCase();
    record.datetime = record.datetime.replace("T", " ");
    console.log(record);
    return {
      Data: JSON.stringify(record),
      PartitionKey: 'arbitrary'
    };
}


/**
 * Submit a batch of records to a kinesis stream.
 * http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Kinesis.html#putRecords-property
 */
function putKinesisRecords(stream, records) {
    if (records.length === 0) return;
    var params = {Records: records, StreamName: stream};
    kinesis.putRecords(params, function(err, data) {
      if (err) throw err;
    });
}


/**
 * Submit a batch of records to a firehose stream.
 * http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Firehose.html#putRecordBatch-property
 */
function putFirehoseRecords(stream, records) {
    if (records.length === 0) return;
    var params = {Records: records, DeliveryStreamName: stream};
    firehose.putRecordBatch(params, function(err, data) {
      if (err) throw err;
    });
}


/**
 * Implementation of required handler for an incoming batch of kinesis records.
 * http://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example-deployment-pkg.html#with-kinesis-example-deployment-pkg-nodejs
 */
function handler(event, context, callback) {
    var decodedRecords = event.Records.map(decode);
    var validRecords = decodedRecords.filter(validate);
    var formattedRecords = validRecords.map(format);
    console.log(formattedRecords);
    
    putKinesisRecords('PublicationStream', formattedRecords);
    putFirehoseRecords('DatabaseStream', formattedRecords.map(deletePartitionKey));
    
    console.log(formattedRecords.length);
    callback(null, formattedRecords.length);
}


exports.handler = handler;
