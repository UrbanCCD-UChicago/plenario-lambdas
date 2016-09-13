import base64
import boto3
import json
import time
import uuid


# Mock a dummy record batch

payload = {
    "nodeUpdate": {
        "author": "Erlich Bachman",
        "network": "ArrayOfThingsSanFrancisco",
        "nodeId": "ErlicsNode",
        "softwareConfiguration": str(uuid.uuid4()),
        "version": str(uuid.uuid4()),
    },
    "pluginCreate": {
        "author": "Erlich Bachman",
        "name": "DetectSmokersNearMyHouse",
        "nodeId": "ErlicsNode",
        "pluginId": str(uuid.uuid4()),
    },
}

payload = json.dumps(payload)
payload = base64.b64encode(payload)


# Set up a connection to a Kinesis stream

kinesis_client = boto3.client("kinesis")


# Submit the record batch to the stream

if __name__ == "__main__":

    while True:
        print kinesis_client.put_record(
            StreamName="MetadataStream",
            Data=bytes(payload),
            PartitionKey="development",
        )
        time.sleep(10)
