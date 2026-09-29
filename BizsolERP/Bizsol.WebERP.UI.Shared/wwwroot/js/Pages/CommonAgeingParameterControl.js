import { AgeingParameterControlService } from '../JSServices/_AgeingParameterControlService.js';

// ── State  (mirrors C# FrmAgeingParameter) ────────────────────────────────────
// Table: DebtorCreditorAgingConfiguration
// Key columns: Desp | Days | DaysDesp | FormName | FormType | DR_CR
let _AP_isEditMode  = false;
let _AP_isNewMode   = false;
let _AP_currentDesp = '';     // currently loaded format Desp (= Saved Format name)
let _AP_tempDesp    = '';     // original Desp before rename (C# TempDesp)
let _AP_callbackFn  = null;
let _AP_FormName    = '';     // C# FormName  (e.g. 'StockAgeingReport')
let _AP_FormType    = '';     // C# FormType  (e.g. 'S')
let _AP_DR_CR       = 'N';   // default DR_CR = 'N'

// Re-open modal: restore last USED format; after NEW → one blank reopen (-- Select --).
const _AP_REOPEN_PREF = Object.create(null);
function _AP_reopenPrefKey(formName, formType) {
    return (formName || '') + '\x1e' + (formType || '');
}
function _AP_getReopenPref(formName, formType) {
    const key = _AP_reopenPrefKey(formName, formType);
    if (!_AP_REOPEN_PREF[key]) _AP_REOPEN_PREF[key] = { lastUseDesp: '', blankNextOpen: false };
    return _AP_REOPEN_PREF[key];
}

// ── Modal HTML ───────────────────────────────────────────────────────────────
function createAgeingParameterModal(id) {
    const modalId = id || 'AgeingParameterModal';
    if (document.getElementById(modalId)) return modalId;

    const html = `
    <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true"
         data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered" style="max-width:540px;">
            <div class="modal-content">

                <div class="modal-header py-2" style="background:#4a90d9;">
                    <h6 class="modal-title text-white fw-semibold mb-0">Ageing Parameter</h6>
                    <button type="button" class="btn-close btn-close-white btn-sm"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body pb-2">

                    <!-- Row 1: Saved Format dropdown + No of Columns + Buttons -->
                    <div id="AP_rowSavedFormat" class="d-flex align-items-end gap-2 mb-1 flex-wrap">
                        <div style="flex:1; min-width:150px;">
                            <label class="ap-lbl mb-1">Saved Format</label>
                            <select id="AP_ddlSavedFormat"
                                    class="form-control form-control-sm"
                                    onchange="AP_onFormatChange();">
                                <option value="">-- Select --</option>
                            </select>
                        </div>
                        <div style="width:110px;">
                            <label class="ap-lbl mb-1">No of Columns</label>
                            <input type="number" id="AP_txtNoOfColumns"
                                   class="form-control form-control-sm text-center"
                                   min="2" max="20" value="0"
                                   onchange="AP_onNoOfColumnsChange();"
                                   readonly />
                        </div>
                        <div class="d-flex flex-column flex-shrink-0">
                            <label class="ap-lbl mb-1 ap-lbl-spacer" aria-hidden="true">&nbsp;</label>
                            <div id="AP_btnGroup" class="d-flex gap-1 align-items-center">
                            <button id="AP_btnUse"
                                    class="btn btn-sm ap-btn"
                                    style="background:#4a90d9;color:#fff;"
                                    onclick="AP_onUse();">USE</button>
                            <button id="AP_btnEdit"
                                    class="btn btn-sm ap-btn btn-warning"
                                    onclick="AP_onEdit();">EDIT</button>
                            <button id="AP_btnNew"
                                    class="btn btn-sm ap-btn btn-success"
                                    onclick="AP_onNew();">NEW</button>
                            <button id="AP_btnSave"
                                    class="btn btn-sm ap-btn btn-primary"
                                    style="display:none;"
                                    onclick="AP_onSave();">SAVE</button>
                            <button id="AP_btnDel"
                                    class="btn btn-sm ap-btn btn-danger"
                                    onclick="AP_onDel();">DEL</button>
                            </div>
                        </div>
                    </div>

                    <!-- Row 2: Format Name (visible in NEW and EDIT modes) -->
                    <div id="AP_rowFormatName" class="mb-1" style="display:none;">
                        <label class="ap-lbl mb-1">
                            Format Name (Desp) <span class="text-danger">*</span>
                        </label>
                        <input type="text" id="AP_txtFormatName"
                               class="form-control form-control-sm"
                               placeholder="Enter format name"
                               maxlength="100" autocomplete="off" />
                    </div>

                    <!-- Grid: # | Days | Description (DaysDesp) -->
                    <div class="table-responsive mt-1" style="max-height:290px; overflow-y:auto;">
                        <table class="table table-bordered table-sm mb-0">
                            <thead>
                                <tr class="ap-thead">
                                    <th style="width:36px;text-align:center;">#</th>
                                    <th style="width:88px;text-align:center;">Days</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody id="AP_tbGrid"></tbody>
                        </table>
                    </div>

                </div>

                <div class="modal-footer py-1">
                    <button type="button" class="btn btn-sm btn-danger"
                            data-bs-dismiss="modal">Close</button>
                </div>

            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    if (!document.getElementById('AP_Styles')) {
        const s = document.createElement('style');
        s.id = 'AP_Styles';
        s.textContent = _AP_styles();
        document.head.appendChild(s);
    }
    return modalId;
}

// ── CSS ───────────────────────────────────────────────────────────────────────
function _AP_styles() {
    return `
    #AgeingParameterModal .modal-content    { border-radius:6px; overflow:hidden; }
    #AgeingParameterModal .ap-lbl           { font-size:12px; font-weight:600; color:#444; display:block; }
    #AgeingParameterModal .ap-thead th      { background:#4a90d9; color:#fff; font-size:12px; padding:5px 8px; }
    #AgeingParameterModal tbody td          { font-size:12px; padding:2px 4px; vertical-align:middle;
                                              background:#d0e8f7; }
    #AgeingParameterModal tbody tr:hover td { background:#bcd9ef; }
    #AgeingParameterModal .ap-row-num       { text-align:center; font-weight:700; color:#333; min-width:36px; }
    #AgeingParameterModal .ap-inp           { background:transparent; border:none; width:100%;
                                              padding:2px 4px; font-size:12px; outline:none; }
    #AgeingParameterModal .ap-inp:focus     { background:#fff; border:1px solid #4a90d9; border-radius:3px; }
    #AgeingParameterModal .ap-inp[readonly] { cursor:default; color:#555; }
    #AgeingParameterModal .ap-days-last     { background:#c5d8e8 !important; cursor:not-allowed; }
    #AgeingParameterModal .ap-lbl-spacer    { visibility:hidden; }
    #AgeingParameterModal #AP_rowSavedFormat .form-control-sm {
        height: calc(1.5em + 0.5rem + 2px);
        min-height: calc(1.5em + 0.5rem + 2px);
        box-sizing: border-box;
    }
    #AgeingParameterModal #AP_rowSavedFormat .ap-btn {
        height: calc(1.5em + 0.5rem + 2px);
        min-height: calc(1.5em + 0.5rem + 2px);
        max-height: calc(1.5em + 0.5rem + 2px);
        line-height: 1;
        font-size: 12px;
        font-weight: 700;
        padding: 0 10px;
        min-width: 44px;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    `;
}

// ── FillSpread equivalent ─────────────────────────────────────────────────────
// Matches C# FillSpread() exactly:
//   Row 0       → DaysDesp = "0-{Days[0]} D"
//   Row 1..n-2  → DaysDesp = "{Days[i-1]+1}-{Days[i]} D"
//   Row n-1     → DaysDesp = "> {Days[n-2]} D"  (if Days[n-2] > 0)
function _AP_fillDescriptions() {
    const trs = document.querySelectorAll('#AP_tbGrid tr');
    const n   = trs.length;
    if (n === 0) return;

    const getDays = (tr) => parseInt(tr.querySelector('.ap-days').value) || 0;
    const setDesp = (tr, v) => { const i = tr.querySelector('.ap-desp'); if (i) i.value = v; };

    // Row 0
    setDesp(trs[0], '0-' + getDays(trs[0]) + ' D');

    // Middle rows
    for (let i = 1; i <= n - 2; i++) {
        setDesp(trs[i], (getDays(trs[i - 1]) + 1) + '-' + getDays(trs[i]) + ' D');
    }

    // Last row
    if (n >= 2) {
        const prev = getDays(trs[n - 2]);
        if (prev > 0) setDesp(trs[n - 1], '> ' + prev + ' D');
    }
}

// ── SPDebtorsCreditorsList_Change equivalent ──────────────────────────────────
// On blur of Days input at row [idx]:
// Sets all rows below (except last) to max(their value, currentDays+1), then FillSpread.
function _AP_onDaysBlur(idx) {
    const trs = document.querySelectorAll('#AP_tbGrid tr');
    const n   = trs.length;
    let minRequired = (parseInt(trs[idx].querySelector('.ap-days').value) || 0) + 1;

    for (let i = idx + 1; i <= n - 2; i++) {
        const inp = trs[i].querySelector('.ap-days');
        if ((parseInt(inp.value) || 0) <= minRequired - 1) {
            inp.value = minRequired;
        }
        minRequired = (parseInt(inp.value) || 0) + 1;
    }
    _AP_fillDescriptions();
}

// ── Render grid rows ──────────────────────────────────────────────────────────
// rows = [{ Days, DaysDesp }, ...]   (column names match the DB table)
function _AP_renderGrid(rows, readOnly) {
    const n = rows.length;
    let html = '';
    rows.forEach(function (r, i) {
        const isLast    = (i === n - 1);
        const roDays    = (readOnly || isLast) ? 'readonly' : '';
        const daysClass = 'ap-inp ap-days' + (isLast ? ' ap-days-last' : '');
        const daysVal   = isLast ? 0 : (r.Days || 0);
        const onBlur    = (!readOnly && !isLast) ? `onblur="AP_onDaysBlur(${i});"` : '';

        html += `<tr>
            <td class="ap-row-num">${i + 1}</td>
            <td><input type="number" class="${daysClass}" data-idx="${i}"
                       value="${daysVal}" min="0" ${roDays} ${onBlur} /></td>
            <td><input type="text" class="ap-inp ap-desp" data-idx="${i}"
                       value="${r.DaysDesp || ''}" readonly
                       maxlength="100" autocomplete="off" /></td>
        </tr>`;
    });
    document.getElementById('AP_tbGrid').innerHTML = html;
}

// ── Empty rows builder ────────────────────────────────────────────────────────
function _AP_buildEmptyRows(n) {
    const rows = [];
    for (let i = 0; i < n; i++) rows.push({ Days: 0, DaysDesp: '' });
    return rows;
}

// ── Collect grid data → array of { Days, DaysDesp } ──────────────────────────
function _AP_collectGridData() {
    const rows = [];
    document.querySelectorAll('#AP_tbGrid tr').forEach(function (tr) {
        const d = tr.querySelector('.ap-days');
        const s = tr.querySelector('.ap-desp');
        if (d && s) rows.push({ Days: parseInt(d.value) || 0, DaysDesp: s.value });
    });
    return rows;
}

function _AP_loadFormatList(selectDesp, autoLoad) {
    AgeingParameterControlService.GetSavedFormatList(_AP_FormName, _AP_FormType)
        .then(function (list) {
            let opt = '<option value="">-- Select --</option>';
            (list || []).forEach(function (item) {
                opt += `<option value="${item.Desp}">${item.Desp}</option>`;
            });
            const ddl = document.getElementById('AP_ddlSavedFormat');
            if (!ddl) return;
            ddl.innerHTML = opt;

            if (selectDesp) {
                ddl.value = selectDesp;
                if (autoLoad !== false) _AP_loadFormatDetail(selectDesp);
            } else {
                $('#AP_txtNoOfColumns').val(0);
                $('#AP_tbGrid').html('');
            }
        })
        .catch(function (err) { console.error('AP: GetSavedFormatList failed', err); });
}

function _AP_loadFormatDetail(desp) {
    AgeingParameterControlService.GetFormatDetail(desp, _AP_FormName, _AP_FormType)
        .then(function (detail) {
            if (!detail || !detail.Rows || detail.Rows.length === 0) {
                $('#AP_txtNoOfColumns').val(0);
                $('#AP_tbGrid').html('');
                return;
            }
            $('#AP_txtNoOfColumns').val(detail.Rows.length);
            _AP_renderGrid(detail.Rows, true);    // read-only in view mode
        })
        .catch(function (err) { console.error('AP: GetFormatDetail failed', err); });
}

// ── Saved Format combo change ─────────────────────────────────────────────────
function AP_onFormatChange() {
    const desp = $('#AP_ddlSavedFormat').val() || '';
    _AP_currentDesp = desp;
    if (!desp) {
        $('#AP_txtNoOfColumns').val(0);
        $('#AP_tbGrid').html('');
        return;
    }
    _AP_loadFormatDetail(desp);
}

// ── No of Columns change  (TxtNoOfColumns_TextChange equivalent) ──────────────
function AP_onNoOfColumnsChange() {
    if (!_AP_isNewMode && !_AP_isEditMode) return;
    let n = parseInt($('#AP_txtNoOfColumns').val()) || 0;
    if (n < 2)  n = 2;
    if (n > 20) n = 20;
    $('#AP_txtNoOfColumns').val(n);

    const existing = _AP_collectGridData();
    while (existing.length < n) existing.push({ Days: 0, DaysDesp: '' });
    _AP_renderGrid(existing.slice(0, n), false);
    _AP_fillDescriptions();
}

// ── USE  (btnOk_Click) ────────────────────────────────────────────────────────
function AP_onUse() {
    const desp = $('#AP_ddlSavedFormat').val() || '';
    if (!desp) {
        toastr.warning('Please select a saved format first.');
        return;
    }
    _AP_fillDescriptions();
    const rows = _AP_collectGridData();

    let ageingParameters = '';
    if (rows && rows.length > 0) {
        ageingParameters = rows.map(function (row, idx) {
            let days = parseInt(row.Days, 10) || 0;
            const daysDesp = row.DaysDesp != null ? String(row.DaysDesp) : '';
            if (idx === rows.length - 1 && days === 0) {
                const fromDesp = />\s*(\d+)\s*D/i.exec(daysDesp);
                if (fromDesp) {
                    days = parseInt(fromDesp[1], 10) || 0;
                } else if (rows.length >= 2) {
                    days = parseInt(rows[rows.length - 2].Days, 10) || 0;
                }
                if (!days) {
                    days = 365;
                }
            }
            return daysDesp + ',' + days;
        }).join('#') + '#';
    }

    const result = {
        Desp             : desp,
        FormName         : _AP_FormName,
        FormType         : _AP_FormType,
        Rows             : rows,
        AgeingParameters : ageingParameters
    };

    const pref = _AP_getReopenPref(_AP_FormName, _AP_FormType);
    pref.lastUseDesp    = desp;
    pref.blankNextOpen  = false;

    if (typeof _AP_callbackFn === 'function') {
        _AP_callbackFn(result);
    } else {
        const hf = document.getElementById('AP_hfCallBackFunctionName');
        if (hf && hf.value && typeof window[hf.value] === 'function') {
            window[hf.value](result);
        }
    }
    $('#AgeingParameterModal').modal('hide');
}

// ── EDIT  (btnEdit_Click) ──────────────────────────────────────────────────────
function AP_onEdit() {
    const desp = $('#AP_ddlSavedFormat').val() || '';
    if (!desp) { toastr.warning('Please select a format to edit.'); return; }

    _AP_isEditMode  = true;
    _AP_isNewMode   = false;
    _AP_tempDesp    = desp;   // save original name for rename/delete (C# TempDesp)

    $('#AP_txtFormatName').val(desp);
    $('#AP_rowFormatName').show();

    _AP_makeGridEditable();
    $('#AP_txtNoOfColumns').prop('readonly', false);
    _AP_setEditModeButtons();
}

// ── NEW  (btnNew_Click) ────────────────────────────────────────────────────────
function AP_onNew() {
    _AP_isNewMode   = true;
    _AP_isEditMode  = false;
    _AP_currentDesp = '';
    _AP_tempDesp    = '';

    _AP_getReopenPref(_AP_FormName, _AP_FormType).blankNextOpen = true;

    $('#AP_ddlSavedFormat').val('').trigger('change');   // reset to -- Select --
    $('#AP_rowSavedFormat').hide();          // hide combo (C# CmbSavedFormat.Visible=false)
    $('#AP_rowFormatName').show();           // show name input (C# TxtDesp.Visible=true)
    $('#AP_txtFormatName').val('');
    $('#AP_txtNoOfColumns').val(4).prop('readonly', false);

    _AP_renderGrid(_AP_buildEmptyRows(4), false);
    _AP_setEditModeButtons();
    $('#AP_txtFormatName').focus();
}

// ── SAVE  (btnSave_Click) ──────────────────────────────────────────────────────
function AP_onSave() {
    const desp = $('#AP_txtFormatName').val().trim();
    if (!desp) {
        toastr.error('Please enter a format name.');
        $('#AP_txtFormatName').focus();
        return;
    }

    _AP_fillDescriptions();
    const rows = _AP_collectGridData();
    if (rows.length === 0) { toastr.error('Please add at least one row.'); return; }

    // Validate Days (all rows except last must have Days > 0)
    for (let i = 0; i < rows.length - 1; i++) {
        if (!rows[i].Days || rows[i].Days <= 0) {
            toastr.error('Please enter Days for row ' + (i + 1) + '.'); return;
        }
        if (!String(rows[i].DaysDesp || '').trim()) {
            toastr.error('Please enter Description for row ' + (i + 1) + '.'); return;
        }
    }
    if (!String(rows[rows.length - 1].DaysDesp || '').trim()) {
        toastr.error('Please enter Description for the last row.'); return;
    }

    const payload = {
        Desp     : desp,
        TempDesp : _AP_tempDesp,   
        FormName : _AP_FormName,
        FormType : _AP_FormType,
        DR_CR    : _AP_DR_CR,
        Rows     : rows            
    };

    AgeingParameterControlService.SaveFormat(payload)
        .then(function () {
            toastr.success('Format saved successfully.');

            _AP_isNewMode   = false;
            _AP_isEditMode  = false;
            _AP_currentDesp = desp;
            _AP_tempDesp    = '';

            $('#AP_tbGrid').html('');
            $('#AP_txtNoOfColumns').val(0).prop('readonly', true);
            $('#AP_rowFormatName').hide();
            $('#AP_rowSavedFormat').show();
            _AP_setViewModeButtons();

            const pref = _AP_getReopenPref(_AP_FormName, _AP_FormType);
            pref.lastUseDesp   = desp;
            pref.blankNextOpen = false;

            _AP_loadFormatList(desp, true);
        })
        .catch(function (err) {
            toastr.error(err && err.Msg ? err.Msg : 'Error saving format.');
        });
}

function AP_onDel() {
    const desp = $('#AP_ddlSavedFormat').val() || '';
    if (!desp) { toastr.warning('Please select a format to delete.'); return; }
    if (!confirm('Delete format "' + desp + '"?\nThis cannot be undone.')) return;

    AgeingParameterControlService.DeleteFormat(desp, _AP_FormName, _AP_FormType)
        .then(function () {
            toastr.success('Format "' + desp + '" deleted.');
            _AP_currentDesp = '';
            _AP_isNewMode   = false;
            _AP_isEditMode  = false;

            $('#AP_tbGrid').html('');
            $('#AP_txtNoOfColumns').val(0);
            _AP_setViewModeButtons();
            const pref = _AP_getReopenPref(_AP_FormName, _AP_FormType);
            if (pref.lastUseDesp === desp) pref.lastUseDesp = '';

            _AP_loadFormatList('', false);
        })
        .catch(function (err) {
            toastr.error(err && err.Msg ? err.Msg : 'Error deleting format.');
        });
}

function AP_onDaysBlur(idx) { _AP_onDaysBlur(idx); }

function _AP_makeGridEditable() {
    const trs = document.querySelectorAll('#AP_tbGrid tr');
    const n   = trs.length;
    trs.forEach(function (tr, i) {
        const isLast = (i === n - 1);
        const dInp   = tr.querySelector('.ap-days');
        const despInp = tr.querySelector('.ap-desp');

        if (dInp) {
            if (isLast) {
                dInp.setAttribute('readonly', 'readonly');
                dInp.classList.add('ap-days-last');
            } else {
                dInp.removeAttribute('readonly');
                dInp.classList.remove('ap-days-last');
                dInp.setAttribute('onblur', 'AP_onDaysBlur(' + i + ');');
            }
        }
        if (despInp) despInp.setAttribute('readonly', 'readonly');
    });
}

function _AP_setViewModeButtons() {
    $('#AP_btnUse, #AP_btnEdit, #AP_btnNew, #AP_btnDel').prop('disabled', false).show();
    $('#AP_btnSave').hide();
    $('#AP_ddlSavedFormat').prop('disabled', false);
}

function _AP_setEditModeButtons() {
    $('#AP_btnUse, #AP_btnEdit, #AP_btnNew, #AP_btnDel').prop('disabled', true);
    $('#AP_btnSave').show();
    $('#AP_ddlSavedFormat').prop('disabled', true);
}

// ── Public initialiser ────────────────────────────────────────────────────────
/**
 * Opens the Ageing Parameter modal.
 *
 * @param {Object} options
 *   options.FormName             - matches DB column FormName  (required for filtering)
 *   options.FormType             - matches DB column FormType  (required for filtering)
 *   options.DR_CR                - matches DB column DR_CR     (default 'N')
 *   options.CallBackFn           - function(result) on USE; result includes
 *                                  AgeingParameters (built only when USE is clicked)
 *   options.CallBackFunctionName - global function name called on USE
 *   options.DefaultDesp          - wins over restored selection when set non-empty
 */
function initializeAgeingParameterControl(options) {
    options = options || {};

    _AP_FormName   = options.FormName  || '';
    _AP_FormType   = options.FormType  || '';
    _AP_DR_CR      = options.DR_CR     || 'N';
    _AP_callbackFn = options.CallBackFn || null;

    if (options.CallBackFunctionName) {
        let hf = document.getElementById('AP_hfCallBackFunctionName');
        if (!hf) {
            hf = document.createElement('input');
            hf.type = 'hidden';
            hf.id   = 'AP_hfCallBackFunctionName';
            document.body.appendChild(hf);
        }
        hf.value = options.CallBackFunctionName;
    }

    const modalId = createAgeingParameterModal(options.ModalId || 'AgeingParameterModal');

    _AP_isNewMode   = false;
    _AP_isEditMode  = false;
    _AP_currentDesp = '';
    _AP_tempDesp    = '';

    _AP_setViewModeButtons();
    $('#AP_rowFormatName').hide();
    $('#AP_rowSavedFormat').show();
    $('#AP_txtNoOfColumns').val(0).prop('readonly', true);
    $('#AP_tbGrid').html('');

    const pref             = _AP_getReopenPref(_AP_FormName, _AP_FormType);
    const explicitDesp    = options.DefaultDesp ? String(options.DefaultDesp).trim() : '';
    let selectDespForOpen = explicitDesp;
    if (!selectDespForOpen) {
        if (pref.blankNextOpen) {
            selectDespForOpen = '';
            pref.blankNextOpen = false;
        } else if (pref.lastUseDesp) {
            selectDespForOpen = pref.lastUseDesp;
        }
    } else {
        pref.blankNextOpen = false;
    }

    _AP_loadFormatList(selectDespForOpen, true);

    setTimeout(function () {
        $(`#${modalId}`).modal({ backdrop: 'static', keyboard: false });
        $(`#${modalId}`).modal('show');

        $(`#${modalId}`).off('hidden.bs.modal.ap').on('hidden.bs.modal.ap', function () {
            _AP_isNewMode  = false;
            _AP_isEditMode = false;
            _AP_setViewModeButtons();
            $('#AP_rowFormatName').hide();
            $('#AP_rowSavedFormat').show();
        });
    }, 100);
}

window.AP_onFormatChange      = AP_onFormatChange;
window.AP_onNoOfColumnsChange = AP_onNoOfColumnsChange;
window.AP_onDaysBlur          = AP_onDaysBlur;
window.AP_onUse               = AP_onUse;
window.AP_onEdit              = AP_onEdit;
window.AP_onNew               = AP_onNew;
window.AP_onSave              = AP_onSave;
window.AP_onDel               = AP_onDel;
window.initializeAgeingParameterControl = initializeAgeingParameterControl;
window.createAgeingParameterModal       = createAgeingParameterModal;

export {
    createAgeingParameterModal,
    initializeAgeingParameterControl,
    AP_onFormatChange,
    AP_onNoOfColumnsChange,
    AP_onDaysBlur,
    AP_onUse,
    AP_onEdit,
    AP_onNew,
    AP_onSave,
    AP_onDel
};
