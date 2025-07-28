// Elementos
const pagoInput = document.getElementById('pago');
const deudaInput = document.getElementById('deuda');
const categoriaSelect = document.getElementById('categoria');
const abonoInput = document.getElementById('abono');
const btnAbonar = document.getElementById('btnAbonar');
const btnPagado = document.getElementById('btnPagado');
const btnDebo = document.getElementById('btnDebo');
const btnExportar = document.getElementById('btnExportar');
const btnExportarPDF = document.getElementById('btnExportarPDF');
const btnLimpiar = document.getElementById('btnLimpiar');
const estadoDiv = document.getElementById('estado');
const historialDiv = document.getElementById('historial');
const pagoGuardado = document.getElementById('pagoGuardado');
const deudaGuardada = document.getElementById('deudaGuardada');

// Estado
let pago = 0;
let deuda = 0;
let abonado = 0;
let pagado = false;
let categoria = 'servicios';
let historial = [];

// Función para formatear números con separadores de miles
function formatearNumero(numero) {
  return numero.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Función para limpiar formato de números (quitar puntos y comas)
function limpiarFormatoNumero(texto) {
  return texto.replace(/\./g, '').replace(',', '.');
}

// Cargar datos de localStorage
function cargarDatos() {
  pago = parseFloat(localStorage.getItem('pago')) || 0;
  deuda = parseFloat(localStorage.getItem('deuda')) || 0;
  abonado = parseFloat(localStorage.getItem('abonado')) || 0;
  pagado = localStorage.getItem('pagado') === 'true';
  categoria = localStorage.getItem('categoria') || 'servicios';
  historial = JSON.parse(localStorage.getItem('historial')) || [];
  actualizarUI();
}

// Guardar datos en localStorage
function guardarDatos() {
  localStorage.setItem('pago', pago);
  localStorage.setItem('deuda', deuda);
  localStorage.setItem('abonado', abonado);
  localStorage.setItem('pagado', pagado);
  localStorage.setItem('categoria', categoria);
  localStorage.setItem('historial', JSON.stringify(historial));
}

// Agregar al historial
function agregarHistorial(tipo, cantidad, descripcion) {
  const fecha = new Date().toLocaleString('es-ES');
  historial.unshift({
    fecha,
    tipo,
    cantidad,
    descripcion,
    categoria
  });
  guardarDatos();
  actualizarHistorial();
}

// Actualizar historial en la UI
function actualizarHistorial() {
  historialDiv.innerHTML = '';
  historial.forEach(item => {
    const div = document.createElement('div');
    div.className = `historial-item ${item.tipo}`;
    div.innerHTML = `
      <strong>${item.fecha}</strong><br>
      ${item.descripcion}: $${formatearNumero(item.cantidad)}<br>
      <small>Categoría: ${item.categoria}</small>
    `;
    historialDiv.appendChild(div);
  });
}

// Actualizar la interfaz
function actualizarUI() {
  pagoInput.value = pago > 0 ? formatearNumero(pago) : '';
  deudaInput.value = deuda > 0 ? formatearNumero(deuda) : '';
  categoriaSelect.value = categoria;
  
  if (pago > 0) {
    const saldoRestante = pago - abonado;
    pagoGuardado.textContent = `Saldo: $${formatearNumero(saldoRestante)}`;
  } else {
    pagoGuardado.textContent = '';
  }
  
  if (deuda > 0) {
    const deudaRestante = deuda - abonado;
    deudaGuardada.textContent = `Deuda restante: $${formatearNumero(deudaRestante)}`;
  } else {
    deudaGuardada.textContent = '';
  }
  
  abonoInput.value = '';

  if (pagado || (deuda - abonado) <= 0 && deuda > 0) {
    estadoDiv.innerHTML = '<span class="ya-pago">¡Ya Pagó!</span>';
  } else if (abonado > 0 && (deuda - abonado) > 0) {
    const deudaRestante = deuda - abonado;
    estadoDiv.textContent = `Abonado: $${formatearNumero(abonado)}. Deuda restante: $${formatearNumero(deudaRestante)}`;
    estadoDiv.className = '';
  } else {
    estadoDiv.textContent = '';
    estadoDiv.className = '';
  }

  actualizarHistorial();
}

// Exportar datos JSON
function exportarDatos() {
  const datos = {
    pago,
    deuda,
    abonado,
    pagado,
    categoria,
    historial,
    fechaExportacion: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contabilidad_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Exportar a PDF
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Configuración de colores
  const primaryColor = [102, 126, 234];
  const successColor = [76, 175, 80];
  const warningColor = [255, 152, 0];
  
  // Título
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text('Contabilidad Personal', 105, 30, { align: 'center' });
  
  // Línea decorativa
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(2);
  doc.line(20, 40, 190, 40);
  
  // Información principal
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text('Resumen de Cuentas', 20, 60);
  
  // Tabla de resumen
  const deudaRestante = deuda - abonado;
  const saldoRestante = pago - abonado;
  
  const resumenData = [
    ['Concepto', 'Monto'],
    ['Pago Total', `$${formatearNumero(pago)}`],
    ['Deuda Original', `$${formatearNumero(deuda)}`],
    ['Abonado', `$${formatearNumero(abonado)}`],
    ['Deuda Restante', `$${formatearNumero(deudaRestante)}`],
    ['Saldo Disponible', `$${formatearNumero(saldoRestante)}`]
  ];
  
  doc.autoTable({
    startY: 70,
    head: [resumenData[0]],
    body: resumenData.slice(1),
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 12,
      cellPadding: 8
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' }
    }
  });
  
  // Estado del pago
  const tableY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text('Estado del Pago', 20, tableY);
  
  let estadoText = '';
  let estadoColor = [50, 50, 50];
  
  if (pagado || deudaRestante <= 0) {
    estadoText = '✅ PAGO COMPLETADO';
    estadoColor = successColor;
  } else if (abonado > 0) {
    estadoText = '⏳ PAGO PARCIAL';
    estadoColor = warningColor;
  } else {
    estadoText = '❌ PENDIENTE DE PAGO';
    estadoColor = [244, 67, 54];
  }
  
  doc.setFontSize(18);
  doc.setTextColor(...estadoColor);
  doc.text(estadoText, 105, tableY + 15, { align: 'center' });
  
  // Historial de pagos
  if (historial.length > 0) {
    const historialY = tableY + 40;
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text('Historial de Pagos', 20, historialY);
    
    const historialData = historial.map(item => [
      item.fecha,
      item.descripcion,
      `$${formatearNumero(item.cantidad)}`,
      item.categoria
    ]);
    
    doc.autoTable({
      startY: historialY + 10,
      head: [['Fecha', 'Descripción', 'Monto', 'Categoría']],
      body: historialData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        2: { halign: 'right' }
      }
    });
  }
  
  // Pie de página
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 20, pageHeight - 20);
  doc.text('Contabilidad Personal - Sistema de Gestión', 105, pageHeight - 20, { align: 'center' });
  
  // Guardar PDF
  const fecha = new Date().toISOString().split('T')[0];
  doc.save(`contabilidad_${fecha}.pdf`);
}

// Limpiar todo
function limpiarTodo() {
  if (confirm('¿Estás seguro de que quieres limpiar todos los datos?')) {
    pago = 0;
    deuda = 0;
    abonado = 0;
    pagado = false;
    categoria = 'servicios';
    historial = [];
    guardarDatos();
    actualizarUI();
  }
}

// Eventos para guardar cambios
pagoInput.addEventListener('change', () => {
  const valorLimpio = limpiarFormatoNumero(pagoInput.value);
  pago = parseFloat(valorLimpio) || 0;
  guardarDatos();
  actualizarUI();
});

pagoInput.addEventListener('blur', () => {
  if (pago > 0) {
    pagoInput.value = formatearNumero(pago);
  }
});

deudaInput.addEventListener('change', () => {
  const valorLimpio = limpiarFormatoNumero(deudaInput.value);
  deuda = parseFloat(valorLimpio) || 0;
  abonado = 0;
  pagado = false;
  guardarDatos();
  actualizarUI();
});

deudaInput.addEventListener('blur', () => {
  if (deuda > 0) {
    deudaInput.value = formatearNumero(deuda);
  }
});

categoriaSelect.addEventListener('change', () => {
  categoria = categoriaSelect.value;
  guardarDatos();
  actualizarUI();
});

btnAbonar.addEventListener('click', () => {
  const valorLimpio = limpiarFormatoNumero(abonoInput.value);
  const abono = parseFloat(valorLimpio) || 0;
  if (abono > 0 && (deuda - abonado) > 0) {
    abonado += abono;
    agregarHistorial('abonado', abono, 'Abono realizado');
    
    if (abonado >= deuda) {
      abonado = deuda;
      pagado = true;
      agregarHistorial('pagado', deuda, 'Pago completo');
    }
    guardarDatos();
    actualizarUI();
  }
});

btnPagado.addEventListener('click', () => {
  if (deuda > 0) {
    abonado = deuda;
    pagado = true;
    agregarHistorial('pagado', deuda, 'Pago completo');
    guardarDatos();
    actualizarUI();
  }
});

btnDebo.addEventListener('click', () => {
  pagado = false;
  guardarDatos();
  actualizarUI();
});

btnExportar.addEventListener('click', exportarDatos);
btnExportarPDF.addEventListener('click', exportarPDF);
btnLimpiar.addEventListener('click', limpiarTodo);

// Inicializar
cargarDatos(); 