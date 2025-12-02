#!/bin/bash
# stop_all.sh

echo "Deteniendo pipeline_postgres.py..."
pkill -f /CTIC/EATA_PG/pipeline_postgres.py

echo "Deteniendo main.py..."
pkill -f /CTIC/NewEATA/main.py


echo "Deteniendo server.js (Node.js)..."
pkill -f "node /home/uds/DB_CON/server.js"

echo "Todos los procesos han sido detenidos."
