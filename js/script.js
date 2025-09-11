// ===== נתונים =====
const CODE_MAP = {
  '013': { description: 'נסיעות', allowance: true },
  '105': { description: 'שעות נוספות 175%', percentage: 175 },
  '125': { description: 'תשלום חופש', percentage: 100, hoursPerUnit: 8.4 },
  '134': { description: 'משמרת ג', percentage: 100 },
  '135': { description: 'שעות נוספות 150%', percentage: 150 },
  '137': { description: 'משמרת ב', percentage: 100 },
  '138': { description: 'משמרת ב + 25%', percentage: 125 },
  '143': { description: 'תוספות 40%', percentage: 140 },
  '152': { description: 'שעות נוספות 245%', percentage: 245 },
  '154': { description: 'שעות נוספות 280%', percentage: 280 },
  '302': { description: 'אשל', allowanceValue: 60 },
  '481': { description: 'חופשה', percentage: 100, hoursPerUnit: 8.4 }
};

// ===== UI =====
const qs = sel => document.querySelector(sel);
const dropZone = qs('#dropZone');
const fileInput = qs('#fileInput');
const baseRateInput = qs('#baseRate');
const salaryBody = qs('#salaryBody');
const totalSalaryCell = qs('#totalSalary');
const exportBtn = qs('#exportBtn');
const clearBtn = qs('#clearBtn');
const statusEl = qs('#status');

// טעינת מצב קיים
let state = loadState();
if (state) {
  baseRateInput.value = state.baseRate || 0;
  renderRows(state.rows || []);
  calculate();
}

// ===== אירועים =====
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', evt => {
  evt.preventDefault();
  dropZone.classList.add('drag');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', evt => {
  evt.preventDefault();
  dropZone.classList.remove('drag');
  const file = evt.dataTransfer.files[0];
  handleFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  handleFile(file);
});

baseRateInput.addEventListener('input', debounce(() => {
  calculate();
  saveState();
}, 300));

clearBtn.addEventListener('click', () => {
  salaryBody.innerHTML = '';
  totalSalaryCell.textContent = formatCurrency(0);
  state = { baseRate: 0, rows: [] };
  baseRateInput.value = '0';
  fileInput.value = '';
  saveState();
});

exportBtn.addEventListener('click', () => {
  const rows = getRowsData();
  const csv = rowsToCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'salary.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// ===== לוגיקה =====
async function handleFile(file) {
  if (!file || file.type !== 'application/pdf') {
    return setStatus('קובץ לא תקין - נדרש PDF', true);
  }
  try {
    setStatus('מעבד קובץ...', false);
    const text = await PDFProcessor.extractText(file);
    const rows = PDFProcessor.parseData(text);
    renderRows(rows);
    calculate();
    saveState();
    setStatus('הקובץ נטען בהצלחה');
  } catch (err) {
    console.error(err);
    setStatus('שגיאה בעיבוד הקובץ', true);
  }
}

const PDFProcessor = {
  async extractText(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n';
    }
    return text;
  },

  parseData(text) {
    const rows = [];
    Object.entries(CODE_MAP).forEach(([code, info]) => {
      const regex = new RegExp(code + '\\s+(\\d+(?:\\.\\d+)?)', 'g');
      let match; let total = 0;
      while ((match = regex.exec(text)) !== null) {
        total += parseFloat(match[1]);
      }
      if (total > 0) {
        const row = { code, description: info.description };
        if (info.allowance || info.allowanceValue) {
          row.count = total;
        } else if (info.hoursPerUnit) {
          row.hours = total * info.hoursPerUnit;
        } else {
          row.hours = total;
        }
        rows.push(row);
      }
    });
    return rows;
  }
};

function renderRows(rows) {
  salaryBody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.code}</td>
      <td>${row.description}</td>
      <td><input type="number" class="hours" value="${row.hours || row.count || 0}" step="0.01"></td>
      <td>${getPercentage(row.code)}</td>
      <td class="amount">₪0.00</td>`;
    salaryBody.appendChild(tr);
    const hoursInput = tr.querySelector('.hours');
    hoursInput.addEventListener('input', debounce(() => {
      calculate();
      saveState();
    }, 300));
  });
}

function calculate() {
  const baseRate = parseFloat(baseRateInput.value) || 0;
  let total = 0;
  const rows = getRowsData();
  rows.forEach((row, idx) => {
    const info = CODE_MAP[row.code];
    let amount = 0;
    if (info.allowance) {
      amount = row.hours; // נסיעות - סוכם כערך כספי
    } else if (info.allowanceValue) {
      amount = (row.hours || 0) * info.allowanceValue;
    } else {
      const perc = info.percentage || 100;
      const hours = row.hours || 0;
      amount = hours * baseRate * (perc / 100);
    }
    total += amount;
    const amountCell = salaryBody.rows[idx].querySelector('.amount');
    amountCell.textContent = formatCurrency(amount);
  });
  totalSalaryCell.textContent = formatCurrency(total);
}

function getRowsData() {
  const data = [];
  Array.from(salaryBody.rows).forEach(row => {
    const code = row.cells[0].textContent.trim();
    const description = row.cells[1].textContent.trim();
    const hours = parseFloat(row.querySelector('.hours').value) || 0;
    data.push({ code, description, hours });
  });
  return data;
}

function getPercentage(code) {
  const info = CODE_MAP[code];
  if (info.allowance || info.allowanceValue) return '—';
  return info.percentage ? info.percentage + '%' : '100%';
}

function rowsToCsv(rows) {
  const header = ['קוד', 'תיאור', 'שעות'];
  const lines = [header.join(',')];
  rows.forEach(r => {
    lines.push([r.code, r.description, r.hours].join(','));
  });
  return lines.join('\n');
}

function formatCurrency(num) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
}

function setStatus(msg, isError=false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('status--error', isError);
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

function saveState() {
  const rows = getRowsData();
  state = { baseRate: baseRateInput.value, rows };
  localStorage.setItem('salaryState', JSON.stringify(state));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem('salaryState'));
  } catch {
    return null;
  }
}
