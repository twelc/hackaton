import pandas as pd
import datetime
from math import sqrt, asin, sin, cos, acos

#данные для земли  
RAD=6371
DENS=5.51
V=11.19
T=288



def esi_full(rad, dens, mass, temp) -> float:
    v = sqrt(mass/rad)
    res = 1
    x = [rad, dens, v, temp]
    x0 = [1, DENS, 1, T]
    w = [0.57, 1.07, 0.7, 5.58]
    for i in range(4):
        res*=(1-abs((x[i]-x0[i])/(x[i]+x0[i])))**(w[i]/4)
    return res


def esi_simple(rad, insol) -> float:
    return 1-sqrt(0.5*(((rad-1)/(rad+1))**2+((insol-1)/(insol+1))**2))




#функция для подсчета esi
def ESI(row) -> tuple[float, bool]:
    if not pd.Series([pd.isna(row['pl_rade']),
                            pd.isna(row['pl_dens']),
                            pd.isna(row['pl_eqt']), 
                            pd.isna(row['pl_bmasse'])]).any():
        return esi_full(row["pl_rade"], row['pl_dens'], row['pl_bmasse'], row['pl_eqt']), True
    elif not pd.Series([pd.isna(row['pl_rade']), pd.isna(row['pl_insol'])]).any():
        return esi_simple(row["pl_rade"], row['pl_insol']), False
    else:
        return 0, False



def get_info(ra:float,dec:float, lat:float, lon:float):

    status="" #видно ли вообще или нет
    month=0 #пиковая видимость
    alt=0 #высота(для телескопа)
    az=0 #азимут(для телескопа)


    if lat > 0:
        if dec>=90-lat:
            status="незаходящая"
        elif dec<=lat-90:
            status="невосходящая"
        else:
            status="восходящая и заходящая"
    else:
        if dec <= -90 - lat:
            status="незаходящая"
        elif dec>=90+lat:
            status="невосходящая"
        else:
            status="восходящая и заходящая"

    #пиковая видимость в этот месяц, хорошо видно в промежутке [month-2;month+2]
    month = (9+(ra/30)) % 12 

    #считаем местное звездное время (там пизда какая-то)
    utc = datetime.datetime.now().timestamp()
    d = utc/86400 - 10957.5
    gmst = (18.697374558 + 24.06570982441908*d) % 24
    lst = (gmst + (lon/15)) % 24

    #это настройки для телескопа
    h=(lst*15)-ra
    if h<0: h+=360

    alt=asin(sin(lat)*sin(dec)+cos(lat)*cos(dec)*cos(h))
    az=acos((sin(dec)-sin(alt)*sin(lat))/cos(alt)*cos(lat))
    if sin(h)>0:
        az=360-az

    return status, month, alt, az







    


            

    