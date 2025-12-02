#!/bin/bash

# Crear carpeta de logs si no existe
mkdir -p /home/uds/logs

# 1. index.py de Flask
echo "Iniciando index.py (Flask)..."
source /home/uds/flask_dir/venv/bin/activate
nohup python /home/uds/flask_dir/mi_proyecto_flask/eata-project/index.py > /home/uds/logs/flask.log 2>&1 &
deactivate


echo "Todos los procesos han sido lanzados en segundo plano."
