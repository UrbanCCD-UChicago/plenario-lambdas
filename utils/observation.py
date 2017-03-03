import boto3
import datetime
import json


kinesis = boto3.client('kinesis')

payload = {
            'network': 'array_of_things_chicago',
            'meta_id': 3,
            'node_id': '0000001e0610ba72',
            'sensor': 'tmp421',
            'data': {'temperature': 10.0},
            'datetime': str(datetime.datetime.now()),
}

kinesis.put_record(**{
            'StreamName': 'ValidationStream',
            'PartitionKey': 'arbitrary',
            'Data': json.dumps(payload)
})

print(payload)
