// Variables para almacenar los datos
let registros = [];
let registrosFiltrados = []; // Para almacenar los registros filtrados actualmente

// Variables para control de ordenamiento
let ordenActual = {
    columna: null,
    ascendente: true
};

// Variable para filtro por año
let añoFiltroSeleccionado = 'todos'; // 'todos' o un año específico

// Elementos DOM
const form = document.getElementById('entryForm');
const tbody = document.querySelector('#transactionsTable tbody');
const totalIngresosSpan = document.getElementById('totalIngresos');
const totalGastosSpan = document.getElementById('totalGastosSpan');
const resultadoSpan = document.getElementById('resultado');

const filtroSelect = document.getElementById('filter'); // 'todos', 'ingresos', 'gastos'
const fechaDesdeInput = document.getElementById('fechaDesde');
const fechaHastaInput = document.getElementById('fechaHasta');
const mesSelect = document.getElementById('mesFiltro');

// Nuevo: Select para año
const añoSelect = document.getElementById('añoFiltro');

// Botones de exportación
const btnCsv = document.getElementById('exportCsv');
const btnXlsx = document.getElementById('exportXlsx');
const btnPdf = document.getElementById('exportPdf');

const btnDescargarTemplate = document.getElementById('downloadTemplate');
const btnCargarTemplate = document.getElementById('loadTemplate');

const ordenFechaBtn = document.getElementById('ordenFecha');
const ordenCantidadBtn = document.getElementById('ordenCantidad');
const ordenClasificacionBtn = document.getElementById('ordenClasificacion');
const ordenDetalleBtn = document.getElementById('ordenDetalle');

/* ============================
   Funciones auxiliares
   ============================ */

// Formatear números como moneda
function formatearMoneda(valor) {
    const numero = Number(valor);
    if (isNaN(numero)) return "$0,00";
    const formateado = numero.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `$${formateado}`;
}

// Actualizar el resumen
function actualizarResumen() {
    let totalIngresos = 0;
    let totalGastos = 0;

    registrosFiltrados.forEach(r => {
        if (r.tipo === 'ingreso') totalIngresos += r.cantidad;
        else if (r.tipo === 'gasto') totalGastos += r.cantidad;
    });

    const resultado = totalIngresos - totalGastos;

    totalIngresosSpan.textContent = formatearMoneda(totalIngresos);
    totalGastosSpan.textContent = formatearMoneda(totalGastos);
    resultadoSpan.textContent = formatearMoneda(resultado);
}

// Agregar fila a la tabla
function agregarFila(reg) {
    const fila = document.createElement('tr');

    const fechaTd = document.createElement('td');
    fechaTd.textContent = reg.fecha;
    fila.appendChild(fechaTd);

    const cantidadTd = document.createElement('td');
    cantidadTd.textContent = formatearMoneda(reg.cantidad);
    fila.appendChild(cantidadTd);

    const tipoTd = document.createElement('td');
    tipoTd.textContent = reg.tipo === 'ingreso' ? 'Ingreso' : 'Gasto';
    fila.appendChild(tipoTd);

    const notasTd = document.createElement('td');
    notasTd.textContent = reg.notas || '';
    fila.appendChild(notasTd);

    // Botón eliminar
    const eliminarTd = document.createElement('td');
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.onclick = () => {
        // Eliminar registro
        registros = registros.filter(r => r !== reg);
        aplicarFiltros();
    };
    eliminarTd.appendChild(btnEliminar);
    fila.appendChild(eliminarTd);

    tbody.appendChild(fila);
}

// Renderizar registros filtrados
function renderizarRegistros() {
    tbody.innerHTML = '';
    registrosFiltrados.forEach(reg => agregarFila(reg));
    actualizarResumen();
}

// Función para obtener los años disponibles en los registros
function obtenerAñosDisponibles() {
    const años = new Set();
    registros.forEach(r => {
        if (r.fechaAño) {
            años.add(r.fechaAño);
        }
    });
    return Array.from(años).sort((a, b) => b - a); // Orden descendente
}

// Aplicar filtros
function aplicarFiltros() {
    const filtro = filtroSelect.value; // 'todos', 'ingresos', 'gastos'
    let filtrados = [...registros];

    // Filtro por tipo
    if (filtro === 'ingresos') {
        filtrados = filtrados.filter(r => r.tipo === 'ingreso');
    } else if (filtro === 'gastos') {
        filtrados = filtrados.filter(r => r.tipo === 'gasto');
    }

    // Filtro por rango de fechas
    const desde = fechaDesdeInput.value;
    const hasta = fechaHastaInput.value;

    if (desde || hasta) {
        filtrados = filtrados.filter(r => {
            const fechaReg = new Date(r.fecha);
            let valido = true;
            if (desde) {
                const desdeDate = new Date(desde);
                valido = valido && (fechaReg >= desdeDate);
            }
            if (hasta) {
                const hastaDate = new Date(hasta);
                valido = valido && (fechaReg <= hastaDate);
            }
            return valido;
        });
    }

    // Filtro por mes
    const mesFiltro = mesSelect.value; // 'todos', '01', ..., '12'
    if (mesFiltro && mesFiltro !== 'todos') {
        filtrados = filtrados.filter(r => {
            const fechaReg = new Date(r.fecha);
            const mes = (fechaReg.getMonth() + 1).toString().padStart(2, '0');
            return mes === mesFiltro;
        });
    }

    // Filtro por año
    const anioFiltro = añoSelect.value; // 'todos', '2023', '2022', etc.
    if (anioFiltro && anioFiltro !== 'todos') {
        filtrados = filtrados.filter(r => {
            const fechaReg = new Date(r.fecha);
            const anio = fechaReg.getFullYear().toString();
            return anio === anioFiltro;
        });
    }

    registrosFiltrados = filtrados;
    aplicarOrden();
    renderizarRegistros();
}

// Evento del formulario
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fecha = document.getElementById('date').value;
    const cantidad = parseFloat(document.getElementById('amount').value);
    const tipo = document.getElementById('type').value;
    const notas = document.getElementById('notes').value.trim();

    if (!fecha || isNaN(cantidad) || cantidad <= 0 || !tipo) {
        alert('Por favor, ingresa datos válidos.');
        return;
    }

    // Extraer año de la fecha
    const fechaObj = new Date(fecha);
    const año = fechaObj.getFullYear();

    const registro = { 
        fecha, 
        cantidad, 
        tipo, 
        notas,
        fechaAño: año // Guardar año para filtro
    };
    registros.push(registro);
    // Actualizar opciones de año
    actualizarAñosDisponibles();
    aplicarFiltros();

    form.reset();
});

// Filtros event
filtroSelect.addEventListener('change', aplicarFiltros);
document.getElementById('fechaDesde').addEventListener('change', aplicarFiltros);
document.getElementById('fechaHasta').addEventListener('change', aplicarFiltros);
document.getElementById('mesFiltro').addEventListener('change', aplicarFiltros);

// Nuevo: Evento para cambiar año
añoSelect.addEventListener('change', () => {
    añoFiltroSeleccionado = añoSelect.value; // 'todos' o un año
    aplicarFiltros();
});

// Función para actualizar las opciones de años disponibles en el select
function actualizarAñosDisponibles() {
    const años = obtenerAñosDisponibles();
    // Limpiar opciones existentes
    añoSelect.innerHTML = '<option value="todos">Todos</option>';
    años.forEach(a => {
        const option = document.createElement('option');
        option.value = a;
        option.textContent = a;
        añoSelect.appendChild(option);
    });
    // Resetear a 'todos' si no hay cambios
    if (!años.includes(añoFiltroSeleccionado)) {
        añoFiltroSeleccionado = 'todos';
        añoSelect.value = 'todos';
    } else {
        añoSelect.value = añoFiltroSeleccionado;
    }
}

/* ============================
   Funciones de exportación
   ============================ */

// Obtener datos para exportar
function obtenerDatosParaExportar() {
    return registrosFiltrados.map(r => ({
        Fecha: r.fecha,
        Cantidad: r.cantidad,
        Tipo: r.tipo,
        Notas: r.notas
    }));
}

// Exportar CSV
btnCsv.addEventListener('click', () => {
    const datos = obtenerDatosParaExportar();
    if (datos.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }
    const encabezados = Object.keys(datos[0]);
    const filas = datos.map(obj => encabezados.map(h => `"${String(obj[h]).replace(/"/g, '""')}"`).join(','));
    const csvContent = [encabezados.join(','), ...filas].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registros.csv';
    a.click();
    URL.revokeObjectURL(url);
});

// Exportar XLSX
btnXlsx.addEventListener('click', () => {
    const datos = obtenerDatosParaExportar();
    if (datos.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, "Registros");
    XLSX.writeFile(wb, "registros.xlsx");
});

// Exportar PDF
btnPdf.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const datos = obtenerDatosParaExportar();
    if (datos.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    const columns = Object.keys(datos[0]);
    const rows = datos.map(obj => columns.map(h => String(obj[h])));

    // Usando autoTable
    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 20,
        styles: { fontSize: 8 }
    });
    doc.save('registros.pdf');
});

// Descargar plantilla
btnDescargarTemplate.addEventListener('click', () => {
    const plantilla = [
        ['Fecha', 'Cantidad', 'Tipo', 'Notas'],
        ['2023-10-01', 1000, 'ingreso', 'Ingreso por salario'],
        ['2023-10-02', 50, 'gasto', 'Compra en supermercado']
    ];
    const ws = XLSX.utils.aoa_to_sheet(plantilla);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, 'plantilla_registros.xlsx');
});

btnCargarTemplate.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx';

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      let wb;
      try {
        wb = XLSX.read(data, { type: 'array' });
      } catch (err) {
        alert('Error leyendo el archivo. Asegúrate de que sea un archivo XLSX válido.');
        return;
      }

      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];

      const datos = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (datos.length < 2) {
        alert('El archivo no tiene suficientes datos.');
        return;
      }

      const headers = datos[0].map(h => h.toString().trim());
      const filas = datos.slice(1);

      filas.forEach((fila, index) => {
        const d = {};
        headers.forEach((h, i) => {
          d[h] = fila[i] !== undefined ? fila[i] : '';
        });

        const fechaStr = d['Fecha'];
        const cantidadStr = d['Cantidad'];
        const tipoRaw = d['Tipo'];
        const notas = d['Notas'] || '';

        // Parsear y validar fecha
        let fecha;
        try {
          fecha = new Date(fechaStr);
        } catch (err) {
          console.warn(`Fecha inválida en fila ${index + 2}: ${fechaStr}`);
          return; // Saltar fila inválida
        }

        if (isNaN(fecha.getTime())) {
          console.warn(`Fecha inválida en fila ${index + 2}: ${fechaStr}`);
          return;
        }

        const dia = fecha.getDate();
        const mes = fecha.getMonth() + 1;
        const año = fecha.getFullYear();

        // Formatear fecha en MM-DD-YYYY
        const fechaFormateada = `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}-${año}`;

        // Validar cantidad
        const cantidad = parseFloat(cantidadStr);
        if (isNaN(cantidad)) {
          console.warn(`Cantidad inválida en fila ${index + 2}: ${cantidadStr}`);
          return;
        }

        // Normalizar y validar tipo
        const tipo = tipoRaw.toString().toLowerCase();
        if (tipo !== 'ingreso' && tipo !== 'gasto') {
          console.warn(`Tipo inválido en fila ${index + 2}: ${tipoRaw}`);
          return;
        }

        // Agregar registro
        registros.push({
          fecha: fechaFormateada,
          fechaDia: dia,
          fechaMes: mes,
          fechaAño: año,
          cantidad: cantidad,
          tipo: tipo,
          notas: notas
        });
      });

      // Aplicar filtros o actualizar UI
      aplicarFiltros();
    };

    reader.readAsArrayBuffer(file);
  };

  input.click();
});


/* ============================
   Funciones de ordenamiento
   ============================ */

function aplicarOrden() {
    if (!ordenActual.columna) return;

    registrosFiltrados.sort((a, b) => {
        let valA, valB;
        switch (ordenActual.columna) {
            case 'fecha':
                valA = new Date(a.fecha);
                valB = new Date(b.fecha);
                break;
            case 'cantidad':
                valA = a.cantidad;
                valB = b.cantidad;
                break;
            case 'clasificacion':
                valA = a.tipo;
                valB = b.tipo;
                break;
            case 'detalle':
                valA = a.notas || '';
                valB = b.notas || '';
                break;
            default:
                return 0;
        }

        if (valA < valB) return ordenActual.ascendente ? -1 : 1;
        if (valA > valB) return ordenActual.ascendente ? 1 : -1;
        return 0;
    });
}

// Toggle orden
function toggleOrden(columna) {
    if (ordenActual.columna === columna) {
        // cambiar dirección
        ordenActual.ascendente = !ordenActual.ascendente;
    } else {
        ordenActual.columna = columna;
        ordenActual.ascendente = true;
    }
    aplicarOrden();
    renderizarRegistros();
}

// Asignar eventos de ordenamiento
ordenFechaBtn.addEventListener('click', () => toggleOrden('fecha'));
ordenCantidadBtn.addEventListener('click', () => toggleOrden('cantidad'));
ordenClasificacionBtn.addEventListener('click', () => toggleOrden('clasificacion'));
ordenDetalleBtn.addEventListener('click', () => toggleOrden('detalle'));

// Inicializar filtros y mostrar datos
aplicarFiltros();
