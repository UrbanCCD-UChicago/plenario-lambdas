from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session

from settings import POSTGRES_URI, REDSHIFT_URI


postgres_engine = create_engine(POSTGRES_URI)
redshift_engine = create_engine(REDSHIFT_URI)

postgres_session = scoped_session(sessionmaker(postgres_engine))
postgres_base = declarative_base(postgres_engine)
postgres_base.query = postgres_session.query_property()

redshift_session = scoped_session(sessionmaker(redshift_engine))
redshift_base = declarative_base(redshift_engine)
redshift_base.query = redshift_session.query_property()



@contextmanager
def redshift_session_context():
    """A helper method for keeping the state of an connection with the database
    separate from the work being done, and ensuring that the session is always
    cleaned up after use."""

    transactional_session = redshift_session()
    try:
        yield transactional_session
        transactional_session.commit()
    except InvalidRequestError:
        pass
    except:
        transactional_session.rollback()
        raise
    finally:
        transactional_session.close()
