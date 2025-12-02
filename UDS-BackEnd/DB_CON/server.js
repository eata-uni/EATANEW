const express = require('express');
const cors = require('cors');
const { getGeometriaYProducto, getFechasUnicasPorProducto } = require('./database.js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// --- Tus endpoints con logging ---

// Endpoint para obtener datos GeoJSON
app.get('/api/datos', async (req, res) => {
    // <-- DEBUGGING: Mostramos la URL completa que se ha solicitado a este endpoint.
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    console.log(`[LOG] Petición recibida en /api/datos: ${fullUrl}`);

    const { producto, fecha } = req.query;
    if (!producto || !fecha) {
        return res.status(400).json({ error: "Se requieren los parámetros 'producto' y 'fecha'." });
    }
    try {
        const resultadosDb = await getGeometriaYProducto(producto, fecha);
        const features = resultadosDb.map(fila => {
            const { geometria, ...propiedades } = fila;
            return {
                type: "Feature",
                geometry: geometria,
                properties: propiedades
            };
        });
        const geoJsonCollection = { type: "FeatureCollection", features: features };
        res.json(geoJsonCollection);
    } catch (error) {
        console.error("Error en el endpoint /api/datos:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// Endpoint para obtener fechas únicas
app.get('/api/fechas', async (req, res) => {
    // <-- DEBUGGING: Mostramos la URL completa que se ha solicitado a este endpoint.
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    console.log(`[LOG] Petición recibida en /api/fechas: ${fullUrl}`);

    const { producto } = req.query;
    if (!producto) {
        return res.status(400).json({ error: "Se requiere el parámetro 'producto'." });
    }
    try {
        const fechas = await getFechasUnicasPorProducto(producto);
        res.json(fechas);
    } catch (error) {
        console.error("Error en el endpoint /api/fechas:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});

// --- Iniciar servidor (sin cambios) ---
app.listen(PORT, "127.0.0.1", () => {
    console.log(`✅ Servidor corriendo y abierto en la red en el puerto ${PORT}.`);
    console.log(`   CORS habilitado para todas las peticiones.`);
    console.log(`   - Endpoint de datos: /api/datos?producto=...&fecha=...`);
    console.log(`   - Endpoint de fechas: /api/fechas?producto=...`);
});