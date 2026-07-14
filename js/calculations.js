function evaluateFormula(formulaStr, globalW, globalL, globalH) {
  let str = formulaStr.toLowerCase().replace(/×/g, '*').trim();
  
  let wVal = 0;
  let hVal = 0;
  let qtyVal = 1;
  
  if (str.includes('length') && str.includes('width')) {
    wVal = globalL; hVal = globalW;
  } else if (str.includes('width') && str.includes('height')) {
    wVal = globalW; hVal = globalH;
  } else if (str.includes('length') && str.includes('height')) {
    wVal = globalL; hVal = globalH;
  } else {
    wVal = globalL || globalW; hVal = globalH || globalW;
  }
  
  const qtyMatch = str.match(/\*\s*(\d+)/);
  if (qtyMatch) { qtyVal = parseInt(qtyMatch[1]) || 1; }
  return { w: wVal, h: hVal, qty: qtyVal };
}

function calcArea(id) {
  const rateEl = document.getElementById('rate_' + id);
  const pTypeEl = document.getElementById('pType_' + id);
  const toggleSizeEl = document.getElementById('toggle_size_' + id);
  if (!rateEl || !pTypeEl || !toggleSizeEl) return;
  
  const rate = parseFloat(rateEl.value) || 0;
  const pType = pTypeEl.value;
  const sizeOn = toggleSizeEl.checked;
  let totalArea = 0; let totalQty = 0; let sizeTxt = [];

  if (sizeOn) {
    for (let s = 1; s <= 4; s++) {
      const wEl = document.getElementById(`w${s}_${id}`);
      const hEl = document.getElementById(`h${s}_${id}`);
      const qtyEl = document.getElementById(`qty${s}_${id}`);
      const w = wEl ? parseFloat(wEl.value) || 0 : 0;
      const h = hEl ? parseFloat(hEl.value) || 0 : 0;
      const q = qtyEl ? parseFloat(qtyEl.value) || (s === 1 ? 1 : 0) : (s === 1 ? 1 : 0);
      
      if (w > 0 && h > 0 && q > 0) {
        totalArea += (w / 100) * (h / 100) * q;
        totalQty += q;
        sizeTxt.push(`${w}×${h}cm (${q})`);
      }
    }
  }

  let amount = 0;
  let roundedArea = 0;
  if (pType === 'Fixed') {
    amount = rate;
  } else {
    if (totalArea > 0) {
      roundedArea = Math.ceil(totalArea * 2) / 2;
      amount = roundedArea * rate;
    } else {
      amount = rate;
    }
  }

  const el = document.getElementById('calc_' + id);
  if (el) {
    el.dataset.amount = amount;
    if (sizeOn) {
      el.dataset.sizeText = sizeTxt.join(' | ') || '-';
      el.dataset.roundedArea = roundedArea > 0 ? roundedArea.toFixed(1) : '';
    } else {
      if (!el.dataset.sizeText) { el.dataset.sizeText = '-'; }
    }
    el.textContent = "Amount: AED " + amount.toFixed(2);
  }
}

function getItems() {
  let arr = [];
  document.querySelectorAll('.section-block').forEach(secBlock => {
    const sId = secBlock.id.replace('section_', '');
    const titleEl = document.getElementById('sec_title_' + sId);
    const sectionTitle = titleEl ? titleEl.value : `Section ${sId}`;
    
    secBlock.querySelectorAll('.item-row').forEach(row => {
      const id = row.id.replace('item_', '');
      const calcEl = document.getElementById('calc_' + id);
      let sizesArr = [];
      for (let s = 1; s <= 4; s++) {
        const wEl = document.getElementById(`w${s}_${id}`);
        const hEl = document.getElementById(`h${s}_${id}`);
        const qtyEl = document.getElementById(`qty${s}_${id}`);
        sizesArr.push({
          w: wEl ? wEl.value : '',
          h: hEl ? hEl.value : '',
          qty: qtyEl ? qtyEl.value : ''
        });
      }

      const nameEl = document.getElementById('name_' + id);
      const descEl = document.getElementById('desc_' + id);
      const pTypeEl = document.getElementById('pType_' + id);
      const rateEl = document.getElementById('rate_' + id);

      arr.push({
        sectionTitle: sectionTitle,
        itemName: nameEl ? nameEl.value : '',
        desc: descEl ? descEl.value : '',
        size: calcEl ? calcEl.dataset.sizeText || '-' : '-',
        roundedArea: calcEl ? calcEl.dataset.roundedArea || '' : '',
        amount: calcEl ? parseFloat(calcEl.dataset.amount) || 0 : 0,
        priceType: pTypeEl ? pTypeEl.value : 'Rate',
        rate: rateEl ? rateEl.value : '0',
        sizes: sizesArr,
        discount: parseFloat(document.getElementById('discountAED').value) || 0,
        vat: document.getElementById('vatToggle').value
      });
    });
  });
  return arr;
}

function numberToWords(num) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero';
  function helper(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + helper(n%100) : '');
    if (n < 100000) return helper(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + helper(n%1000) : '');
    return helper(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + helper(n%100000) : '');
  }
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  let result = helper(intPart) + ' UAE Dirhams';
  if (decPart > 0) result += ' and ' + helper(decPart) + ' Fils';
  return result + ' Only';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
}

function generateQuotation() {
  const ref = document.getElementById('quotRef').value || 'AA-2026-215';
  const date = formatDate(document.getElementById('quotDate').value);
  const clientAddr = document.getElementById('clientAddr').value || 'Dubai, UAE';
  const clientPhone = document.getElementById('clientPhone').value || 'NA';
  const clientEmail = document.getElementById('clientEmail').value || 'NA';
  const subject = document.getElementById('subject').value || 'Supply & Installation of Folding Door';
  
  const discountVal = parseFloat(document.getElementById('discountAED').value) || 0;
  const isVat = document.getElementById('vatToggle').value === 'yes';
  const globalW = parseFloat(document.getElementById('globalWidth').value) || 0;
  const globalL = parseFloat(document.getElementById('globalLength').value) || 0;
  const globalH = parseFloat(document.getElementById('globalHeight').value) || 0;

  let rows = '';
  let globalSr = 1;
  let total = 0;

  const sectionBlocks = document.querySelectorAll('.section-block');
  
  if (sectionBlocks.length === 0) { 
    document.getElementById('quotationDoc').innerHTML = `
      <div style="text-align:center; color:#94a3b8; padding:80px 0; font-size:14px; font-weight:500;">Fill form & Generate</div>`;
    return; 
  }

  sectionBlocks.forEach(secBlock => {
    const sId = secBlock.id.replace('section_', '');
    const titleEl = document.getElementById('sec_title_' + sId);
    const secTitle = titleEl ? titleEl.value : `Section ${sId}`;
    const itemsInSec = secBlock.querySelectorAll('.item-row');

    if (itemsInSec.length > 0) {
      rows += `
        <tr>
          <td colspan="4" style="background: #fdf2f2; font-weight: bold; color: #991b1b; font-size: 11px; text-transform: uppercase; padding: 10px 12px; border-left: 4px solid #991b1b;">
            📁 ${secTitle}
          </td>
        </tr>
      `;

      itemsInSec.forEach(itemRow => {
        const id = itemRow.id.replace('item_', '');
        const nameEl = document.getElementById('name_' + id);
        const name = nameEl ? nameEl.value : '';
        const descEl = document.getElementById('desc_' + id);
        const desc = descEl ? descEl.value : '';
        const calcEl = document.getElementById('calc_' + id);
        
        const size = calcEl ? calcEl.dataset.sizeText || '-' : '-';
        const roundedArea = calcEl ? calcEl.dataset.roundedArea || '' : '';
        const amount = calcEl ? parseFloat(calcEl.dataset.amount) || 0 : 0;
        
        total += amount;

        const particularsCell = name
          ? `<span class="item-name">${name}</span><span class="item-desc">${desc}</span>`
          : `<span class="item-desc">${desc}</span>`;

        const sizeCell = size ? size.split(' | ').join('<br>') : '-';
        const areaLabel = (roundedArea && roundedArea !== '0.0')
          ? `<br><span style="font-size:10px;color:#991b1b;font-weight:bold;">Total Area: ${roundedArea} m²</span>`
          : '';

        rows += `<tr>
          <td style="text-align:center;font-weight:bold;vertical-align:top;">${globalSr++}</td>
          <td style="vertical-align:top;">${particularsCell}</td>
          <td style="text-align:center;font-weight:bold;vertical-align:top;font-size:11px;line-height:1.4;">
            ${sizeCell}
            ${areaLabel}
          </td>
          <td style="text-align:right;font-weight:bold;vertical-align:top;">
            ${amount > 0 ? amount.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) : '-'}
          </td>
        </tr>`;
      });
    }
  });

  const netTotal = Math.max(0, total - discountVal);
  const vat = isVat ? netTotal * 0.05 : 0;
  const grand = netTotal + vat;

  let mathRows = '';
  if (discountVal > 0) {
    mathRows += `
      <tr>
        <td colspan="2" style="text-align:right;font-weight:bold;font-size:12px;background:#ffffff!important;">Subtotal</td>
        <td></td>
        <td style="text-align:right;font-weight:bold;background:#ffffff!important;">${total.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})} AED</td>
      </tr>
      <tr>
        <td colspan="2" style="text-align:right;font-weight:bold;font-size:12px;background:#fef2f2!important;color:#ef4444;">Discount (Flat AED)</td>
        <td></td>
        <td style="text-align:right;font-weight:bold;background:#fef2f2!important;color:#ef4444;">-${discountVal.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})} AED</td>
      </tr>
      <tr>
        <td colspan="2" style="text-align:right;font-weight:bold;font-size:12px;background:#ffffff!important;">Net Total</td>
        <td></td>
        <td style="text-align:right;font-weight:bold;background:#ffffff!important;">${netTotal.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})} AED</td>
      </tr>
    `;
  }

  if (isVat) {
    mathRows += `
      <tr>
        <td colspan="2" style="text-align:right;font-weight:bold;font-size:12px;background:#fef2f2!important;">5% VAT</td>
        <td></td>
        <td style="text-align:right;font-weight:bold;background:#fef2f2!important;color:#991b1b;">${vat.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})} AED</td>
      </tr>
    `;
  }

  const watermarkHTML = `
    <div class="watermark-container">
      <div class="watermark-text">AHMAD ALUMINIUM &amp; GLASS</div>
    </div>`;

  const headerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:3px solid #991b1b;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:15px;">
        <img src="Ahmad_Aluminium_Logo.png" alt="Ahmad Aluminium Logo" style="height:65px; max-width:280px; object-fit:contain; border-radius:4px;">
      </div>
      <div style="text-align:right;">
        <div style="font-size:38px;font-weight:900;color:#991b1b;letter-spacing:5px;text-transform:uppercase;">RAFIA</div>
      </div>
    </div>
    <div style="background:#fef2f2;border:1px solid #fca5a5;padding:7px 14px;display:flex;justify-content:space-between;font-size:12px;margin-bottom:12px;border-radius:4px;align-items:center; width:100%;">
      <span>📞 <strong>+971588490784</strong></span>
      <span>✉️ info@ahmadaluminium.ae</span>
      <span>🌐 www.ahmadaluminium.ae</span>
    </div>`;

  const page1 = `
  <div class="quotation-page">
    ${watermarkHTML}
    <div style="position:relative;z-index:1;">
      ${headerHTML}
      <div class="client-meta-grid">
        <div>
          <div class="section-label">Client Details</div>
          <div><strong>Address:</strong> ${clientAddr}</div>
          <div><strong>Phone:</strong> &nbsp;${clientPhone}</div>
          <div><strong>Email:</strong> &nbsp;&nbsp;${clientEmail}</div>
        </div>
        <div>
          <div class="section-label">Document Info</div>
          <div><strong>Reference No:</strong> <span style="color: #991b1b; font-weight: bold;">${ref}</span></div>
          <div><strong>Date:</strong> ${date}</div>
          <div><strong>EMAIL:</strong> info@ahmadaluminium.ae</div>
        </div>
      </div>
      <div style="text-align:center;font-style:italic;font-weight:bold;font-size:14px;color:#991b1b;border-bottom:2px solid #991b1b;border-top:2px solid #991b1b;padding:8px 0;margin-bottom:15px;">
        Subject: ${subject}
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:8%;text-align:center;">Sr.</th>
            <th style="width:52%;">Particulars / Description</th>
            <th style="width:22%;text-align:center;">Size (cm)</th>
            <th style="width:18%;text-align:right;">Total Amount (AED)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${mathRows}
          <tr class="total-row">
            <td colspan="2" style="text-align:right;font-weight:bold;font-size:13px;">Grand Total</td>
            <td style="text-align:center;font-weight:bold;color:#991b1b;">-</td>
            <td style="text-align:right;">${grand.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})} AED</td>
          </tr>
        </tbody>
      </table>
      <div class="amount-words">Grand Total: <strong>${numberToWords(grand)}.</strong></div>
      ${generateIsometricSVG(globalW, globalL, globalH)}
    </div>
  </div>`;

  const pageBreak = `<div class="page-break-divider" style="height: 1px; border-bottom: 1px dashed #cbd5e1; margin: 24px 0;"></div>`;

  const page2 = `
  <div class="quotation-page-footer">
    ${watermarkHTML}
    <div style="position:relative;z-index:1;">
      <div style="font-size:11px;color:#94a3b8;text-align:right;margin-bottom:12px;">Reference No: <span style="color: #991b1b; font-weight: bold;">${ref}</span> &nbsp;|&nbsp; Continued</div>
      <div class="doc-section-title">Payment terms:</div>
      <ul class="doc-list">
        <li>60% Advance Payment.</li>
        <li>30% on all material delivery on site before installation.</li>
        <li>10% after Completion.</li>
        <li>5% VAT is calculated on final invoices according to official tax policy.</li>
      </ul>
      <p style="font-size:12px;margin:8px 0;color:#475569;">(Full balance amount shall be paid after completion of the above said works).</p>
      <div class="doc-section-title" style="margin-top:18px;">Terms &amp; Conditions:</div>
      <ul class="doc-list">
        <li>Additional works subject to extra cost and to be agreed prior to start of works.</li>
        <li>All size mentioned are in CMS / MTRS and is final.</li>
        <li>Power supply to be provided by the Client.</li>
        <li>All required approvals to be provided by the client.</li>
        <li>Validity of This Offer for 07 Days Only.</li>
      </ul>
      <div style="font-size:12px;margin:18px 0 10px;line-height:1.8;font-weight:bold;color:#334155;">
        Hope the above Quote is Satisfactory and meets your requirements and await your confirmed LPO.<br>
        Kindly contact the below personal for any clarifications as required
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;margin-bottom:25px;">
        <div style="font-size:12px;line-height:2.2;color:#334155;">
          <div style="font-weight:bold;">Project Manager,</div>
          <div style="font-weight:bold;font-size:13px;">Ahmad Latif</div>
          <div>+971 58 84 90 784</div>
        </div>
        <div style="text-align:center; z-index: 10; position: relative;">
          <svg viewBox="0 0 200 200" width="130" height="130" style="opacity: 0.95; transform: rotate(-10deg); filter: drop-shadow(0px 0px 1px rgba(29, 18, 95, 0.3));">
            <circle cx="100" cy="100" r="95" fill="none" stroke="#1d125f" stroke-width="3" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="#1d125f" stroke-width="1" />
            <circle cx="100" cy="100" r="62" fill="none" stroke="#1d125f" stroke-width="1" />
            <circle cx="100" cy="100" r="57" fill="none" stroke="#1d125f" stroke-width="2.5" />
            <path id="topPath" d="M 25,100 A 75,75 0 0,1 175,100" fill="none" stroke="none" />
            <path id="bottomPath" d="M 175,100 A 75,75 0 0,1 25,100" fill="none" stroke="none" />
            <text fill="#1d125f" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="8.2" letter-spacing="0.3">
              <textPath href="#topPath" startOffset="50%" text-anchor="middle">احمد الالمنيوم اند جلاس كونتراكتور ش.ذ.م.م - منطقة حرة</textPath>
            </text>
            <text fill="#1d125f" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="7.5" letter-spacing="0.3">
              <textPath href="#bottomPath" startOffset="50%" text-anchor="middle">AHMAD ALUMINIUM AND GLASS CONTRACTOR L.L.C-FZ</textPath>
            </text>
            <text x="20" y="104" fill="#1d125f" font-size="12" font-weight="bold">★</text>
            <text x="169" y="104" fill="#1d125f" font-size="12" font-weight="bold">★</text>
            <text x="100" y="108" fill="#1d125f" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="13" text-anchor="middle" letter-spacing="0.5">DUBAI - U.A.E</text>
          </svg>
        </div>
        <div style="text-align:center;">
          <div style="font-size:11px;color:#64748b;margin-bottom:6px;">Signature:</div>
          <img src="Signature-Ahmad.png" alt="Ahmad Latif Signature" style="height:45px; width:auto; border-bottom:1px solid #cbd5e1; display:inline-block; padding-bottom:4px; max-width: 150px; object-fit: contain;">
        </div>
      </div>
      <div style="border-top:2px solid #991b1b;padding-top:15px;">
        <h3 style="color:#991b1b;font-size:13px;font-weight:bold;text-align:center;margin-bottom:12px;text-transform:uppercase;letter-spacing:2px;">Company Bank Account Details</h3>
        <div class="bank-grid-vertical">
          <div class="bank-card">
            <div>
              <strong>1) Company Corporate Account — Mashreq Bank</strong>
              <span style="font-size:11.5px;color:#1e293b;display:block;margin:2px 0;">Title: Ahmad Aluminium and Glass Contractor LLC FZ</span>
              <small style="color:#64748b;font-size:10px;">Account No: 019 1021 34817 &nbsp;|&nbsp; Swift: BOMLAEAD</small>
            </div>
            <div class="iban-pill" onclick="copyToClipboard(this, 'AE360330000019102134817')">
              <span>AE36 0330 0000 1910 2134 817</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </div>
          </div>
          <div class="bank-card">
            <div>
              <strong>2) Chief Executive Register — Emirates NBD</strong>
              <span style="font-size:11.5px;color:#1e293b;display:block;margin:2px 0;">Title: Ahmad Latif</span>
              <small style="color:#64748b;font-size:10px;">Account No: 10 1580 3625 901 &nbsp;|&nbsp; Swift: EBILAEAD</small>
            </div>
            <div class="iban-pill" onclick="copyToClipboard(this, 'AE280260001015803625901')">
              <span>AE28 0260 0010 1580 3625 901</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </div>
          </div>
          <div class="bank-card">
            <div>
              <strong>3) Secondary Operational Line — Mashreq Bank</strong>
              <span style="font-size:11.5px;color:#1e293b;display:block;margin:2px 0;">Title: Ahmad Latif</span>
              <small style="color:#64748b;font-size:10px;">Account No: 019 1009 20602 &nbsp;|&nbsp; Swift: BOMLAEAD</small>
            </div>
            <div class="iban-pill" onclick="copyToClipboard(this, 'AE720330000019100920602')">
              <span>AE72 0330 0000 1910 0920 602</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  document.getElementById('quotationDoc').innerHTML = page1 + pageBreak + page2;
}
