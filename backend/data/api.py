import requests
import pandas as pd
import numpy as np
import calc as calc
from io import StringIO
from sqlalchemy import create_engine

#TODO доступы к бд я пока захардкодил, нужно достать из database.py конфиг

def load():
    r = requests.get(
        "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" \
        "select+" \
        "pl_name,hostname,discoverymethod,disc_year,pl_controv_flag," #info \
        "pl_rade,pl_bmasse,pl_bmassprov,pl_dens,pl_insol,pl_eqt," #esi \
        "pl_orbper,pl_orbsmax,pl_orbeccen,ra,dec," 
        "st_teff,st_lum,st_rad,st_mass,st_spectype,st_age,st_met,sy_snum,sy_pnum,sy_dist" #system&star \
        "+from+pscomppars&format=csv"
        )
    
    if r.status_code != 200:
        print(f"request returned code {r.status_code}")
        print(r.text)
        raise RuntimeError
    df = pd.read_csv(StringIO(r.text), header=0,index_col=None, sep=",")
    df[["esi", "esi_status"]] = df.apply(calc.ESI, axis=1, result_type='expand')

    systems = (
        df.groupby('hostname', as_index=False)
        .agg(
            esi=('esi','max'),
            planets=('pl_name', 'count'),
            st_teff=('st_teff', 'first'),
            st_lum=('st_lum', 'first'),
            st_rad=('st_rad', 'first'),
            st_mass=('st_mass', 'first'),
            st_met=('st_met', 'first'),
            sy_dist=('sy_dist', 'first'),
            st_spectype=('st_spectype', 'first'),
            planet_names=('pl_name', ', '.join)
            )
    )

    #кидаем в бд
    engine = create_engine(
    'postgresql+psycopg2://admin:admin@0.0.0.0:5432/hackaton')

    df.to_sql('planets', engine, if_exists='replace',index=False)
    systems.to_sql('systems', engine, if_exists='replace', index=False)
    
    


if __name__ == "__main__":
    load()
