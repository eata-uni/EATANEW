// Importar la función desde el módulo db.js
const { getDatosPorProductoYFecha } = require('./db');

// Ejemplo de uso de la función
const productoAConsultar = 'ACHAF'; // Puedes cambiar esto por 'ACHTF', 'LSTF', 'RRQPEF', 'TPWF'
const fechaAConsultar = '2025-07-24 07:10:00';

getDatosPorProductoYFecha(productoAConsultar, fechaAConsultar)
  .then(resultados => {
    if (resultados.length > 0) {
      console.log('Resultados de la consulta:');
      resultados.forEach(fila => {
        console.log({
          producto: fila.producto,
          fecha: fila.fecha_muestra,
          geometria: fila.geom, // La geometría estará en formato WKT o el que maneje tu base de datos
          valor: fila.value,
          categoria: fila.category,
          unidades: fila.units,
        });
      });
    } else {
      console.log('No se encontraron resultados para los parámetros proporcionados.');
    }
  })
  .catch(error => {
    console.error('Error al realizar la consulta:', error);
  });