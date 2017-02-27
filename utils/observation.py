import boto3
import datetime
import json


kinesis = boto3.client('kinesis')

payload = {
            'network': 'array_of_things_chicago',
            'meta_id': 0,
            'node_id': 'test',
            'sensor': 'test_sensor',
            'data': {'foo': 'bar'},
            'datetime': str(datetime.datetime.now()),
}

kinesis.put_record(**{
            'StreamName': 'ValidationStream',
            'PartitionKey': 'arbitrary',
            'Data': json.dumps(payload)
})

