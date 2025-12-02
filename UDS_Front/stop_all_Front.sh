#!/bin/bash
# stop_all.sh


echo "Deteniendo index.py (Flask)..."
pkill -f /eata-project/index.py


echo "Todos los procesos han sido detenidos."
