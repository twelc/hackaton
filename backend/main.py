from flask import Flask, render_template, request, jsonify
import geoip2.database
import geoip2.errors
from data.database import Database
import data.calc
import pandas as pd
from loguru import logger

from werkzeug.middleware.proxy_fix import ProxyFix



app = Flask(__name__, template_folder="templates", static_folder="static")
#из-за того, что перед flask'ом стоит angie ip посетителя не опрделяется. 
#Нейронка говорит, что это должно решить проблему
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
reader = geoip2.database.Reader("data/dbip.mmdb")
db = Database()

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/system")
def system():
    return render_template('system.html')

@app.route("/planet")
def planet():
    return render_template('planet.html')

@logger.catch()
@app.route("/get_systems")
def get_systems():
    df = db.get_systems(300, "esi", "desc")
    return df.to_json(orient='records', force_ascii=False)

@logger.catch()
@app.route("/systems/<system_id>")
def get_system_info(system_id):
    df = db.get_planets(system_id)
    return df.to_json(orient='records', force_ascii=False)

@logger.catch()
@app.route("/planets/<planet_id>")
def get_planet_info(planet_id):
    ip = request.remote_addr
    lat = 55.7522
    lon = 37.6156
    city = "Moscou"
    try:
        r = reader.city(ip)
        lat = r.location.latitude
        lon = r.location.longitude
        city = r.city.name
    except geoip2.errors.AddressNotFoundError, ValueError:
        print("Not found ip address: {}".format(ip))
    try:
        df = db.get_planet_data(planet_id).iloc[0]
    except Exception:
        logger.exception("error")
        return jsonify({"error":True})
    

    status, month, alt, az = data.calc.get_info(df['ra'], df['dec'],lat,lon)
    msg = ""
    mon = [
        'январь', 'февраль', 'март', 'апрель',
        'май', 'июнь', 'июль', 'август',
        'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
           ]
    if status == "невосходящая":
        msg = f"Увидеть {df['hostname']} из {city} невозможно"
    elif status == "восходящая и заходящая":
        msg = f"{df['hostname']} можно увидеть из {city}. Лучшее время для наблюдений: {mon[month-2]}-{mon[(month+2) % 12]}. "\
        f"Координаты для телескопа: {alt}, {az}"
    else:
        msg = f"{df['hostname']} никогда не заходит за горизонт в {city}. Лучшее время для наблюдений: {mon[month-2]}-{mon[month+2]}. "\
                f"Координаты для телескопа: {alt}, {az}"
    df['message'] = msg
    return df.to_json(force_ascii=False)

    

if __name__ == "__main__":
    app.run('0.0.0.0', debug=True)