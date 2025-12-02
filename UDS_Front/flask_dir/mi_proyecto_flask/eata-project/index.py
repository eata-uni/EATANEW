from flask import Flask, render_template, redirect, url_for
from werkzeug.middleware.proxy_fix import ProxyFix
import json
from pathlib import Path

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

# --- Cargar claves desde key.json ---
KEY_FILE = Path("/home/ubuntu/flask_dir/mi_proyecto_flask/eata-project/key.json")

def load_keys():
    try:
        with KEY_FILE.open() as f:
            return json.load(f)
    except Exception:
        return {}

# Inyectar ORS_API_KEY en todas las plantillas (Jinja)
@app.context_processor
def inject_keys():
    keys = load_keys()
    return {"ORS_API_KEY": keys.get("ORS_API_KEY", "")}

# --- Rutas ---
@app.route('/')
def base():
    return render_template('base.html')

@app.route('/geovisor')
def geovisor():
    return render_template('geovisor.html')

@app.route('/about')
def about():
    return render_template('nosotros.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/geouni')
def geouni():
    return render_template('geouni.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
