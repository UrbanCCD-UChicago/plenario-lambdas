from datetime import datetime

from models import NodeMeta

from database import redshift_session_context
from settings import S3_BUCKET, AWS_ACCESS_KEY, AWS_SECRET_KEY


def start_and_end_of_the_month(dt):
    """Get first of month and first of next month for a given datetime."""

    start = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    if start.month == 12:
        end = start.replace(
            year=start.year + 1,
            month=1,
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )
    else:
        end = start.replace(month=start.month + 1)

    return start, end


def unload(feature, node, start, end):
    """Unload the feature of a single node from start to end datetimes to s3."""

    unload = "unload({query}) "                     \
             "to 's3://{path}' "                    \
             "with credentials"                     \
             "'aws_access_key_id={access_key};"     \
             "aws_secret_access_key={secret_key}' " \
             "parallel off "                        \
             "gzip "                                \
             "allowoverwrite "                      \
             "delimiter as ',' "                    \
             "escape "

    query = "'select * from array_of_things_chicago__{} " \
            "where node_id = \\'{}\\' "                   \
            "and datetime >= \\'{}\\' "                   \
            "and datetime <= \\'{}\\' "                   \
            "order by datetime desc'"

    query = query.format(feature, node, start, end)

    path = '{}/{}/{}/{}.csv'.format(S3_BUCKET, start.isoformat(), node, feature)
    with redshift_session_context() as session:
        session.execute(
            unload.format(
                path=path,
                query=query,
                access_key=AWS_ACCESS_KEY,
                secret_key=AWS_SECRET_KEY
            )
        )

    return path


def archive():

    start, end = start_and_end_of_the_month(datetime.now())

    for node in NodeMeta.query.all():
        for feature in node.features():
            print(unload(feature, node.id, start, end))
