#!/bin/bash

#!/bin/bash
mkdir -p /home/uds/logs

# 1. main.py (Inicia ya)
echo "Iniciando main.py..."
source /home/uds/EataPy/bin/activate
nohup python /home/uds/CTIC/NewEATA/main.py > /home/uds/logs/main.log 2>&1 &
deactivate

# 2. pipeline (Espera 6 minutos en segundo plano y luego arranca)
echo "Programando pipeline_postgres.py para iniciar en 3 minutos..."
(
  sleep 3m
  source /home/uds/eatapg_env311/bin/activate
  nohup python /home/uds/CTIC/EATA_PG/pipeline_postgres.py > /home/uds/logs/pipeline_postgres.log 2>&1 &
  deactivate
) &

# 3. Node.js (Inicia ya, sin esperar al pipeline)
echo "Iniciando server.js (Node.js)..."
nohup node /home/uds/DB_CON/server.js > /home/uds/logs/server_node.log 2>&1 &

echo "Procesos lanzados. El pipeline arrancará automáticamente en 3 minutos."