/**
 * Convert json objects into CSV rows which can be inserted into redshift.
 * http://docs.aws.amazon.com/firehose/latest/dev/data-transformation.html
 * @return {Object}
 */   
function transform(record) {
    var decodedData = new Buffer(record.data, 'base64').toString('utf8');
    var data = JSON.parse(decodedData);
    data.data = JSON.stringify(data.data);

    var row = `${data.node_id},${data.datetime},${data.meta_id},`;
    row += `${data.sensor},'${data.data}'\n`; 
    row = row.replace(/"/g, '""');
    row = row.replace(/'/g, '"');
    
    console.log(row);
    const payload = (new Buffer(row, 'utf8')).toString('base64');
    
    return {
        recordId: record.recordId,
        result: 'Ok',
        data: payload,
    };
}


/**
 * Implementation of required handler for an incoming batch of firehose records.
 */
function handler(event, context, callback) {
    var output = event.records.map(transform);
    callback(null, { records: output });
}


exports.handler = handler;
