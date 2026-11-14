from sqlalchemy import Engine, create_engine, text
import pandas as pd
from typing import Literal

#вообще должен был быть нормальный конфиг, но времени на него нет
username='admin'
password='admin' #доступ к бд буквально в публичном репозитории, хаха
database='hackaton'
host='postgres'
port='5432'

class Database:
    engine:Engine

    def __init__(self):
        self.make_engine()

    def make_engine(self):
        self.engine=create_engine('postgresql+psycopg2://{}:{}@{}:{}/{}'.format(username, password, host, port,database))

    def get_planet_data(self, planet_id) -> pd.DataFrame:
        return   pd.read_sql_query(text("select * from planets where pl_name = :name"), 
                                   self.engine, params={"name": planet_id})

    def get_systems(self, count:int, sort_by:str, sort_dir:Literal["desc", "asc"]) -> pd.DataFrame:
        return pd.read_sql_query(text(f"select * from public.systems  order by {sort_by} {sort_dir} limit :count"), 
                                   self.engine, params={"count": count})

    def get_planets(self, system) -> pd.DataFrame:
        return pd.read_sql_query(text("select * from public.planets where hostname = :host"), 
                                           self.engine, params={"host":system})


