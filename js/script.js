// ===== הגדרות =====
const ILS = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 });
const F2 = n => Number.isFinite(n) ? n.toFixed(2) : '0.00';

// סיסמת גישה
const PASSWORD = "chilan2025";

// ===== נתוני המשמרות =====
const salaryData = [
  { type: 'משמרת א', percentage: 100, hours: 0 },
  { type: 'משמרת ב', percentage: 100, hours: 0 },
  { type: 'משמרת ג', percentage: 100, hours: 0 },
  { type: 'עודפות 100%', percentage: 100, hours: 0 },
  { type: 'תוספות 25%', percentage: 25, hours: 0 },
  { type: 'תוספות 40%', percentage: 40, hours: 0 },
  { type: 'תוספות 75%', percentage: 75, hours: 0 },
  { type: '125%', percentage: 125, hours: 0 },
  { type: '150%', percentage: 150, hours: 0 },
  { type: '156.25%', percentage: 156.25, hours: 0 },
  { type: '175%', percentage: 175, hours: 0 },
  { type: '187.5%', percentage: 187.5, hours: 0 },
  { type: '200%', percentage: 200, hours: 0 },
  { type: '210%', percentage: 210, hours: 0 },
  { type: '218.75%', percentage: 218.75, hours: 0 },
  { type: '245%', percentage: 245, hours: 0 },
  { type: '250%', percentage: 250, hours: 0 },
  { type: '263%', percentage: 263, hours: 0 },
  { type: '280%', percentage: 280, hours: 0 }
];

// ===== אתחול =====
document.addEventListener('DOMContentLoaded', () => {
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  
  setupPasswordModal();
  
  const yearEl = document.getElementById('y');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

// ===== סיסמא =====
function setupPasswordModal() {
  const modal = document.getElementById('passwordModal');
  const input = document.getElementById('passwordInput');
  const submit = document.getElementById('passwordSubmit');
  const error = document.getElementById('passwordError');
  const mainContent = document.getElementById('mainContent');

  // בדיקה אם כבר הוזנה סיסמא
  if (sessionStorage.getItem('chilan_authenticated') === 'true') {
    showMainContent();
    return;
  }

  function checkPassword() {
    const password = input.value;
    if (password === PASSWORD) {
      sessionStorage.setItem('chilan_authenticated', 'true');
      showMainContent();
    } else {
      error.textContent = 'סיסמא שגויה';
      input.value = '';
      input.focus();
    }
  }

  function showMainContent() {
    modal.style.display = 'none';
    mainContent.style.display = 'block';
    initializeApp();
  }

  submit.addEventListener('click', checkPassword);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkPassword();
  });

  // התמקד בשדה הסיסמא
  input.focus();
}

function initializeApp() {
  initializeTable();
  setupFileUpload();
  calculateSalary();
  wireUi();
}

// ===== UI =====
function wireUi(){
  document.getElementById('baseRate').addEventListener('input', calculateSalary);
  document.getElementById('vacationDays').addEventListener('input', calculateSalary);
  document.getElementById('travelAmount').addEventListener('input', calculateSalary);
  document.getElementById('mealDays').addEventListener('input', calculateSalary);
  
  const btnClear = document.getElementById('btnClear');
  if (btnClear) {
    btnClear.addEventListener('click', () => { clearData(); hideStatusAll(); });
  }
  
  const btnExport = document.getElementById('btnExport');
  if (btnExport) {
    btnExport.addEventListener('click', exportData);
  }
  
  const dm = document.getElementById('btnDarkMode');
  if(dm){
    dm.addEventListener('click', () => {
      document.documentElement.classList.toggle('light');
      dm.textContent = document.documentElement.classList.contains('light') ? 'מצב בהיר' : 'מצב כהה';
    });
  }
}

// ===== טבלה =====
function initializeTable(){
  const tbody = document.getElementById('salaryTableBody');
  tbody.innerHTML = '';
  const baseRate = parseFloat(document.getElementById('baseRate').value) || 0;
  
  salaryData.forEach((row, index) => {
    const rate = baseRate * row.percentage / 100;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align:right;font-weight:500;">${row.type}</td>
      <td>${row.percentage}%</td>
      <td>${ILS.format(rate)}</td>
      <td>
        <input type="number" value="${row.hours}" step="0.01"
          class="hours-input" inputmode="decimal"
          aria-label="שעות עבור ${row.type}"
          onchange="updateHours(${index}, this.value)">
      </td>
      <td class="amount-cell" id="amount-${index}">${ILS.format(0)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateHours(i, h){
  salaryData[i].hours = parseFloat(h) || 0;
  calculateSalary();
}

// ===== חישוב =====
function calculateSalary(){
  const baseRate = parseFloat(document.getElementById('baseRate').value) || 0;
  let totalHours = 0, totalAmount = 0;
  
  salaryData.forEach((row, i) => {
    const rate = baseRate * row.percentage / 100;
    const amount = row.hours * rate;
    totalAmount += amount; 
    totalHours += row.hours;
    
    const amountCell = document.getElementById(`amount-${i}`);
    if(amountCell) amountCell.textContent = ILS.format(amount);
  });

  const vacationDays = parseInt(document.getElementById('vacationDays').value) || 0;
  const travelAmount = parseFloat(document.getElementById('travelAmount').value) || 0;
  const mealDays = parseInt(document.getElementById('mealDays').value) || 0;

  const vacationAmount = vacationDays * 8.4 * baseRate;
  const mealAmount = mealDays * 60;

  // נסיעות לא יופיעו בחישוב אם הם 700
  totalAmount += vacationAmount + (travelAmount === 700 ? 0 : travelAmount) + mealAmount;

  document.getElementById('totalSalary').textContent = ILS.format(totalAmount);
  document.getElementById('totalHours').textContent = (Math.round(totalHours * 10) / 10).toFixed(1);
  
  updatePreview();
}

// ===== תצוגה מקדימה =====
function updatePreview() {
  const previewSection = document.getElementById('previewSection');
  const previewData = document.getElementById('previewData');
  
  // בדוק אם יש נתונים להציג
  const hasData = salaryData.some(row => row.hours > 0) || 
                  parseInt(document.getElementById('vacationDays').value) > 0 ||
                  (parseFloat(document.getElementById('travelAmount').value) || 0) !== 700 ||
                  parseInt(document.getElementById('mealDays').value) > 0;
  
  if (!hasData) {
    previewSection.style.display = 'none';
    return;
  }
  
  previewSection.style.display = 'block';
  
  let previewText = generatePreviewData();
  previewData.innerHTML = `<code style="background: var(--surface); color: var(--text); padding: 12px; border-radius: 8px; display: block; white-space: pre-wrap; font-family: 'Courier New', monospace; border: 1px solid var(--border); font-size: 13px; line-height: 1.5;">${previewText}</code>`;
}

function generatePreviewData() {
  const baseRate = parseFloat(document.getElementById('baseRate').value) || 0;
  let lines = [];
  
  // כותרת
  lines.push('═══ שורת הסה"כ לדוח חילן ═══');
  lines.push('');
  
  // נתוני שעות - רק אלו שיש בהם ערכים
  const dataPoints = [];
  
  salaryData.forEach((row, i) => {
    if (row.hours > 0) {
      dataPoints.push(`${row.type}: ${F2(row.hours)} שעות`);
    }
  });
  
  if (dataPoints.length > 0) {
    lines.push('📊 שעות עבודה:');
    dataPoints.forEach(point => lines.push(`  • ${point}`));
    lines.push('');
  }
  
  // תוספות
  const vacationDays = parseInt(document.getElementById('vacationDays').value) || 0;
  const travelAmount = parseFloat(document.getElementById('travelAmount').value) || 0;
  const mealDays = parseInt(document.getElementById('mealDays').value) || 0;
  
  const additions = [];
  if (vacationDays > 0) {
    additions.push(`ימי חופש: ${vacationDays} ימים`);
  }
  
  if (travelAmount !== 700 && travelAmount > 0) {
    additions.push(`נסיעות: ${travelAmount}₪`);
  }
  
  if (mealDays > 0) {
    additions.push(`ימי אשל: ${mealDays} ימים`);
  }
  
  if (additions.length > 0) {
    lines.push('💰 תוספות:');
    additions.forEach(addition => lines.push(`  • ${addition}`));
    lines.push('');
  }
  
  const totalAmount = parseFloat(document.getElementById('totalSalary').textContent.replace(/[^\d.]/g, ''));
  const totalHours = document.getElementById('totalHours').textContent;
  lines.push('═══════════════════════════');
  lines.push(`📈 סה"כ שכר: ${ILS.format(totalAmount)}`);
  lines.push(`⏰ סה"כ שעות: ${totalHours}`);
  lines.push('═══════════════════════════');
  lines.push('');
  lines.push('💡 העתק את הנתונים הללו ל:');
  lines.push('   • מייל למנהל/משאבי אנוש');
  lines.push('   • דוח נוכחות מסכם');
  lines.push('   • מערכת שכר החברה');
  
  return lines.join('\n');
}

function copyPreviewData() {
  const text = generatePreviewData();
  navigator.clipboard.writeText(text).then(() => {
    showStatus('success', 'הנתונים הועתקו ללוח בהצלחה!');
  }).catch(() => {
    showStatus('error', 'שגיאה בהעתקה ללוח');
  });
}

// ===== העלאת קובץ =====
function setupFileUpload(){
  const fileInput = document.getElementById('fileInput');
  const uploadZone = document.getElementById('uploadZone');
  
  fileInput.addEventListener('change', handleFileSelect);

  ['dragenter','dragover','dragleave','drop'].forEach(ev => uploadZone.addEventListener(ev, preventDefaults, false));
  ['dragenter','dragover'].forEach(ev => uploadZone.addEventListener(ev, () => uploadZone.classList.add('dragover'), false));
  ['dragleave','drop'].forEach(ev => uploadZone.addEventListener(ev, () => uploadZone.classList.remove('dragover'), false));
  uploadZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e){ 
  e.preventDefault(); 
  e.stopPropagation(); 
}

function handleDrop(e){ 
  const f = e.dataTransfer.files?.[0]; 
  if(f) processFile(f); 
}

function handleFileSelect(e){ 
  const f = e.target.files?.[0]; 
  if(f) processFile(f); 
}

// ===== עיבוד קובץ PDF =====
async function processFile(file){
  if (file.type !== 'application/pdf') { 
    showStatus('error', 'אנא בחר קובץ PDF בלבד');
    return; 
  }
  
  showStatus('processing', 'מעבד קובץ PDF...');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    const result = parseChilanData(fullText);

    if (result.success) {
      applyDataToCalculator(result.data);
      
      // הצג סיכום של מה שזוהה
      let summary = `✅ נתונים עודכנו בהצלחה!\n`;
      summary += `📄 מקור: ${result.source || 'דוח נוכחות'}\n\n`;
      summary += '🔍 נתונים שזוהו:\n';
      
      const hebrewNames = {
        'regularHours': 'שעות רגילות (101)',
        'shiftB': 'משמרת ב\' (137)',
        'shiftC': 'משמרת ג\' (134)',
        'shiftB25': 'תוספת ב\' 25% (138)',
        'weekend40': 'תוספת ג\' 40% (143)',
        'overtime150': 'שעות נוספות 150% (135)',
        'overtime175': 'שעות נוספות 175% (105)',
        'overtime245': 'שעות נוספות 245% (152)',
        'overtime280': 'שעות נוספות 280% (154)',
        'travel': 'נסיעות (013/014)',
        'allowance': 'אשל (302)',
        'vacation': 'חופש (481)',
        'vacationPay': 'תשלום חופש (125)'
      };
      
      Object.keys(result.data).forEach(key => {
        const name = hebrewNames[key] || key;
        summary += `• ${name}: ${result.data[key]}\n`;
      });
      
      console.log('📊 נתונים מהדוח:', result.data);
      console.log('📄 סוג דוח:', result.source);
      showStatus('success', summary);
    } else {
      showStatus('error', result.error);
    }
    
  } catch (err) {
    const errorMsg = '❌ שגיאה בעיבוד הקובץ: ' + (err?.message || err);
    console.error('שגיאה:', err);
    showStatus('error', errorMsg);
  }
}

// ===== זיהוי קודי חילן =====
function parseChilanData(text) {
  const data = {};
  
  const cleanText = text.replace(/\u200f|\u200e|,/g, ' ').replace(/\s+/g, ' ');
  const lines = cleanText.split('\n');
  
  // בדיקה אם זה תלוש שכר או דוח נוכחות
  const isPayslip = text.includes('תלוש שכר') || text.includes('פרוט התשלומים') || text.includes('ניכויים');
  
  // זיהוי תעריף בסיס
  const hourlyRatePatterns = [
    /ת\.שעה\s*(\d+\.?\d*)/gi,
    /ה\.עש\s*(\d+\.?\d*)/gi,
    /תעריף[^\d]*(\d+\.?\d*)/gi,
    /(\d+\.?\d*)\s*ש[״"]ח?\s*לשעה/gi
  ];
  
  for (const pattern of hourlyRatePatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      for (const match of matches) {
        const numbers = match[0].match(/\d+\.?\d*/g);
        if (numbers) {
          const rate = parseFloat(numbers[0]);
          if (rate > 30 && rate < 200) {
            document.getElementById('baseRate').value = rate;
            break;
          }
        }
      }
      if (document.getElementById('baseRate').value != 61.45) break;
    }
  }

  // מיפוי קודי חילן
  const codeMapping = {
    '013': 'travel',
    '014': 'travel',
    '101': 'regularHours',
    '105': 'overtime175',
    '125': 'vacationPay',
    '134': 'shiftC',
    '135': 'overtime150',
    '137': 'shiftB',
    '138': 'shiftB25',
    '143': 'weekend40',
    '152': 'overtime245',
    '154': 'overtime280',
    '302': 'allowance',
    '481': 'vacation'
  };

  if (isPayslip) {
    // זיהוי מתלוש שכר - חיפוש לפי קוד ושעות
    lines.forEach((line, index) => {
      Object.keys(codeMapping).forEach(code => {
        // חפש שורה שמכילה את הקוד
        if (line.includes(code)) {
          // נסה למצוא מספרים בשורה
          const numbers = line.match(/\d+\.?\d*/g);
          
          if (numbers && numbers.length >= 2) {
            // בתלוש, הסדר בדרך כלל הוא: סכום, כמות/שעות, [אחוזים], תעריף, קוד
            // או: כמות, תעריף, סכום
            
            // נסה למצוא את השעות - זה המספר שלא גדול מדי (לא סכום) ולא תעריף
            let hours = null;
            for (const num of numbers) {
              const val = parseFloat(num);
              // שעות בדרך כלל בין 0.1 ל-200
              // תעריף בדרך כלל בין 30 ל-200
              // סכום בדרך כלל מעל 100
              
              // אם זה קוד 302 (אשל) - חפש ימים או סכום
              if (code === '302') {
                if (val >= 1 && val <= 31) {
                  hours = val; // ימים
                  break;
                } else if (val > 100 && val < 2000) {
                  hours = val; // סכום - נמיר לימים בהמשך
                  break;
                }
              }
              // אם זה קוד 013/014 (נסיעות) - זה בדרך כלל סכום
              else if (code === '013' || code === '014') {
                if (val > 0) {
                  hours = val;
                  break;
                }
              }
              // שעות עבודה
              else if (val > 0.5 && val < 250 && val !== parseFloat(document.getElementById('baseRate').value)) {
                hours = val;
                break;
              }
            }
            
            if (hours !== null && codeMapping[code]) {
              data[codeMapping[code]] = hours;
            }
          }
        }
      });
    });
  } else {
    // זיהוי מדוח נוכחות - הגישה המקורית המשופרת
    let codesLine = -1;
    let numbersLine = -1;
    
    // מצא את השורה עם הקודים
    lines.forEach((line, index) => {
      const codeMatches = line.match(/\d{3}/g) || [];
      const hasMultipleCodes = codeMatches.length >= 5;
      const hasCodeLabels = line.includes('נסיעות') || line.includes('ש.') || line.includes('מש.');
      
      if (hasMultipleCodes && hasCodeLabels) {
        codesLine = index;
      }
    });

    if (codesLine >= 0) {
      const codesText = lines[codesLine];
      const codeMatches = [...codesText.matchAll(/(\d{3})\s*-?[^\d]*/g)];
      const orderedCodes = codeMatches.map(m => m[1]).filter(c => codeMapping[c]);
      
      // חפש את שורת המספרים
      for (let i = codesLine + 1; i < Math.min(codesLine + 5, lines.length); i++) {
        const numbersInLine = lines[i].match(/\d+\.?\d*/g);
        if (numbersInLine && numbersInLine.length >= orderedCodes.length - 2) {
          numbersLine = i;
          break;
        }
      }

      if (numbersLine >= 0) {
        const numbers = lines[numbersLine].match(/\d+\.?\d*/g);
        
        // מיפוי לפי סדר
        orderedCodes.forEach((code, idx) => {
          if (numbers[idx]) {
            const value = parseFloat(numbers[idx]);
            if (value > 0 && value < 1000 && codeMapping[code]) {
              data[codeMapping[code]] = value;
            }
          }
        });
      }
    }

    // חיפוש נוסף לקודים 302 ו-481
    lines.forEach((line, index) => {
      if (line.includes('302') || line.includes('481')) {
        const nextLine = lines[index + 1] || '';
        const numbers = nextLine.match(/\d+\.?\d*/g);
        
        if (numbers) {
          if (line.includes('302') && numbers[0]) {
            data.allowance = parseFloat(numbers[0]);
          }
          if (line.includes('481') && numbers[1]) {
            data.vacation = parseFloat(numbers[1]);
          }
        }
      }
    });
  }

  const foundCount = Object.keys(data).length;
  
  return foundCount > 0 ? 
    { success: true, data, source: isPayslip ? 'תלוש שכר' : 'דוח נוכחות' } : 
    { success: false, error: '⚠️ לא נמצאו נתוני חילן בדוח. וודא שהקובץ כולל את פרטי השכר או השורות עם הקודים.' };
}

// ===== מיפוי נתונים למחשבון =====
function applyDataToCalculator(data) {
  const mapping = {
    'regularHours': 0,     // משמרת א' - שעות רגילות
    'shiftB': 1,           // משמרת ב'
    'shiftC': 2,           // משמרת ג'
    'shiftB25': 4,         // תוספות 25%
    'weekend40': 5,        // תוספות 40%
    'overtime150': 8,      // 150%
    'overtime175': 10,     // 175%
    'overtime245': 15,     // 245%
    'overtime280': 18      // 280%
  };

  // איפוס כל השעות
  salaryData.forEach(row => row.hours = 0);

  Object.keys(data).forEach(key => {
    const rowIndex = mapping[key];
    if (Number.isInteger(rowIndex) && rowIndex < salaryData.length) {
      salaryData[rowIndex].hours = data[key];
    }

    // טיפול בימי חופש - קוד 481 או 125
    if ((key === 'vacation' || key === 'vacationPay') && data[key] > 0) {
      const baseRate = parseFloat(document.getElementById('baseRate').value) || 61.45;
      const days = Math.round(data[key] / (8.4 * baseRate));
      const currentDays = parseInt(document.getElementById('vacationDays').value) || 0;
      document.getElementById('vacationDays').value = Math.max(currentDays, days);
    }
    
    // טיפול בנסיעות - קוד 013
    if (key === 'travel' && data[key] > 0) {
      // בדוק אם זה מספר שעות או סכום כסף
      if (data[key] < 50) {
        // כנראה שעות - המר לסכום
        document.getElementById('travelAmount').value = data[key] * 35;
      } else {
        // סכום כסף
        document.getElementById('travelAmount').value = data[key];
      }
    }
    
    // טיפול באשל - קוד 302
    if (key === 'allowance' && data[key] > 0) {
      // בדוק אם זה מספר ימים או סכום
      if (data[key] < 50) {
        // ימים
        document.getElementById('mealDays').value = data[key];
      } else {
        // סכום - חלק ב-60
        const days = Math.round(data[key] / 60);
        document.getElementById('mealDays').value = days;
      }
    }
  });

  initializeTable();
  calculateSalary();
}

// ===== סטטוסים =====
function showStatus(kind, message){
  hideStatusAll();
  const p = document.getElementById('statusPanel');
  if (p) p.style.display = 'block';

  if(kind === 'processing'){
    const el = document.getElementById('statusProcessing');
    if (el) {
      el.classList.add('show');
      const textEl = document.getElementById('statusText');
      if (textEl) textEl.textContent = message;
    }
  } else if(kind === 'success'){
    const el = document.getElementById('statusSuccess');
    if (el) {
      el.classList.add('show');
      const textEl = document.getElementById('successText');
      if (textEl) textEl.textContent = message;
      setTimeout(hideStatusAll, 3000);
    }
  } else {
    const el = document.getElementById('statusError');
    if (el) {
      el.classList.add('show');
      const textEl = document.getElementById('errorText');
      if (textEl) textEl.textContent = message;
    }
  }
}

function hideStatusAll(){
  ['statusProcessing','statusSuccess','statusError'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.classList.remove('show');
  });
  const p = document.getElementById('statusPanel');
  if(p) p.style.display = 'none';
}

// ===== ניקוי/ייצוא =====
function clearData(){
  salaryData.forEach(r => r.hours = 0);
  document.getElementById('baseRate').value = 61.45;
  document.getElementById('vacationDays').value = 0;
  document.getElementById('travelAmount').value = 700; // ברירת מחדל 700
  document.getElementById('mealDays').value = 0;
  initializeTable();
  calculateSalary();
  
  // הסתר תצוגה מקדימה
  document.getElementById('previewSection').style.display = 'none';
  
  showStatus('success', '🧹 נתונים נוקו בהצלחה');
}

function exportData(){
  const baseRate = parseFloat(document.getElementById('baseRate').value) || 0;
  let rows = ['סוג משמרת,אחוז,תעריף,שעות,סכום'];
  
  salaryData.forEach(r => {
    if(r.hours > 0){
      const rate = (baseRate * r.percentage / 100);
      const amount = r.hours * rate;
      rows.push(`${r.type},${r.percentage}%,${F2(rate)},${F2(r.hours)},${F2(amount)}`);
    }
  });
  
  const vacationDays = parseInt(document.getElementById('vacationDays').value) || 0;
  const travelAmount = parseFloat(document.getElementById('travelAmount').value) || 0;
  const mealDays = parseInt(document.getElementById('mealDays').value) || 0;

  if(vacationDays || (travelAmount !== 700 && travelAmount > 0) || mealDays){
    rows.push('');
    rows.push('תוספות');
    if(vacationDays) rows.push(`ימי חופש,${vacationDays},${F2(vacationDays*8.4*baseRate)}`);
    if(travelAmount !== 700 && travelAmount > 0) rows.push(`נסיעות,,${F2(travelAmount)}`);
    if(mealDays) rows.push(`ימי אשל,${mealDays},${F2(mealDays*60)}`);
  }

  const total = document.getElementById('totalSalary').textContent.replace(/[^\d.]/g,'');
  rows.push('');
  rows.push(`סה"כ משכורת,,${total}`);

  const csv = '\uFEFF' + rows.join('\n');
  const d = new Date();
  const filename = `חישוב_שכר_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.csv`;

  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  showStatus('success', '📊 נתונים יוצאו בהצלחה!');
}
