import requests
import pandas as pd
import numpy as np
import calc
from io import StringIO
from sqlalchemy import create_engine


def load():
    r = requests.get(
        "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" \
        "select+" \
        "pl_name,hostname,discoverymethod,disc_year,pl_controv_flag," #info \
        "pl_rade,pl_bmasse,pl_bmassprov,pl_dens,pl_insol,pl_eqt," #esi \
        "pl_orbper,pl_orbsmax,pl_orbeccen,ra,dec" 
        "st_teff,st_lum,st_rad,st_mass,st_spectype,st_age,st_met,sy_snum,sy_pnum" #system&star \
        "+from+ps&format=csv"
        )
    
    if r.status_code != 200:
        print(f"request returned code {r.status_code}")
        raise RuntimeError
    df = pd.read_csv(StringIO(r.text), header=0,index_col=None, sep=",")
    df[["esi", "esi_status"]] = df.apply(calc.ESI, axis=1, result_type='expand')
    engine = create_engine(
    'postgresql+psycopg2://admin:admin@0.0.0.0:5432/hackaton')

    df.to_sql('planets', engine, if_exists='replace',index=False)
    
    


if __name__ == "__main__":
    load()
