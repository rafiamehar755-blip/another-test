function generateIsometricSVG(w, l, h) {
  if (isNaN(w) || isNaN(l) || isNaN(h) || w <= 0 || l <= 0 || h <= 0) { return ''; }
  const scale = 110 / Math.max(w, l, h, 100);
  const angle = 30 * (Math.PI / 180);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const dxW = -w * scale * cosA;
  const dyW = w * scale * sinA;
  const dxL = l * scale * cosA;
  const dyL = l * scale * sinA;
  const dyH = -h * scale;
  const r_p0 = { x: 0, y: 0 };
  const r_p1 = { x: dxL, y: dyL };
  const r_p2 = { x: dxL + dxW, y: dyL + dyW };
  const r_p3 = { x: dxW, y: dyW };
  const r_t0 = { x: r_p0.x, y: r_p0.y + dyH };
  const r_t1 = { x: r_p1.x, y: r_p1.y + dyH };
  const r_t2 = { x: r_p2.x, y: r_p2.y + dyH };
  const r_t3 = { x: r_p3.x, y: r_p3.y + dyH };
  const allX = [r_p0.x, r_p1.x, r_p2.x, r_p3.x, r_t0.x, r_t1.x, r_t2.x, r_t3.x];
  const allY = [r_p0.y, r_p1.y, r_p2.y, r_p3.y, r_t0.y, r_t1.y, r_t2.y, r_t3.y];
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const boxW = maxX - minX;
  const boxH = maxY - minY;
  const shiftX = 225 - (minX + boxW / 2);
  const shiftY = 125 - (minY + boxH / 2);
  const p0 = { x: r_p0.x + shiftX, y: r_p0.y + shiftY };
  const p1 = { x: r_p1.x + shiftX, y: r_p1.y + shiftY };
  const p2 = { x: r_p2.x + shiftX, y: r_p2.y + shiftY };
  const p3 = { x: r_p3.x + shiftX, y: r_p3.y + shiftY };
  const t0 = { x: r_t0.x + shiftX, y: r_t0.y + shiftY };
  const t1 = { x: r_t1.x + shiftX, y: r_t1.y + shiftY };
  const t2 = { x: r_t2.x + shiftX, y: r_t2.y + shiftY };
  const t3 = { x: r_t3.x + shiftX, y: r_t3.y + shiftY };
  const offset = 22;
  const wlStart = { x: p0.x - scale * cosA * offset, y: p0.y + scale * sinA * offset + 5 };
  const wlEnd = { x: p3.x - scale * cosA * offset, y: p3.y + scale * sinA * offset + 5 };
  const llStart = { x: p0.x + scale * cosA * offset, y: p0.y + scale * sinA * offset + 5 };
  const llEnd = { x: p1.x + scale * cosA * offset, y: p1.y + scale * sinA * offset + 5 };
  const hlStart = { x: p1.x + 25, y: p1.y };
  const hlEnd = { x: t1.x + 25, y: t1.y };

  return `
    <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px; width: 100%; page-break-inside: avoid; break-inside: avoid;">
      <div style="font-size: 11px; font-weight: bold; color: #991b1b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; width: 100%; text-align: center;">📐 Structure Schematic (Isometric 3D - Section 1 Only)</div>
      <div style="width: 100%; display: flex; justify-content: center; align-items: center; background: #fafafa; border: 1px dashed #cbd5e1; border-radius: 4px;">
        <svg width="350" height="220" viewBox="0 0 450 280">
          <polygon points="${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}" fill="rgba(0,0,0,0.01)" stroke="#cccccc" stroke-width="1.5" stroke-dasharray="3,3" />
          <polygon points="${p0.x},${p0.y} ${p1.x},${p1.y} ${t1.x},${t1.y} ${t0.x},${t0.y}" fill="rgba(41, 128, 185, 0.06)" />
          <polygon points="${p0.x},${p0.y} ${p3.x},${p3.y} ${t3.x},${t3.y} ${t0.x},${t0.y}" fill="rgba(41, 128, 185, 0.06)" />
          <line x1="${p0.x}" y1="${p0.y}" x2="${t0.x}" y2="${t0.y}" stroke="#1e293b" stroke-width="3" />
          <line x1="${p1.x}" y1="${p1.y}" x2="${t1.x}" y2="${t1.y}" stroke="#1e293b" stroke-width="3" />
          <line x1="${p2.x}" y1="${p2.y}" x2="${t2.x}" y2="${t2.y}" stroke="#1e293b" stroke-width="3" />
          <line x1="${p3.x}" y1="${p3.y}" x2="${t3.x}" y2="${t3.y}" stroke="#1e293b" stroke-width="3" />
          <polygon points="${t0.x},${t0.y} ${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y}" fill="rgba(153, 27, 27, 0.08)" stroke="#991b1b" stroke-width="3" />
          <line x1="${p0.x}" y1="${p0.y}" x2="${wlStart.x}" y2="${wlStart.y}" stroke="#999999" stroke-width="0.8" />
          <line x1="${p3.x}" y1="${p3.y}" x2="${wlEnd.x}" y2="${wlEnd.y}" stroke="#999999" stroke-width="0.8" />
          <line x1="${wlStart.x}" y1="${wlStart.y}" x2="${wlEnd.x}" y2="${wlEnd.y}" stroke="#991b1b" stroke-width="1.5" />
          <circle cx="${wlStart.x}" cy="${wlStart.y}" r="2" fill="#991b1b" />
          <circle cx="${wlEnd.x}" cy="${wlEnd.y}" r="2" fill="#991b1b" />
          <text x="${(wlStart.x + wlEnd.x)/2 - 10}" y="${(wlStart.y + wlEnd.y)/2 + 15}" fill="#991b1b" font-size="10" font-weight="bold" text-anchor="middle">W: ${w} cm</text>
          <line x1="${p0.x}" y1="${p0.y}" x2="${llStart.x}" y2="${llStart.y}" stroke="#999999" stroke-width="0.8" />
          <line x1="${p1.x}" y1="${p1.y}" x2="${llEnd.x}" y2="${llEnd.y}" stroke="#999999" stroke-width="0.8" />
          <line x1="${llStart.x}" y1="${llStart.y}" x2="${llEnd.x}" y2="${llEnd.y}" stroke="#991b1b" stroke-width="1.5" />
          <circle cx="${llStart.x}" cy="${llStart.y}" r="2" fill="#991b1b" />
          <circle cx="${llEnd.x}" cy="${llEnd.y}" r="2" fill="#991b1b" />
          <text x="${(llStart.x + llEnd.x)/2 + 10}" y="${(llStart.y + llEnd.y)/2 + 15}" fill="#991b1b" font-size="10" font-weight="bold" text-anchor="middle">L: ${l} cm</text>
          <line x1="${p1.x}" y1="${p1.y}" x2="${hlStart.x}" y2="${hlStart.y}" stroke="#999999" stroke-width="0.8" />
          <line x1="${t1.x}" y1="${t1.y}" x2="${hlEnd.x}" y2="${hlEnd.y}" stroke="#999999" stroke-width="0.8" />
          <line x1="${hlStart.x}" y1="${hlStart.y}" x2="${hlEnd.x}" y2="${hlEnd.y}" stroke="#991b1b" stroke-width="1.5" />
          <circle cx="${hlStart.x}" cy="${hlStart.y}" r="2" fill="#991b1b" />
          <circle cx="${hlEnd.x}" cy="${hlEnd.y}" r="2" fill="#991b1b" />
          <text x="${hlStart.x + 10}" y="${(hlStart.y + hlEnd.y)/2 + 4}" fill="#991b1b" font-size="10" font-weight="bold" text-anchor="start">H: ${h} cm</text>
        </svg>
      </div>
    </div>
  `;
}
