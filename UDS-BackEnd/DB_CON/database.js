const { Pool } = require('pg');

const pool = new Pool({
    user: "postgres",
    password: "nueva_clave",
    host: "192.168.2.2",
    port: "5432",
    database: "EATA"
});

// --- FUNCIÓN EXISTENTE (sin cambios) ---
const getGeometriaYProducto = async (producto, fecha) => {
  const sqlQuery = `
    SELECT
      id,
      producto,
      fecha_muestra,
      "value",
      "category",
      "units",
      ST_AsGeoJSON(geom) AS geometria
    FROM
      public.datos_goes
    WHERE
      producto = $1
      AND fecha_muestra = $2
      -- Si el producto es RRQPEF o ACHAF → exige value > 0; si no, pasa todo
      AND (producto NOT IN ('RRQPEF', 'ACHAF') OR "value" > 0);
  `;
  const values = [producto, fecha];

  let client;
  try {
    client = await pool.connect();
    const res = await client.query(sqlQuery, values);

    // Parsear GeoJSON
    res.rows.forEach(row => {
      if (typeof row.geometria === 'string') row.geometria = JSON.parse(row.geometria);
    });

    return res.rows;
  } catch (err) {
    console.error('Error al ejecutar la consulta GeoJSON', err.stack);
    throw err;
  } finally {
    if (client) client.release();
  }
};


// --- NUEVA FUNCIÓN ---
/**
 * Obtiene todas las fechas únicas (sin duplicados) para un producto específico.
 * @param {string} producto El nombre del producto a consultar.
 * @returns {Promise<Array<string>>} Una promesa que se resuelve con un array de fechas en formato string.
 */
const getFechasUnicasPorProducto = async (producto) => {
    // Usamos DISTINCT en 'fecha_muestra' para obtener valores únicos.
    // Ordenamos por fecha de forma descendente para tener las más recientes primero.
    const sqlQuery = `
        SELECT DISTINCT fecha_muestra
        FROM public.datos_goes
        WHERE producto = $1
        ORDER BY fecha_muestra DESC;
    `;
    const values = [producto];
    let client;
    try {
        client = await pool.connect();
        const res = await client.query(sqlQuery, values);
        // El resultado es un array de objetos (ej: [{fecha_muestra: '...'}, ...])
        // Lo transformamos en un array de strings (ej: ['...', '...']) que es más útil.
        return res.rows.map(row => row.fecha_muestra);
    } catch (err) {
        console.error('Error al obtener fechas únicas', err.stack);
        throw err;
    } finally {
        if (client) {
            client.release();
        }
    }
};


// --- Exportamos AMBAS funciones ---
module.exports = {
    getGeometriaYProducto,
    getFechasUnicasPorProducto // <-- Añadimos la nueva función a las exportaciones
};