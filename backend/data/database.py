from sqlalchemy import Engine, create_engine


username='admin'
password='admin'
database='hackaton'
host='0.0.0.0'
port='5432'

class Database:
    engine:Engine


    def __init__(self):
        self.make_engine()

    def make_engine(self):
        self.engine=create_engine('postgresql+psycopg2://{}:{}@{}:{}/{}'.format(username, password, host, port,database))




