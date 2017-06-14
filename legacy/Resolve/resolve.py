from database import postgres_session, redshift_session
from database import redshift_session_context
from models import SensorMeta, FeatureMeta


def resolve():
    """Run resolve sensor for every distinct sensor available in the unknown
    feature table in redshift."""

    rp = redshift_session.execute('select distinct sensor from unknown_feature')
    for row in rp:
        try:
            resolve_sensor(row.sensor)
        except AttributeError as err:
            print('{} {}'.format(row.sensor, err))
    
    return True


def resolve_sensor(sensor):
    """Move values from the staging observation table to the mapped tables. It
    fails on sensors for which the metadata does not exist. If the mapping is
    incorrect the rows will not be moved over at all."""

    sensor = SensorMeta.query.get(sensor)

    for i, feature in enumerate(sensor.features()):
        feature = FeatureMeta.query.get(feature)
        selections = []
        conditions = []
        values = ['node_id, datetime, meta_id, sensor']

        for formal, type_ in feature.types().items():
            try:
                informal = sensor.tree()[feature.name + '.' + formal]
            except KeyError:
                continue

            # Using 'case when' allows us to resolve to null values if a feature
            # can't be extracted from the data column. If the value is not null,
            # then attempt to cast it to the correct type. 
            selection = "case when json_extract_path_text(data, '{0}') = '' then null "
            selection += "else json_extract_path_text(data, '{0}')::{1} end as \"{2}\""
            selection = selection.format(informal, type_, formal)
            selections.append(selection)

            condition = "json_extract_path_text(data, '{}') != ''".format(informal)
            conditions.append(condition)

            values.append('"{}"'.format(formal))
        
        # This allows us to select only rows where at least one of the properties
        # found in the sensor metadata can be extracted from the raw data string
        # in the unknown feature table.
        conditions = "(" + str.join(" or ", conditions) + ")"
        selections = str.join(", ", selections)
        # Necessary so that the ordering of the selected columns doesn't matter
        values = str.join(", ", values)

        select = 'select node_id, "datetime"::datetime, '
        select += 'meta_id, sensor, {} from unknown_feature'.format(selections)

        delete = 'delete from unknown_feature'

        for network in feature.networks:
            target_table = "{}__{}".format(network.name, feature.name)
            insert = 'insert into {} ({}) '.format(target_table, values)

            where = "where network = '{}' and sensor = '{}' and {}"
            where = where.format(network.name, sensor.name, conditions)

            query = '{} {} {}'.format(insert, select, where)
            print(query)
            with redshift_session_context() as session:
                session.execute(query)

            # In cases where the sensor reports on two features (ex. bmp180) we
            # can't delete until we've mapped to every feature table.
            if i + 1 == len(sensor.features()):
                query = '{} {}'.format(delete, where)
                print(query)
                with redshift_session_context() as session:
                    session.execute(query)
