import base64
import json
import psycopg2

from secrets import db_conn


def node_create_handler():
    pass


def plugin_create_handler():
    pass


def node_update_handler(config):
    """Store the latest configuration for some node. Requires that a
    node_configuration table exists in postgres.

    :param config: (dict) node configuration"""

    node_id = config["nodeId"] + "_" + config["version"]
    config = json.dumps(config)

    conn = psycopg2.connect(db_conn)

    with conn.cursor() as cursor:
        try:
            cursor.execute("select 'public.node__configurations'::regclass")
        except psycopg2.InternalError:
            conn.rollback()

        query = "insert into node__configurations (id, config) values ('{}', '{}')"
        query = query.format(node_id, config)

        try:
            cursor.execute(query)
        except psycopg2.IntegrityError:
            conn.rollback()
            query = "update node__configurations set config = '{}' where id = '{}'"
            query = query.format(config, node_id)
            cursor.execute(query)

        print query

    conn.commit()
    conn.close()


event_handlers = {
    "nodeUpdate": node_update_handler,
    "nodeCreate": node_create_handler,
    "pluginCreate": plugin_create_handler,
}


def metadata_stream_handler(event, context):
    """Process AOT metadata events and perform corresponding work. The type of
    work done is specified by "metadataType". There are currently 3 types of
    metadata events that can occur:

    Events
    ===========================================================================
    nodeUpdate:  Changes to process by which we generate and interpret raw data
    nodeCreate:  Addition of a new node
    pluginCreate:  Development of a new node dependant third-party plugin

    :param event: (dict) Kinesis event with base 64 encoded data
    :param context: (?) ???
    :returns: (str) Success message"""

    for record in event['Records']:
        metadata_event = json.loads(base64.b64decode(record['kinesis']['data']))
        for event_type, event_value in metadata_event.items():
            event_handlers[event_type](event_value)

