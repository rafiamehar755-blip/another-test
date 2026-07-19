const DB_URL = "https://script.google.com/macros/s/AKfycbz7vTFZevifbAMfMHH7XxG7cI3Zgv_uCnLgK1DKfdhCQ3LF__JC4HIH8wvTH5BKhL59Uw/exec";
const SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1OympSCR6CIcQ0re9kdGRf3noTUfSw2Tgvm-oPRoHD10/gviz/tq?tqx=out:csv";

let currentYear = new Date().getFullYear();
let parsedLibrary = {};
let flatItemLibrary = {};
let hasEstimatorBeenRun = false;
let sectionCount = 0;
let itemCount = 0;
let cachedRecentQuotes = [];
let calculatedNextNum = localStorage.getItem('nextQuotNum') || 215;

function determineNextReferenceNumber(quotes) {
  if (!quotes || quotes.length === 0) return;
  
  let maxNum = 214;
  
  quotes.forEach(q => {
    if (q.ref) {
      const numMatch = q.ref.match(/\d+$/);
      if (numMatch) {
        const num = parseInt(numMatch[0]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  calculatedNextNum = maxNum + 1;
  localStorage.setItem('nextQuotNum', calculatedNextNum);

  const quotRefEl = document.getElementById('quotRef');
  if (quotRefEl) {
    const currentVal = quotRefEl.value;
    const currentNumMatch = currentVal.match(/\d+$/);
    if (!currentVal || (currentNumMatch && parseInt(currentNumMatch[0]) <= calculatedNextNum)) {
      quotRefEl.value = "AA-" + currentYear + "-" + calculatedNextNum;
    }
  }
}

function startNewQuotation() {
  if (confirm("Start a new quotation? This will clear current unsaved inputs.")) {
    document.getElementById('clientAddr').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('discountAED').value = '0';
    document.getElementById('vatToggle').value = 'no';
    document.getElementById('sectionsContainer').innerHTML = '';
    
    const quotRefEl = document.getElementById('quotRef');
    if (quotRefEl) {
      quotRefEl.value = "AA-" + currentYear + "-" + calculatedNextNum;
    }

    const sId = addSection("Section 1");
    addItemToSection(sId);
    generateQuotation();
  }
}

const IDB_DB_NAME = 'AhmadAluDirectoryDB';
const IDB_STORE_NAME = 'handles';
const IDB_KEY_NAME = 'savedFolder';

function getIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = (e) => { e.target.result.createObjectStore(IDB_STORE_NAME); };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveDirectoryHandle(handle) {
  const db = await getIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    const req = store.put(handle, IDB_KEY_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function loadDirectoryHandle() {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(IDB_KEY_NAME);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { return null; }
}

let savedFolderHandle = null;

async function selectAutoSaveFolder() {
  if (!window.showDirectoryPicker) {
    alert("This browser doesn't fully support the local File System Access API. Standard downloads will go to your default Downloads folder instead.");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await saveDirectoryHandle(handle);
    savedFolderHandle = handle;
    updateFolderStatusUI(handle.name);
    alert(`Success! Automatic save folder registered: "${handle.name}".`);
  } catch (e) {
    console.error(e);
    alert("Folder selection cancelled or failed.");
  }
}

function updateFolderStatusUI(folderName) {
  const statusEl = document.getElementById('folderStatus');
  if (statusEl) {
    statusEl.innerHTML = folderName ? `Status: Auto-saving to <strong style="color: #16a34a;">${folderName}</strong>` : `Status: Default Downloads folder`;
  }
}

async function initFolderSelection() {
  const handle = await loadDirectoryHandle();
  if (handle) {
    savedFolderHandle = handle;
    updateFolderStatusUI(handle.name);
  }
}

async function verifyPermission(fileHandle, readWrite) {
  const options = {};
  if (readWrite) { options.mode = 'readwrite'; }
  if ((await fileHandle.queryPermission(options)) === 'granted') { return true; }
  if ((await fileHandle.requestPermission(options)) === 'granted') { return true; }
  return false;
}

function switchMobileTab(tab) {
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('formPanel').classList.remove('active');
  const previewPanel = document.querySelector('.preview-panel');
  previewPanel.classList.remove('active');

  if (tab === 'form') {
    document.getElementById('formPanel').classList.add('active');
    event.currentTarget.classList.add('active');
  } else {
    previewPanel.classList.add('active');
    event.currentTarget.classList.add('active');
    generateQuotation(); 
  }
}

function copyToClipboard(btn, ibanText) {
  navigator.clipboard.writeText(ibanText.replace(/\s+/g, '')).then(() => {
    const originalContent = btn.innerHTML;
    btn.style.borderColor = '#16a34a';
    btn.style.color = '#16a34a';
    btn.innerHTML = `<span>Copied!</span><span style="font-size:11px;">✅</span>`;
    setTimeout(() => {
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.innerHTML = originalContent;
    }, 1500);
  }).catch(err => { console.error("Failed to copy IBAN text", err); });
}

function fetchRecentQuotes() {
  const listEl = document.getElementById('recentQuotesList');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 10px;">Loading History...</div>';
  
  const cacheBusterUrl = DB_URL + (DB_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
  
  fetch(cacheBusterUrl)
  .then(res => {
    if (!res.ok) throw new Error("HTTP error " + res.status);
    return res.json();
  })
  .then(quotes => {
    cachedRecentQuotes = quotes;
    renderRecentQuotes(quotes);
    determineNextReferenceNumber(quotes);
  })
  .catch(err => {
    console.error(err);
    listEl.innerHTML = `
      <div style="text-align: center; color: #ef4444; padding: 8px; font-size: 10px; line-height: 1.4;">
        ⚠️ Connection Error<br>
        <span style="font-size:9px; color:#64748b;">Ensure Web App is deployed as "Anyone"</span>
      </div>`;
  });
}

function renderRecentQuotes(quotes) {
  const listEl = document.getElementById('recentQuotesList');
  if (!listEl) return;
  if (!quotes || quotes.length === 0) {
    listEl.innerHTML = '<div style="text-align: center; color: #64748b; padding: 10px;">No quotations found</div>';
    return;
  }
  
  function getNumericRef(refStr) {
    if (!refStr) return 0;
    const match = refStr.match(/\d+$/);
    return match ? parseInt(match[0], 10) : 0;
  }

  const sortedQuotes = [...quotes].sort((a, b) => getNumericRef(b.ref) - getNumericRef(a.ref));

  listEl.innerHTML = '';
  sortedQuotes.forEach(q => {
    const div = document.createElement('div');
    div.style.padding = '8px';
    div.style.borderBottom = '1px solid #e2e8f0';
    div.style.cursor = 'pointer';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.className = 'recent-quote-item';
    
    let total = 0;
    if (q.itemsJson) {
      try {
        const items = JSON.parse(q.itemsJson);
        let subtotal = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        
        let discount = 0;
        let isVat = false;
        if (items.length > 0) {
          const firstItem = items[0];
          if (firstItem.discount !== undefined) {
            discount = parseFloat(firstItem.discount) || 0;
          }
          if (firstItem.vat !== undefined) {
            isVat = (firstItem.vat === 'yes');
          }
        }
        
        let netTotal = Math.max(0, subtotal - discount);
        let vat = isVat ? netTotal * 0.05 : 0;
        total = netTotal + vat;
      } catch(e) {}
    }
    
    const displayTotal = total.toLocaleString('en', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    div.innerHTML = `
      <span><strong>${q.ref}</strong> - ${q.clientAddr || 'No Address'}</span>
      <span style="color:#16a34a;font-weight:bold;">AED ${displayTotal}</span>
    `;
    div.onclick = () => loadQuoteFromDirectory(q);
    listEl.appendChild(div);
  });
}

function filterRecentQuotes() {
  const term = document.getElementById('searchQuotes').value.toLowerCase();
  const filtered = cachedRecentQuotes.filter(q => 
    (q.ref && q.ref.toLowerCase().includes(term)) || 
    (q.clientAddr && q.clientAddr.toLowerCase().includes(term))
  );
  renderRecentQuotes(filtered);
}

function loadQuoteFromDirectory(q) {
  document.getElementById('quotRef').value = q.ref || '';
  document.getElementById('clientAddr').value = q.clientAddr || '';
  document.getElementById('clientPhone').value = q.clientPhone || '';
  document.getElementById('clientEmail').value = q.clientEmail || '';
  document.getElementById('subject').value = q.subject || '';
  
  if (q.date) {
    try {
      const d = new Date(q.date);
      if (!isNaN(d.getTime())) {
        document.getElementById('quotDate').valueAsDate = d;
      }
    } catch(e) {}
  }

  if (q.itemsJson) {
    try {
      const itemsData = JSON.parse(q.itemsJson);
      deserializeItems(itemsData);
    } catch(e) { console.error("Could not parse itemsJson", e); }
  }
  generateQuotation();
  alert(`Loaded Quotation: Ref "${q.ref}" for "${q.clientAddr || 'No Name'}".`);
}

function deserializeItems(itemsData) {
  document.getElementById('sectionsContainer').innerHTML = '';
  sectionCount = 0;
  itemCount = 0;
  
  if (itemsData && itemsData.length > 0) {
    const firstItem = itemsData[0];
    if (firstItem.discount !== undefined) {
      document.getElementById('discountAED').value = firstItem.discount;
    } else {
      document.getElementById('discountAED').value = '0';
    }
    
    if (firstItem.vat !== undefined) {
      document.getElementById('vatToggle').value = firstItem.vat;
    } else {
      document.getElementById('vatToggle').value = 'no';
    }
  } else {
    document.getElementById('discountAED').value = '0';
    document.getElementById('vatToggle').value = 'no';
  }

  let lastSectionTitle = null;
  let currentSectionId = null;

  itemsData.forEach(item => {
    const secTitle = item.sectionTitle || 'Section 1';
    if (secTitle !== lastSectionTitle) {
      currentSectionId = addSection(secTitle);
      lastSectionTitle = secTitle;
    }
    
    const rateVal = (item.rate !== undefined && item.rate !== '') ? item.rate : 
                    (item.price !== undefined && item.price !== '') ? item.price : 
                    (item.amount !== undefined) ? item.amount : '';
    
    let isFixed = item.priceType === 'Fixed';
    if (item.priceType === undefined) {
      if (item.rate === undefined && item.price === undefined && item.amount !== undefined) {
        isFixed = true; 
      } else if (item.size === '-' || !item.size) {
        isFixed = true;
      }
    }

    addItemToSection(currentSectionId, item.itemName || '', item.desc || '', rateVal, isFixed);
    const id = itemCount;
    
    const calcEl = document.getElementById('calc_' + id);
    if (calcEl && item.size) { calcEl.dataset.sizeText = item.size; }
    if (calcEl && item.roundedArea) { calcEl.dataset.roundedArea = item.roundedArea; }

    if (item.sizes && Array.isArray(item.sizes)) {
      let hasSizeData = false;
      item.sizes.forEach((sz, idx) => {
        const s = idx + 1;
        if (s <= 4) {
          const wVal = sz.w || '';
          const hVal = sz.h || '';
          const qtyVal = sz.qty || '';
          document.getElementById(`w${s}_${id}`).value = wVal;
          document.getElementById(`h${s}_${id}`).value = hVal;
          document.getElementById(`qty${s}_${id}`).value = qtyVal;
          if (wVal !== '' || hVal !== '') { hasSizeData = true; }
        }
      });
      if (hasSizeData) {
        document.getElementById('toggle_size_' + id).checked = true;
        toggleSizeDisplay(id);
      }
    }
    calcArea(id);
  });
  generateQuotation();
}

function processLibraryCSV(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return {};

  const tempLib = {};
  const firstRow = rows[0].map(h => h.toLowerCase().trim());
  
  const idxCat = firstRow.findIndex(h => h.includes('category'));
  const idxItem = firstRow.findIndex(h => h.includes('item name') || h === 'item');
  const idxDesc = firstRow.findIndex(h => h.includes('description') || h.includes('details'));
  const idxPrice = firstRow.findIndex(h => h.includes('price') || h.includes('rate'));
  const idxForm = firstRow.findIndex(h => h.includes('formula'));

  let activeCategory = "Glass Room";

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const name = row[idxItem] ? row[idxItem].trim() : "";
    const desc = row[idxDesc] ? row[idxDesc].trim() : "";
    
    if (!name || name.toLowerCase().includes('item name')) continue;

    let category = activeCategory;
    if (idxCat !== -1 && row[idxCat]) category = row[idxCat].trim();

    let price = 0;
    if (idxPrice !== -1 && row[idxPrice]) price = parseFloat(row[idxPrice].replace(/[^0-9.]/g, '')) || 0;
    
    const formula = idxForm !== -1 && row[idxForm] ? row[idxForm].trim().toLowerCase() : "";

    if (!tempLib[category]) tempLib[category] = [];
    tempLib[category].push({ name, desc, rate: price, formula });
  }
  return tempLib;
}

function parseCSV(text) {
  let lines = []; let row = [""]; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i]; let next = text[i+1];
    if (c === '"') { if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++; } else inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) row.push("");
    else if ((c === '\r' || c === '\n') && !inQuotes) { if (c === '\r' && next === '\n') i++; lines.push(row); row = [""]; }
    else row[row.length - 1] += c;
  }
  lines.push(row); return lines;
}

function loadSpreadsheetLibrary() {
  fetch(SPREADSHEET_CSV_URL).then(res => res.text()).then(csvText => {
    parsedLibrary = processLibraryCSV(csvText);
    rebuildFlatItemLibrary();
    populateCategorySelector();
  }).catch(e => console.error("Error loading spreadsheet library:", e));
}

function rebuildFlatItemLibrary() {
  flatItemLibrary = {};
  const datalist = document.getElementById('itemNamesDatalist');
  if (!datalist) return;
  datalist.innerHTML = '';
  Object.keys(parsedLibrary).forEach(cat => {
    parsedLibrary[cat].forEach(item => {
      flatItemLibrary[item.name] = item;
      let opt = document.createElement('option'); opt.value = item.name;
      datalist.appendChild(opt);
    });
  });
}

function populateCategorySelector() {
  const sel = document.getElementById('workTypeSelector');
  if (!sel) return;
  sel.innerHTML = '<option value="Custom">Custom Input</option>';
  Object.keys(parsedLibrary).forEach(cat => {
    let opt = document.createElement('option'); opt.value = cat; opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function addSection(title = '') {
  sectionCount++;
  const sId = sectionCount;
  const div = document.createElement('div');
  div.className = 'section-block';
  div.id = 'section_' + sId;
  const defaultTitle = title || `Section ${sId}`;
  
  div.innerHTML = `
    <div class="section-header-row">
      <span style="font-size: 11px; font-weight: bold; color: #475569;">SECTION #${sId}:</span>
      <input type="text" class="section-title-input" id="sec_title_${sId}" value="${defaultTitle}" oninput="generateQuotation()">
      ${sId > 1 ? `<button class="btn-delete-section" onclick="removeSection(${sId})">✕ Delete Section</button>` : ''}
    </div>
    <div class="section-items" id="sec_items_${sId}"></div>
    <button class="btn-add" style="border: 1px dashed #991b1b; color: #991b1b;" onclick="addItemToSection(${sId})">+ Add Item to ${defaultTitle}</button>
  `;
  
  const sectionsCont = document.getElementById('sectionsContainer');
  if (sectionsCont) { sectionsCont.appendChild(div); }
  
  const titleInput = div.querySelector('.section-title-input');
  const addBtn = div.querySelector('.btn-add');
  titleInput.addEventListener('input', () => {
    addBtn.textContent = `+ Add Item to ${titleInput.value || 'this Section'}`;
  });
  
  return sId;
}

function removeSection(sId) {
  if (confirm("Are you sure you want to remove this entire section and all its items?")) {
    const secEl = document.getElementById('section_' + sId);
    if (secEl) { secEl.remove(); }
    generateQuotation();
  }
}

function onWorkTypeChange(val) {
  if (val === 'Custom') return;
  document.getElementById('subject').value = "Supply & Installation of " + val;
  
  const sections = document.querySelectorAll('.section-block');
  let targetSectionId = null;
  
  if (sections.length > 0) {
    targetSectionId = parseInt(sections[0].id.replace('section_', ''), 10);
    const secItems = document.getElementById('sec_items_' + targetSectionId);
    if (secItems) {
      secItems.innerHTML = '';
    }
  } else {
    targetSectionId = addSection("Section 1");
  }

  const globalW = parseFloat(document.getElementById('globalWidth').value) || 0;
  const globalL = parseFloat(document.getElementById('globalLength').value) || 0;
  const globalH = parseFloat(document.getElementById('globalHeight').value) || 0;

  if (!parsedLibrary || !parsedLibrary[val]) {
    addItemToSection(targetSectionId);
    return;
  }

  parsedLibrary[val].forEach(item => {
    const isFixed = !item.formula;
    addItemToSection(targetSectionId, item.name || '', item.desc || '', item.rate || 0, isFixed);
    const currentId = itemCount;
    
    if (hasEstimatorBeenRun && item.formula) {
      const dims = evaluateFormula(item.formula, globalW, globalL, globalH);
      if (dims.w > 0 && dims.h > 0) {
        const toggleSizeEl = document.getElementById('toggle_size_' + currentId);
        if (toggleSizeEl) {
          toggleSizeEl.checked = true;
          toggleSizeDisplay(currentId);
        }
        
        const wInput = document.getElementById(`w1_${currentId}`);
        const hInput = document.getElementById(`h1_${currentId}`);
        const qtyInput = document.getElementById(`qty1_${currentId}`);
        
        if (wInput) wInput.value = dims.w;
        if (hInput) hInput.value = dims.h;
        if (qtyInput) qtyInput.value = dims.qty;
        
        calcArea(currentId);
      }
    } else {
      calcArea(currentId);
    }
  });
  generateQuotation();
}

function addItemToSection(sId, pName = '', pDesc = '', pRate = '', pFixed = false) {
  itemCount++; const id = itemCount;
  const div = document.createElement('div'); div.className = 'item-row'; div.id = 'item_' + id;
  
  const isFixedSelected = pFixed ? 'selected' : '';
  const isRateSelected = !pFixed ? 'selected' : '';

  div.innerHTML = `
    <h4>Item #${id}</h4><button class="btn-remove" onclick="removeItem(${id})">✕</button>
    <div class="item-grid">
      <div class="full"><label>Item Name</label><input type="text" id="name_${id}" list="itemNamesDatalist" value="${pName}" oninput="onItemNameInput(${id}, this.value)"></div>
      <div class="full"><label>Description</label><textarea id="desc_${id}" rows="2">${pDesc}</textarea></div>
      <div class="full" style="margin-top: 5px;"><input type="checkbox" id="toggle_size_${id}" onchange="toggleSizeDisplay(${id})"> <label style="display:inline; margin-left: 5px;">Add Custom Sizes</label></div>
      
      <div class="full sizes-container" id="sizes_container_${id}">
        <div class="sizes-title">📐 Custom Sizes (Up to 6 unique measurements)</div>
        <div class="size-row">
          <span>#1</span><input type="number" id="w1_${id}" placeholder="W (cm)" oninput="calcArea(${id})">
          <span>×</span><input type="number" id="h1_${id}" placeholder="H (cm)" oninput="calcArea(${id})">
          <span>Qty</span><input type="number" id="qty1_${id}" value="1" oninput="calcArea(${id})">
        </div>
        <div class="size-row">
          <span>#2</span><input type="number" id="w2_${id}" placeholder="W (cm)" oninput="calcArea(${id})">
          <span>×</span><input type="number" id="h2_${id}" placeholder="H (cm)" oninput="calcArea(${id})">
          <span>Qty</span><input type="number" id="qty2_${id}" oninput="calcArea(${id})">
        </div>
        <div class="size-row">
          <span>#3</span><input type="number" id="w3_${id}" placeholder="W (cm)" oninput="calcArea(${id})">
          <span>×</span><input type="number" id="h3_${id}" placeholder="H (cm)" oninput="calcArea(${id})">
          <span>Qty</span><input type="number" id="qty3_${id}" oninput="calcArea(${id})">
        </div>
        <div class="size-row">
          <span>#4</span><input type="number" id="w4_${id}" placeholder="W (cm)" oninput="calcArea(${id})">
          <span>×</span><input type="number" id="h4_${id}" placeholder="H (cm)" oninput="calcArea(${id})">
          <span>Qty</span><input type="number" id="qty4_${id}" oninput="calcArea(${id})">
        </div>
        <div class="size-row">
          <span>#5</span><input type="number" id="w5_${id}" placeholder="W (cm)" oninput="calcArea(${id})">
          <span>×</span><input type="number" id="h5_${id}" placeholder="H (cm)" oninput="calcArea(${id})">
          <span>Qty</span><input type="number" id="qty5_${id}" oninput="calcArea(${id})">
        </div>
        <div class="size-row">
          <span>#6</span><input type="number" id="w6_${id}" placeholder="W (cm)" oninput="calcArea(${id})">
          <span>×</span><input type="number" id="h6_${id}" placeholder="H (cm)" oninput="calcArea(${id})">
          <span>Qty</span><input type="number" id="qty6_${id}" oninput="calcArea(${id})">
        </div>
      </div>
      
      <div style="margin-top: 5px;">
        <label>Price Type</label>
        <select id="pType_${id}" onchange="calcArea(${id})">
          <option value="Rate" ${isRateSelected}>Per m²</option>
          <option value="Fixed" ${isFixedSelected}>Fixed</option>
        </select>
      </div>
      <div style="margin-top: 5px;"><label>Rate (AED)</label><input type="number" id="rate_${id}" value="${pRate}" oninput="calcArea(${id})"></div>
    </div>
    <div class="calc-result" id="calc_${id}" data-amount="0">Pending info...</div>`;
  
  const secEl = document.getElementById('sec_items_' + sId);
  if (secEl) { secEl.appendChild(div); }
  calcArea(id);
  generateQuotation();
}

function onItemNameInput(id, val) {
  if (flatItemLibrary[val]) {
    document.getElementById('desc_' + id).value = flatItemLibrary[val].desc;
    document.getElementById('rate_' + id).value = flatItemLibrary[val].rate;
    const isFixed = !flatItemLibrary[val].formula;
    document.getElementById('pType_' + id).value = isFixed ? 'Fixed' : 'Rate';
    calcArea(id);
  }
}

function toggleSizeDisplay(id) {
  const cont = document.getElementById('sizes_container_' + id);
  if (cont) { cont.style.display = document.getElementById('toggle_size_' + id).checked ? 'block' : 'none'; }
  calcArea(id);
}

function removeItem(id) { 
  const itemEl = document.getElementById('item_' + id);
  if (itemEl) { itemEl.remove(); }
  generateQuotation(); 
}

async function downloadPDF() {
  const ref = document.getElementById('quotRef').value || 'AA-2026-215';
  const element = document.getElementById('quotationDoc');
  
  if (!element || element.innerHTML.includes('Fill form & Generate')) {
    alert("Please generate the quotation first.");
    return;
  }

  triggerSilentCloudSave();

  const dividers = element.querySelectorAll('.page-break-divider');
  dividers.forEach(d => d.style.display = 'none');

  const opt = {
    margin:       0,
    filename:     `${ref}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'] }
  };

  try {
    if (savedFolderHandle) {
      const hasPermission = await verifyPermission(savedFolderHandle, true);
      if (hasPermission) {
        const blob = await html2pdf().set(opt).from(element).output('blob');
        const fileHandle = await savedFolderHandle.getFileHandle(`${ref}.pdf`, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        alert(`Successfully auto-saved to folder as: "${ref}.pdf"`);
        incrementReferenceNumber();
        return;
      }
    }
  } catch (err) {
    console.error("Auto-save folder writing failed, falling back to browser download:", err);
  }

  html2pdf().set(opt).from(element).save().then(() => {
    incrementReferenceNumber();
  });
}

function incrementReferenceNumber() {
  const refVal = document.getElementById('quotRef').value;
  const numPart = refVal.match(/\d+$/);
  if (numPart) {
    const usedNum = parseInt(numPart[0]);
    localStorage.setItem('nextQuotNum', usedNum + 1);
    document.getElementById('quotRef').value = "AA-" + currentYear + "-" + (usedNum + 1);
  }
}

function applySmartEstimator() {
  hasEstimatorBeenRun = true;
  const cat = document.getElementById('workTypeSelector').value;
  
  let fallbackCat = 'Glass Room';
  if (parsedLibrary && !parsedLibrary['Glass Room'] && Object.keys(parsedLibrary).length > 0) {
    fallbackCat = Object.keys(parsedLibrary)[0];
  }
  
  onWorkTypeChange(cat === 'Custom' ? fallbackCat : cat);
  hasEstimatorBeenRun = false; 
}

function triggerSilentCloudSave() {
  const syncEl = document.getElementById('syncStatus');
  if (syncEl) syncEl.textContent = "SAVING...";
  
  const itemsList = getItems();
  const subtotal = itemsList.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const discountVal = parseFloat(document.getElementById('discountAED').value) || 0;
  const isVat = document.getElementById('vatToggle').value === 'yes';
  
  const netTotal = Math.max(0, subtotal - discountVal);
  const vat = isVat ? netTotal * 0.05 : 0;
  const grandTotalVal = netTotal + vat;
  
  const data = {
    ref: document.getElementById('quotRef').value,
    clientAddr: document.getElementById('clientAddr').value,
    clientPhone: document.getElementById('clientPhone').value,
    clientEmail: document.getElementById('clientEmail').value,
    subject: document.getElementById('subject').value,
    date: document.getElementById('quotDate').value,
    items: itemsList,
    discount: discountVal,
    vat: document.getElementById('vatToggle').value,
    total: grandTotalVal,
    amount: grandTotalVal,
    grandTotal: grandTotalVal,
    netTotal: grandTotalVal
  };
  
  fetch(DB_URL, { 
    method: "POST", 
    body: JSON.stringify(data),
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" }
  })
  .then(() => {
    if (syncEl) syncEl.textContent = "CONNECTED";
    setTimeout(fetchRecentQuotes, 2500);
  })
  .catch(e => {
    if (syncEl) syncEl.textContent = "SYNC ERROR";
    console.error(e);
  });
}

async function shareToWhatsApp() {
  const ref = document.getElementById('quotRef').value || 'AA-2026-215';
  const phone = document.getElementById('clientPhone').value.replace(/\D/g,'');
  const msg = "Hello, please find your quotation Ref: " + ref;
  
  const element = document.getElementById('quotationDoc');
  if (!element || element.innerHTML.includes('Fill form & Generate')) {
    alert("Please generate the quotation first.");
    return;
  }

  triggerSilentCloudSave();

  const opt = {
    margin:       0,
    filename:     `${ref}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'] }
  };

  try {
    const images = element.querySelectorAll('img') || [];
    const imageLoadPromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    
    await Promise.all(imageLoadPromises);

    const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
    const file = new File([pdfBlob], `${ref}.pdf`, { type: 'application/pdf' });

    if (
      navigator.share && 
      navigator.canShare && 
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: ref,
        text: msg,
      });
      console.log('File shared natively successfully!');
    } else {
      alert("Direct file sharing is not supported on this browser/device. Downloading PDF and launching WhatsApp instead...");
      html2pdf().set(opt).from(element).save();
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error sharing file:', error);
      alert(`Could not share: ${error.message || error}`);
    }
  }
}

function clearDraft() {
  if (confirm("Reset current draft?")) {
    document.getElementById('clientAddr').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('discountAED').value = '0';
    document.getElementById('vatToggle').value = 'no';
    document.getElementById('sectionsContainer').innerHTML = '';
    const sId = addSection("Section 1");
    addItemToSection(sId);
    generateQuotation();
  }
}

window.onload = () => {
  let currentSavedRef = localStorage.getItem('nextQuotNum') || 215;
  const quotRefEl = document.getElementById('quotRef');
  if (quotRefEl) {
    quotRefEl.value = "AA-" + currentYear + "-" + currentSavedRef;
  }

  const dateEl = document.getElementById('quotDate');
  if (dateEl) {
    dateEl.valueAsDate = new Date();
  }

  loadSpreadsheetLibrary();
  initFolderSelection(); 
  fetchRecentQuotes();   
  
  document.getElementById('sectionsContainer').innerHTML = '';
  const initialSecId = addSection("Section 1");
  addItemToSection(initialSecId);
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.log('Service Worker Registered!', reg))
      .catch((err) => console.log('Service Worker Registration Failed', err));
  });
}
