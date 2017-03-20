from geoalchemy2 import Geometry
from sqlalchemy import Table, String, Column, ForeignKey, ForeignKeyConstraint
from sqlalchemy import func as sqla_fn, Boolean, BigInteger, DateTime, Float
from sqlalchemy.dialects.postgresql import JSONB, DOUBLE_PRECISION
from sqlalchemy.orm import relationship

from database import postgres_base, redshift_base


sensor_to_node = Table(
    'sensor__sensor_to_node',
    postgres_base.metadata,
    Column('sensor', String, ForeignKey('sensor__sensor_metadata.name')),
    Column('network', String),
    Column('node', String),
    ForeignKeyConstraint(
        ['network', 'node'],
        ['sensor__node_metadata.sensor_network', 'sensor__node_metadata.id']
    )
)


feature_to_network = Table(
    'sensor__feature_to_network',
    postgres_base.metadata,
    Column('feature', String, ForeignKey('sensor__feature_metadata.name')),
    Column('network', String, ForeignKey('sensor__network_metadata.name'))
)


class NetworkMeta(postgres_base):
    __tablename__ = 'sensor__network_metadata'

    name = Column(String, primary_key=True)
    nodes = relationship('NodeMeta')
    info = Column(JSONB)

    @staticmethod
    def index():
        networks = session.query(NetworkMeta)
        return [network.name.lower() for network in networks]

    def tree(self):
        return {n.id: n.tree() for n in self.nodes}

    def sensors(self):

        keys = []
        for sensor in self.tree().values():
            keys += sensor

        return keys

    def features(self):

        keys = []
        for sensor in self.tree().values():
            for feature in sensor.values():
                keys += feature.keys()

        return set([k.split(".")[0] for k in keys])


class NodeMeta(postgres_base):
    __tablename__ = 'sensor__node_metadata'

    id = Column(String, primary_key=True)
    sensor_network = Column(String, ForeignKey('sensor__network_metadata.name'), primary_key=True)
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    sensors = relationship('SensorMeta', secondary='sensor__sensor_to_node')
    info = Column(JSONB)

    column_editable_list = ("sensors", "info")

    def features(self):
        feature_set = set()
        for feature in self.tree().values():
            feature_set.update(feature.keys())
        return feature_set

    def tree(self):
        return {s.name: s.tree() for s in self.sensors}


class SensorMeta(postgres_base):
    __tablename__ = 'sensor__sensor_metadata'

    name = Column(String, primary_key=True)
    observed_properties = Column(JSONB)
    info = Column(JSONB)

    def features(self):
        """Return the features that this sensor reports on."""

        return {e.split('.')[0] for e in self.tree()}

    def tree(self):
        return {v: k for k, v in self.observed_properties.items()}


class FeatureMeta(postgres_base):
    __tablename__ = 'sensor__feature_metadata'

    name = Column(String, primary_key=True)
    networks = relationship('NetworkMeta', secondary='sensor__feature_to_network')
    observed_properties = Column(JSONB)

    def types(self):
        """Return a dictionary with the properties mapped to their types."""

        return {e['name']: e['type'] for e in self.observed_properties}
    
    def sensors(self):
        """Return the set of sensors that report on this feature."""

        results = set()
        for network in self.networks:
            for node in network.tree().values():
                for sensor, properties in node.items():
                    if self.name in {p.split('.')[0] for p in properties}:
                        results.add(sensor)

        return results
