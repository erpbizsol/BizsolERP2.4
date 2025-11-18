// DateRangeControl web component
// Usage: <date-range-control id="dr"></date-range-control>
// Listen to changes: document.getElementById('dr').addEventListener('daterangechange', (e) => { console.log(e.detail); });

const template = document.createElement('template');
template.innerHTML = `
 <style>
 :host { --gap:12px; --input-width:140px; --icon-size:18px; display: block; font-family: Arial, Helvetica, sans-serif; }
 .dr-wrapper { display:flex; gap:var(--gap); align-items:flex-start; }
 .field { display:flex; flex-direction:column; gap:6px; max-width: var(--input-width); }
 label { font-size:14px; color:#333; font-weight:600; white-space: nowrap; }
 .input-wrap { position:relative; display: inline-block; width: 100%; max-width: var(--input-width); }
 /* compact date input */
 input[type="date"], input[type="text"].fake-date { 
   width: 100%; 
   max-width: var(--input-width); 
   padding: 8px 36px 8px 10px; 
   border: 1px solid #e0e0e0; 
border-radius: 8px; 
 height: 36px; 
   font-size: 14px; 
   background: #fff; 
   box-shadow: 0 1px 2px rgba(16,24,40,0.04); 
 color: #111;
   box-sizing: border-box;
 }
 /* Hide native calendar picker indicator */
 input[type="date"]::-webkit-calendar-picker-indicator { position: absolute; right: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
 input[type="date"]::-webkit-inner-spin-button,
 input[type="date"]::-webkit-clear-button { display: none; -webkit-appearance: none; }
 input[type="date"]:focus, input[type="text"].fake-date:focus { outline:none; box-shadow:0 0 4px rgba(100,150,255,0.12); border-color:#6496ff; }
 .icon { position:absolute; right:10px; top:50%; transform:translateY(-50%); width:var(--icon-size); height:var(--icon-size); pointer-events:none; opacity:0.7; z-index: 1; }
 .controls { display:flex; gap:8px; align-items:center; margin-top:18px; }
 button.clear { background:#fff; border:1px solid #ddd; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:13px; }
 button.clear:focus { outline:3px solid rgba(100,150,255,0.18); }
 .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

 @media (max-width:640px) {
 :host { --input-width:120px; }
 .dr-wrapper { flex-wrap:wrap; }
 }
 </style>
 <div class="dr-wrapper">
 <div class="field">
 <label for="fromDate">From</label>
 <div class="input-wrap">
 <input id="fromDate" type="text" class="fake-date" placeholder="YYYY-MM-DD" aria-label="From date" autocomplete="off" />
 <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <rect x="3" y="4" width="18" height="18" rx="3" stroke="#333" stroke-width="1.2" fill="none" />
 <path d="M 7 9 h 10 M 7 13 h 10" stroke="#333" stroke-width="1.2" stroke-linecap="round" />
 </svg>
 </div>
 </div>
 <div class="field">
 <label for="toDate">To</label>
 <div class="input-wrap">
 <input id="toDate" type="text" class="fake-date" placeholder="YYYY-MM-DD" aria-label="To date" autocomplete="off" />
 <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <rect x="3" y="4" width="18" height="18" rx="3" stroke="#333" stroke-width="1.2" fill="none" />
 <path d="M 7 9 h 10 M 7 13 h 10" stroke="#333" stroke-width="1.2" stroke-linecap="round" />
 </svg>
 </div>
 </div>
 <div class="controls">
 <button class="clear" type="button" title="Clear dates">Clear</button>
 </div>
 </div>
`;

class DateRangeControlHTMLElement extends HTMLElement {
 constructor() {
 super();
 this._shadow = this.attachShadow({ mode: 'open' });
 this._shadow.appendChild(template.content.cloneNode(true));

 this.fromInput = this._shadow.getElementById('fromDate');
 this.toInput = this._shadow.getElementById('toDate');
 this.clearBtn = this._shadow.querySelector('button.clear');

 // Local state
 this._from = null; // ISO date string YYYY-MM-DD
 this._to = null;
 this._fp = null; // flatpickr instance reference
 this._tempSelectedDates = null; // for cancel

 // Bind handlers
 this._onFromChange = this._onFromChange.bind(this);
 this._onToChange = this._onToChange.bind(this);
 this._onClear = this._onClear.bind(this);
 this._onWindowResize = this._onWindowResize.bind(this);
 }

 connectedCallback() {
 const fromAttr = this.getAttribute('from');
 const toAttr = this.getAttribute('to');
 if (fromAttr) { this._setFromValue(this._normalizeDate(fromAttr)); }
 if (toAttr) { this._setToValue(this._normalizeDate(toAttr)); }

 this.fromInput.addEventListener('change', this._onFromChange);
 this.toInput.addEventListener('change', this._onToChange);
 this.clearBtn.addEventListener('click', this._onClear);

 try { this.clearBtn.style.display = 'none'; } catch (e) { }

 this._loadFlatpickr().then(() => this._initFlatpickr()).catch(() => { });
 this._syncToMin();
 window.addEventListener('resize', this._onWindowResize);
 }

 disconnectedCallback() {
 this.fromInput.removeEventListener('change', this._onFromChange);
 this.toInput.removeEventListener('change', this._onToChange);
 this.clearBtn.removeEventListener('click', this._onClear);
 window.removeEventListener('resize', this._onWindowResize);
 if (this._fp && typeof this._fp.destroy === 'function') this._fp.destroy();
 }

 _loadFlatpickr() {
 return new Promise((resolve, reject) => {
 if (window.flatpickr && window.rangePlugin) return resolve();
 const cssId = 'flatpickr-css';
 if (!document.getElementById(cssId)) {
 const link = document.createElement('link');
 link.id = cssId;
 link.rel = 'stylesheet';
 link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
 document.head.appendChild(link);
 }
 const scriptId = 'flatpickr-js';
 function loadScript(src, id) {
 return new Promise((res, rej) => {
 if (document.getElementById(id)) return res();
 const s = document.createElement('script');
 s.src = src;
 s.async = true;
 s.onload = () => res();
 s.onerror = () => rej(new Error('Failed to load ' + src));
 s.id = id;
 document.head.appendChild(s);
 });
 }
 loadScript('https://cdn.jsdelivr.net/npm/flatpickr', scriptId)
 .then(() => loadScript('https://cdn.jsdelivr.net/npm/flatpickr/dist/plugins/rangePlugin.js', 'flatpickr-range-plugin'))
 .then(() => resolve())
 .catch(err => { console.warn('Flatpickr load failed', err); reject(err); });
 });
 }

 _initFlatpickr() {
 try {
 if (!window.flatpickr) return;
 if (this._fp && typeof this._fp.destroy === 'function') this._fp.destroy();
 const that = this;
 const mobile = (window.innerWidth <=640);
 const options = {
 dateFormat: 'Y-m-d',
 allowInput: true,
 mode: 'range',
 showMonths: mobile ? 1 : 2,
 position: 'auto',
 static: false,
 positionElement: mobile ? undefined : this.fromInput,
 onChange: (selectedDates, dateStr, instance) => {
 // When both dates are selected, auto-close on mobile
 if (mobile && selectedDates && selectedDates.length === 2) {
 setTimeout(() => {
 const f = selectedDates[0] ? selectedDates[0].toISOString().slice(0,10) : null;
 const t = selectedDates[1] ? selectedDates[1].toISOString().slice(0,10) : null;
 that._setFromValue(f);
 that._setToValue(t);
 that._syncToMin();
 that._emitChange();
 // Clean up overlay
 const overlay = document.getElementById('flatpickr-mobile-overlay');
 if (overlay) overlay.remove();
 document.body.style.overflow = '';
 instance.close();
 }, 100);
 }
 },
 onClose: (selectedDates, dateStr, instance) => {
 if (selectedDates && selectedDates.length >0) {
 const f = selectedDates[0] ? selectedDates[0].toISOString().slice(0,10) : null;
 const t = selectedDates[1] ? selectedDates[1].toISOString().slice(0,10) : null;
 that._setFromValue(f);
 that._setToValue(t);
 that._syncToMin();
 that._emitChange();
 }
 // Clean up on close
 const overlay = document.getElementById('flatpickr-mobile-overlay');
 if (overlay) overlay.remove();
 document.body.style.overflow = '';
 },
 onOpen: function(selectedDates, dateStr, instance) {
 that._tempSelectedDates = instance.selectedDates ? instance.selectedDates.slice() : [];
 that._ensureCalendarFooter(instance);
 that._ensureCalendarHeader(instance);
 // Use setTimeout to ensure DOM is ready
 setTimeout(() => {
 that._adjustMobilePosition(instance);
 }, 10);
 },
 onReady: function(selectedDates, dateStr, instance) {
 that._ensureCalendarFooter(instance);
 that._ensureCalendarHeader(instance);
 },
 appendTo: document.body
 };
 const rp = (window.rangePlugin && typeof rangePlugin === 'function') ? rangePlugin({ input: this.toInput }) : null;
 if (rp) options.plugins = [rp];
 this._fp = window.flatpickr(this.fromInput, options);
 if (this._from || this._to) {
 const v = [this._from, this._to].filter(Boolean).join(' to ');
 try { this._fp.setDate(v, true, 'Y-m-d'); } catch (e) { }
 }
 this.fromInput.addEventListener('input', this._onFromChange);
 this.toInput.addEventListener('input', this._onToChange);
 } catch (e) { console.warn('flatpickr init failed', e); }
 }

 _adjustMobilePosition(instance) {
 try {
 if (window.innerWidth > 640) return;
 const container = instance.calendarContainer;
 if (!container) return;
 
 // Wait for next frame to ensure DOM is ready
 requestAnimationFrame(() => {
 // Force fixed positioning and center on screen
 container.style.setProperty('position', 'fixed', 'important');
 container.style.left = '50%';
 container.style.top = '50%';
 container.style.transform = 'translate(-50%, -50%)';
 container.style.width = 'calc(100vw - 32px)';
 container.style.maxWidth = '360px';
 container.style.maxHeight = 'calc(100vh - 80px)';
 container.style.overflowY = 'auto';
 container.style.overflowX = 'hidden';
 container.style.boxSizing = 'border-box';
 container.style.zIndex = '99999';
 container.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
 container.style.borderRadius = '12px';
 container.style.margin = '0';
 
 // Ensure container is visible
 container.style.opacity = '1';
 container.style.visibility = 'visible';
 });
 
 // Remove existing overlay if present
 const existingOverlay = document.getElementById('flatpickr-mobile-overlay');
 if (existingOverlay) existingOverlay.remove();
 
 // Add overlay backdrop
 const overlay = document.createElement('div');
 overlay.id = 'flatpickr-mobile-overlay';
 overlay.style.position = 'fixed';
 overlay.style.top = '0';
 overlay.style.left = '0';
 overlay.style.width = '100vw';
 overlay.style.height = '100vh';
 overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
 overlay.style.zIndex = '99998';
 overlay.style.touchAction = 'none';
 
 // Close calendar when clicking overlay
 overlay.addEventListener('click', (e) => {
 e.preventDefault();
 e.stopPropagation();
 if (this._fp) {
 // Restore previous dates
 try {
 if (this._tempSelectedDates && this._tempSelectedDates.length > 0) {
 this._fp.setDate(this._tempSelectedDates, true, 'Y-m-d');
 }
 } catch (err) {}
 
 // Clean up
 const overlayToRemove = document.getElementById('flatpickr-mobile-overlay');
 if (overlayToRemove) overlayToRemove.remove();
 document.body.style.overflow = '';
 this._fp.close();
 }
 });
 
 document.body.appendChild(overlay);
 
 // Prevent body scroll when calendar is open
 document.body.style.overflow = 'hidden';
 
 // Override the close function to clean up properly
 if (!instance._originalCloseOverridden) {
 const originalClose = instance.close.bind(instance);
 instance.close = () => {
 const overlayToRemove = document.getElementById('flatpickr-mobile-overlay');
 if (overlayToRemove) overlayToRemove.remove();
 document.body.style.overflow = '';
 originalClose();
 };
 instance._originalCloseOverridden = true;
 }
 } catch (e) {
 console.warn('_adjustMobilePosition failed', e);
 }
 }

 _ensureCalendarFooter(instance) {
 try {
 const container = instance.calendarContainer;
 if (!container) return;
 if (container._hasDateRangeFooter) return;
 container._hasDateRangeFooter = true;
 const footer = document.createElement('div');
 footer.style.display = 'flex';
 footer.style.justifyContent = 'space-between';
 footer.style.alignItems = 'center';
 footer.style.padding = '8px';
 footer.style.borderTop = '1px solid #eee';
 footer.style.background = '#fff';
 footer.style.gap = '8px';
 footer.style.flexWrap = 'wrap';
 const select = document.createElement('select');
 const presets = [
   'Custom',
   'Fixed',
   'Today',
   'Yesterday',
   'This week (starts Sunday)',
   'This week to date (starts Sunday)',
   'This week (starts Monday)',
   'This week to date (starts Monday)',
   'Last 7 days',
   'This month',
   'This month to date',
   'Last month',
   'Last 30 days',
   'This quarter',
   'This quarter to date',
   'This year',
   'This year to date'
 ];
 presets.forEach(p => { const opt = document.createElement('option'); opt.value = p; opt.text = p; select.appendChild(opt); });
 select.style.padding = '6px'; 
 select.style.borderRadius = '6px'; 
 select.style.border = '1px solid #ddd'; 
 select.value = 'Custom';
 select.style.fontSize = '13px';
 select.style.flex = window.innerWidth <= 640 ? '1 1 100%' : '1 1 auto';
 select.style.minWidth = window.innerWidth <= 640 ? '100%' : 'auto';
 
 const btnWrap = document.createElement('div'); 
 btnWrap.style.display = 'flex'; 
 btnWrap.style.gap = '8px';
 btnWrap.style.flex = window.innerWidth <= 640 ? '1 1 100%' : '0 0 auto';
 btnWrap.style.justifyContent = window.innerWidth <= 640 ? 'stretch' : 'flex-end';
 
 const btnApply = document.createElement('button'); 
 btnApply.type = 'button'; 
 btnApply.textContent = 'Apply';
 btnApply.classList = "btn btn-primary btn-height btn-width";
 btnApply.style.flex = window.innerWidth <= 640 ? '1' : '0 0 auto';
 
 const btnCancel = document.createElement('button'); 
 btnCancel.type = 'button'; 
 btnCancel.textContent = 'Cancel';
 btnCancel.classList = "btn btn-danger btn-height btn-width";
 btnCancel.style.flex = window.innerWidth <= 640 ? '1' : '0 0 auto';
 
 btnWrap.appendChild(btnCancel); 
 btnWrap.appendChild(btnApply);
 footer.appendChild(select); 
 footer.appendChild(btnWrap);
 container.appendChild(footer);
 select.addEventListener('change', () => {
 const val = select.value; if (val === 'Custom' || val === 'Fixed') return; const range = this._presetRange(val); if (!range) return; try { instance.setDate([range[0], range[1]], true, 'Y-m-d'); } catch (e) { }
 });
 btnApply.addEventListener('click', () => { 
   const sd = instance.selectedDates || []; 
   const f = sd[0] ? sd[0].toISOString().slice(0,10) : null; 
   const t = sd[1] ? sd[1].toISOString().slice(0,10) : null; 
   this._setFromValue(f); 
   this._setToValue(t); 
   this._syncToMin(); 
   this._emitChange(); 
   const overlay = document.getElementById('flatpickr-mobile-overlay');
   if (overlay) overlay.remove();
   instance.close(); 
 });
 btnCancel.addEventListener('click', () => { 
   try { 
     if (this._tempSelectedDates) { 
       instance.setDate(this._tempSelectedDates, true, 'Y-m-d'); 
     } 
   } catch (e) { } 
   const overlay = document.getElementById('flatpickr-mobile-overlay');
   if (overlay) overlay.remove();
   instance.close(); 
 });
 } catch (e) { console.warn('ensureCalendarFooter failed', e); }
 }

 // Add a header above each month with separate Start / End labels (one per month)
 _ensureCalendarHeader(instance) {
 try {
 const container = instance.calendarContainer;
 if (!container) return;
 if (container._hasDateRangeHeader) return;
 container._hasDateRangeHeader = true;
 try { container.style.overflow = 'visible'; container.style.zIndex = '9999'; } catch (e) { }
 try { if (container.parentElement) container.parentElement.style.overflow = 'visible'; } catch (e) { }
 const monthsWrapper = container.querySelector('.flatpickr-months');
 if (!monthsWrapper) return;
 const months = monthsWrapper.querySelectorAll('.flatpickr-month');
 if (!months || months.length ===0) return;
 // create header row sized to monthsWrapper width and with two equal cells
 const headerRow = document.createElement('div');
 headerRow.className = 'dr-header-row';
 headerRow.style.display = 'flex';
 headerRow.style.width = '100%';
 headerRow.style.boxSizing = 'border-box';
 headerRow.style.alignItems = 'center';
 headerRow.style.padding = '12px 8px';
 headerRow.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
 headerRow.style.pointerEvents = 'none';
 headerRow.style.zIndex = '8';
 headerRow.style.borderTopLeftRadius = '8px';
 headerRow.style.borderTopRightRadius = '8px';
 const leftCell = document.createElement('div'); 
 leftCell.textContent = 'Start'; 
 leftCell.style.flex = '1 1 50%'; 
 leftCell.style.textAlign = 'left'; 
 leftCell.style.fontSize = '14px'; 
 leftCell.style.fontWeight = '600'; 
 leftCell.style.color = '#ffffff';
 leftCell.style.paddingLeft = '8px';
 const rightCell = document.createElement('div'); 
 rightCell.textContent = 'End'; 
 rightCell.style.flex = '1 1 50%'; 
 rightCell.style.textAlign = 'right'; 
 rightCell.style.fontSize = '14px'; 
 rightCell.style.fontWeight = '600'; 
 rightCell.style.color = '#ffffff';
 rightCell.style.paddingRight = '8px';
 headerRow.appendChild(leftCell); headerRow.appendChild(rightCell);
 monthsWrapper.parentElement.insertBefore(headerRow, monthsWrapper);
 try { monthsWrapper.style.paddingTop = '6px'; } catch (e) { }
 try { 
   const styleTag = document.createElement('style'); 
   styleTag.textContent = ` 
 .flatpickr-prev-month, .flatpickr-next-month { z-index:12 !important; position: relative !important; } 
     .dr-header-row { margin-bottom:0 !important; } 
     .flatpickr-months { 
       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
       border-top-left-radius: 0 !important;
       border-top-right-radius: 0 !important;
     }
     .flatpickr-month { 
       background: transparent !important;
       color: #ffffff !important;
     }
   .flatpickr-current-month .flatpickr-monthDropdown-months {
       background: rgba(255, 255, 255, 0.2) !important;
       color: #ffffff !important;
   }
     .flatpickr-current-month input.cur-year {
       color: #ffffff !important;
   background: rgba(255, 255, 255, 0.2) !important;
     }
     .flatpickr-prev-month svg, .flatpickr-next-month svg {
       fill: #ffffff !important;
     }
     .flatpickr-calendar {
       border-top-left-radius: 8px !important;
       border-top-right-radius: 8px !important;
     }
     
     @media (max-width: 640px) {
       .flatpickr-calendar {
     position: fixed !important;
       left: 50% !important;
  top: 50% !important;
   transform: translate(-50%, -50%) !important;
   margin: 0 !important;
   width: calc(100vw - 32px) !important;
      max-width: 360px !important;
       max-height: calc(100vh - 80px) !important;
       }
    .flatpickr-innerContainer {
         overflow-x: hidden !important;
  }
       .flatpickr-rContainer {
         width: 100% !important;
       }
     .flatpickr-days {
width: 100% !important;
    }
     }
   `; 
   container.appendChild(styleTag); 
 } catch (e) { }
 } catch (e) { console.warn('ensureCalendarHeader failed', e); }
 }

 // compute preset ranges as [YYYY-MM-DD, YYYY-MM-DD]
 _presetRange(name) {
 const today = new Date();
 function toIso(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10); }
 
 // Helper to get day of week (0 = Sunday, 1 = Monday, etc.)
 function getStartOfWeek(date, startDay = 0) {
   const d = new Date(date);
   const day = d.getDay();
   const diff = (day < startDay ? 7 : 0) + day - startDay;
   d.setDate(d.getDate() - diff);
   return d;
 }
 
 function getStartOfQuarter(date) {
   const d = new Date(date);
   const quarter = Math.floor(d.getMonth() / 3);
   return new Date(d.getFullYear(), quarter * 3, 1);
 }
 
 function getEndOfQuarter(date) {
   const d = new Date(date);
const quarter = Math.floor(d.getMonth() / 3);
   return new Date(d.getFullYear(), quarter * 3 + 3, 0);
 }
 
 switch (name) {
 case 'Today': return [toIso(today), toIso(today)];
 case 'Yesterday': { 
   const y = new Date(today); 
   y.setDate(y.getDate() - 1); 
   return [toIso(y), toIso(y)]; 
 }
 case 'This week (starts Sunday)': { 
   const start = getStartOfWeek(today, 0);
   const end = new Date(start);
   end.setDate(end.getDate() + 6);
   return [toIso(start), toIso(end)]; 
 }
 case 'This week to date (starts Sunday)': { 
   const start = getStartOfWeek(today, 0);
   return [toIso(start), toIso(today)]; 
 }
 case 'This week (starts Monday)': { 
   const start = getStartOfWeek(today, 1);
   const end = new Date(start);
   end.setDate(end.getDate() + 6);
   return [toIso(start), toIso(end)]; 
 }
 case 'This week to date (starts Monday)': { 
 const start = getStartOfWeek(today, 1);
   return [toIso(start), toIso(today)]; 
 }
 case 'Last 7 days': 
 case 'Last 7 Days': { 
   const from = new Date(today); 
   from.setDate(from.getDate() - 6); 
   return [toIso(from), toIso(today)]; 
 }
 case 'Last 30 days':
 case 'Last 30 Days':
 case 'Last30 Days': { 
   const from = new Date(today); 
   from.setDate(from.getDate() - 29); 
   return [toIso(from), toIso(today)]; 
 }
 case 'This month':
 case 'This Month': { 
   const from = new Date(today.getFullYear(), today.getMonth(), 1); 
   const to = new Date(today.getFullYear(), today.getMonth() + 1, 0); 
   return [toIso(from), toIso(to)]; 
 }
 case 'This month to date': { 
   const from = new Date(today.getFullYear(), today.getMonth(), 1); 
return [toIso(from), toIso(today)]; 
 }
 case 'Last month':
 case 'Last Month': { 
   const from = new Date(today.getFullYear(), today.getMonth() - 1, 1); 
   const to = new Date(today.getFullYear(), today.getMonth(), 0); 
   return [toIso(from), toIso(to)]; 
 }
 case 'This quarter': { 
   const start = getStartOfQuarter(today);
   const end = getEndOfQuarter(today);
   return [toIso(start), toIso(end)]; 
 }
 case 'This quarter to date': { 
   const start = getStartOfQuarter(today);
   return [toIso(start), toIso(today)]; 
 }
 case 'This year': { 
   const from = new Date(today.getFullYear(), 0, 1); 
   const to = new Date(today.getFullYear(), 11, 31); 
   return [toIso(from), toIso(to)]; 
 }
 case 'This year to date': { 
   const from = new Date(today.getFullYear(), 0, 1); 
   return [toIso(from), toIso(today)]; 
 }
 default: return null;
 }
 }

 // Normalize input to YYYY-MM-DD or null
 _normalizeDate(value) {
 if (!value) return null;
 if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
 const partsDash = value.split('-');
 const partsSlash = value.split('/');
 if (partsDash.length ===3 && partsDash[0].length ===2) { const [d,m,y] = partsDash; return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; }
 if (partsSlash.length ===3 && partsSlash[0].length ===2) { const [d,m,y] = partsSlash; return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; }
 const d = new Date(value); if (isNaN(d.getTime())) return null; return d.toISOString().slice(0,10);
 }

 _onFromChange(e) {
 const val = this._normalizeDate(this.fromInput.value); this._setFromValue(val); this._syncToMin(); if (this._to && this._from && this._to < this._from) { this._setToValue(this._from); if (this._fp && typeof this._fp.setDate === 'function') this._fp.setDate([this._from, this._to].filter(Boolean), true, 'Y-m-d'); } this._emitChange();
 }

 _onToChange(e) {
 const val = this._normalizeDate(this.toInput.value);
 if (val && this._from && val < this._from) { this._setToValue(this._from); } else { this._setToValue(val); }
 if (this._fp && typeof this._fp.setDate === 'function') this._fp.setDate([this._from, this._to].filter(Boolean), true, 'Y-m-d'); this._emitChange();
 }

 _onClear() { this._setFromValue(null); this._setToValue(null); this._syncToMin(); if (this._fp && typeof this._fp.clear === 'function') this._fp.clear(); this._emitChange(); }

 _setFromValue(iso) { this._from = iso; this.fromInput.value = iso || ''; }
 _setToValue(iso) { this._to = iso; this.toInput.value = iso || ''; }
 _syncToMin() { if (this._from) { try { this.toInput.min = this._from; } catch (e) { } } else { try { this.toInput.removeAttribute('min'); } catch (e) { } } }
 _emitChange() { const detail = { fromDate: this._from, toDate: this._to }; this.dispatchEvent(new CustomEvent('daterangechange', { detail, bubbles: true, composed: true })); if (typeof this.onChange === 'function') { try { this.onChange(detail); } catch (err) { console.error(err); } } }
 getRange() { return { fromDate: this._from, toDate: this._to }; }
 setRange({ fromDate, toDate }) { this._setFromValue(this._normalizeDate(fromDate)); this._setToValue(this._normalizeDate(toDate)); this._syncToMin(); if (this._to && this._from && this._to < this._from) { this._setToValue(this._from); } if (this._fp && typeof this._fp.setDate === 'function') this._fp.setDate([this._from, this._to].filter(Boolean), true, 'Y-m-d'); this._emitChange(); }

 _onWindowResize() {
 // On resize, if flatpickr is open, re-apply header/footer adjustments and consider reinitializing for month count
 try {
 if (this._fp && this._fp.calendarContainer) {
 // if change between mobile and desktop sizes, re-init to change showMonths if necessary
 const mobile = (window.innerWidth <=640);
 const currentShowMonths = this._fp.config ? this._fp.config.showMonths : (this._fp.loadedPlugins && this._fp.loadedPlugins.showMonths);
 if ((mobile && this._fp.config.showMonths !==1) || (!mobile && this._fp.config.showMonths !==2)) {
 try { this._fp.destroy(); } catch (e) { }
 this._initFlatpickr();
 return;
 }
 this._ensureCalendarHeader(this._fp);
 this._ensureCalendarFooter(this._fp);
 if (mobile) this._adjustMobilePosition(this._fp);
 }
 } catch (e) { }
 }
}


customElements.define('date-range-control', DateRangeControlHTMLElement);

// At the end of the file add a reusable helper to read range from a control instance
export const DateRangeControl = {
    getDateRangeFromControl: function getDateRangeFromControl(controlId = 'dateRange') {
        try {
        const dr = document.querySelector(`date-range-control#${controlId}`) || document.getElementById(controlId);
   if (!dr) return { fromDate: null, toDate: null };
            if (typeof dr.getRange === 'function') {
                const r = dr.getRange() || {};
      return { fromDate: r.fromDate || null, toDate: r.toDate || null };
         }
         // fallback to internal properties or attributes
   const from = (dr._from !== undefined && dr._from !== null) ? dr._from : (dr.getAttribute && dr.getAttribute('from'));
  const to = (dr._to !== undefined && dr._to !== null) ? dr._to : (dr.getAttribute && dr.getAttribute('to'));
        return { fromDate: from || null, toDate: to || null };
        } catch (e) {
        console.warn('getDateRangeFromControl error', e);
  return { fromDate: null, toDate: null };
        }
    }
}

