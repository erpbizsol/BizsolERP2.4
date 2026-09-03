let arrayObjectListColumns = [];
let G_ObjectListData = [];
let G_ObjectListFilteredData = [];
let G_ObjectListMultiSelect = false;
let G_ObjectListDefaultColumnFilter = '';  // field name pre-selected in the column dropdown
let G_ObjectListModalId = '';              // tracks the exact modal ID to close after Done
let G_ObjectListNumericColumns = [];       // field names whose totals show on selection

/**
 * Creates and injects the Object List Control modal into the DOM
 * @param {string} id - Optional modal ID
 * @returns {string} The modal ID
 */
function createObjectlistControlModal(id) {
    const modalId = id || 'ObjectListControlModal';
    const modalHTML = `
        <div class="modal fade bs-example-modal-center" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-lg" style="max-height:90vh; margin:5vh auto;">
                <div class="modal-content" style="height:85vh; display:flex; flex-direction:column;">
                    <div class="modal-header" style="flex-shrink:0;">
                        <h5 class="modal-title">Select Record</h5>
                    </div>
                    <div class="modal-body" style="display:flex; flex-direction:column; overflow:hidden; padding-bottom:0;">
                        <div class="row mb-2" style="flex-shrink:0;">
                            <div class="col-sm-4" id="objListFilterColWrapper">
                                <select id="objListFilterDropdown" class="form-control form-control-sm">
                                    <option value="">-- All --</option>
                                </select>
                            </div>
                            <div class="col-sm-3">
                                <select id="objListMatchType" class="form-control form-control-sm">
                                    <option value="contains"   selected>Contains</option>
                                    <option value="startswith">Starts With</option>
                                    <option value="endswith"  >Ends With</option>
                                </select>
                            </div>
                            <div class="col-sm-5">
                                <input type="text" id="objListSearchInput" class="form-control form-control-sm"
                                    placeholder="Search..." autocomplete="off" />
                            </div>
                        </div>
                        <div style="flex:1; overflow-y:auto; border:1px solid #dee2e6; border-radius:4px;">
                            <table class="table table-bordered table-hover table-sm mb-0" style="width:100%;">
                                <thead id="objListTableHead" style="position:sticky; top:0; z-index:1; background:#fff;"></thead>
                                <tbody id="objListTableBody"></tbody>
                            </table>
                        </div>
                        <div id="objListTotalsBar" style="display:none; flex-shrink:0; align-items:center; flex-wrap:wrap; gap:12px; background:#f0f4ff; border:1px solid #c7d4f0; border-radius:4px; padding:6px 10px; margin-top:6px; font-size:13px; font-weight:600; color:#2c3e6b;">
                        </div>
                        <div class="text-end mt-2 pb-2" style="flex-shrink:0;">
                            <button class="btn btn-primary btn-height" onclick="onObjectList_Done();">Done</button>
                            &nbsp;
                            <a class="btn btn-danger btn-height" data-bs-dismiss="modal" aria-label="Close">Close</a>
                            <input type="hidden" id="hfObjList_CallBackFunctionName" value="" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (!document.getElementById(modalId)) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    return modalId;
}

/**
 * Renders visible column headers into the table thead
 * @param {Array} columns
 */
function buildObjectListHeader(columns) {
    let headerHTML = '<tr>';
    columns.forEach(function (col) {
        // Show all columns in header, but apply display:none if not visible
        const displayStyle = col.visible !== false ? '' : 'style="display:none;"';
        headerHTML += `<th ${displayStyle}>${col.header}</th>`;
    });
    headerHTML += '</tr>';
    $('#objListTableHead').html(headerHTML);
}

/**
 * Renders data rows into the table tbody and tracks the current filtered dataset
 * @param {Array} data
 * @param {Array} columns
 */
function renderObjectListRows(data, columns) {
    G_ObjectListFilteredData = data;

    let bodyHTML = '';
    data.forEach(function (row, index) {
        bodyHTML += `<tr class="objlist-row" style="cursor:pointer;" data-index="${index}">`;
        columns.forEach(function (col) {
            // Render all columns, but apply display:none if not visible
            let cellValue = row[col.field] !== undefined && row[col.field] !== null ? row[col.field] : '';
            if (G_ObjectListNumericColumns.includes(col.field) && cellValue !== '') {
                cellValue = parseFloat(cellValue).toFixed(3);
            }
            const displayStyle = col.visible !== false ? '' : 'style="display:none;"';
            bodyHTML += `<td ${displayStyle}>${cellValue}</td>`;
        });
        bodyHTML += '</tr>';
    });

    $('#objListTableBody').html(
        bodyHTML || '<tr><td colspan="100" class="text-center text-muted py-2">No records found</td></tr>'
    );

    $('#objListTableBody').off('click', '.objlist-row').on('click', '.objlist-row', function () {
        if (G_ObjectListMultiSelect) {
            $(this).toggleClass('table-primary');
        } else {
            $('#objListTableBody .objlist-row').removeClass('table-primary');
            $(this).addClass('table-primary');
        }
        updateObjectListTotals();
    });

    // Reset totals bar when rows re-render (filter change)
    $('#objListTotalsBar').hide().html('');
}

/**
 * Recalculates and renders the totals bar based on currently selected rows.
 * Shows selected row count + sum of each NumericColumns field.
 */
function updateObjectListTotals() {
    const $bar = $('#objListTotalsBar');

    const $selected = $('#objListTableBody .objlist-row.table-primary');
    const count = $selected.length;

    if (count === 0 || G_ObjectListNumericColumns.length === 0) {
        $bar.hide().html('');
        return;
    }

    // Sum each numeric column across selected rows
    const totals = {};
    G_ObjectListNumericColumns.forEach(function (field) { totals[field] = 0; });

    $selected.each(function () {
        const idx = parseInt($(this).data('index'), 10);
        const row = G_ObjectListFilteredData[idx];
        if (!row) return;
        G_ObjectListNumericColumns.forEach(function (field) {
            const val = parseFloat(String(row[field] || '').replace(/,/g, '')) || 0;
            totals[field] += val;
        });
    });

    // Build bar HTML
    let html = `<span style="margin-right:16px;">&#10003; Selected: <strong>${count}</strong></span>`;
    G_ObjectListNumericColumns.forEach(function (field) {
        // Find the column header for this field
        const col = arrayObjectListColumns.find(function (c) { return c.field === field; });
        const label = col ? col.header : field;
        const total = totals[field];
        const formatted = parseFloat(total).toFixed(3);
        html += `<span style="margin-right:16px;">${label}: <strong>${formatted}</strong></span>`;
    });

    $bar.html(html).css('display', 'flex');
}

/**
 * Returns true if cellValue matches term using the chosen match type
 * @param {string} cellValue
 * @param {string} term
 * @param {string} matchType  - 'contains' | 'startswith' | 'endswith'
 */
function objListMatchValue(cellValue, term, matchType) {
    const val = cellValue.toLowerCase();
    switch (matchType) {
        case 'startswith': return val.startsWith(term);
        case 'endswith':   return val.endsWith(term);
        default:           return val.includes(term);       // 'contains'
    }
}

/**
 * Applies all three filters together:
 *   - Column dropdown  → which column to search in (or all visible columns)
 *   - Match type dropdown → Contains / Starts With / Ends With
 *   - Search box       → the search term
 * @param {Array} data
 * @param {Array} columns
 */
function applyObjectListFilters(data, columns) {
    const term          = $('#objListSearchInput').val().toLowerCase().trim();
    const selectedField = $('#objListFilterDropdown').val();
    const matchType     = $('#objListMatchType').val() || 'contains';

    let filtered = data.filter(function (row) {
        if (!term) return true;

        if (selectedField && selectedField !== '') {
            const cellValue = String(row[selectedField] !== null && row[selectedField] !== undefined ? row[selectedField] : '');
            return objListMatchValue(cellValue, term, matchType);
        }

        // No column selected → apply match across all visible columns
        return columns.some(function (col) {
            if (col.visible === false) return false;
            const cellValue = String(row[col.field] !== null && row[col.field] !== undefined ? row[col.field] : '');
            return objListMatchValue(cellValue, term, matchType);
        });
    });

    // No match → show all rows instead of empty grid
    if (term && filtered.length === 0) {
        filtered = data;
    }

    renderObjectListRows(filtered, columns);
}

/**
 * Populates the dropdown with visible COLUMN NAMES (headers).
 * Selecting a column scopes the search box to that column only.
 * @param {Array}  columns
 * @param {string} preSelectField - optional field to pre-select on open
 */
function buildFilterColumnDropdown(columns, preSelectField) {
    let options = '<option value="">-- All --</option>';

    columns.forEach(function (col) {
        if (col.visible === false) return;
        const selected = (preSelectField && col.field === preSelectField) ? 'selected' : '';
        options += `<option value="${col.field}" ${selected}>${col.header}</option>`;
    });

    $('#objListFilterDropdown').html(options);
    $('#objListFilterColWrapper').show();
}

function attachKeyboardNavigation() {
    $(document).off('keydown.objlist').on('keydown.objlist', function (e) {
        if (!$('#objListTableBody').is(':visible')) return;

        // Enter on a selected row triggers Done
        if (e.key === 'Enter') {
            if ($('#objListTableBody .objlist-row.table-primary').length > 0) {
                e.preventDefault();
                onObjectList_Done();
            }
            return;
        }

        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

        e.preventDefault();

        const $rows = $('#objListTableBody .objlist-row');
        if ($rows.length === 0) return;

        // Find the lowest-indexed currently highlighted row as the cursor
        let cursorIndex = -1;
        $rows.each(function (i) {
            if ($(this).hasClass('table-primary') && cursorIndex === -1) {
                cursorIndex = i;
            }
        });
        // For ArrowDown use the last highlighted row as cursor when extending
        if (e.key === 'ArrowDown' && G_ObjectListMultiSelect && e.shiftKey) {
            $rows.each(function (i) {
                if ($(this).hasClass('table-primary')) cursorIndex = i;
            });
        }

        let nextIndex;
        if (e.key === 'ArrowDown') {
            nextIndex = cursorIndex < $rows.length - 1 ? cursorIndex + 1 : cursorIndex;
        } else {
            nextIndex = cursorIndex > 0 ? cursorIndex - 1 : 0;
        }

        if (G_ObjectListMultiSelect && e.shiftKey) {
            // Extend selection — toggle the next row without clearing others
            $($rows[nextIndex]).addClass('table-primary');
        } else {
            // Move selection — clear all, select only next row
            $rows.removeClass('table-primary');
            $($rows[nextIndex]).addClass('table-primary');
        }

        // Scroll the newly focused row into view smoothly
        $rows[nextIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });

        updateObjectListTotals();
    });
}

/**
 * Builds the full table (header + rows) and wires up all filter controls + keyboard nav
 * @param {Array} data
 * @param {Array} columns
 */
function buildObjectListTable(data, columns) {
    buildObjectListHeader(columns);
    buildFilterColumnDropdown(columns, G_ObjectListDefaultColumnFilter);
    renderObjectListRows(data, columns);

    $('#objListSearchInput').off('input.objlist').on('input.objlist', function () {
        applyObjectListFilters(data, columns);
    });

    $('#objListFilterDropdown').off('change.objlist').on('change.objlist', function () {
        applyObjectListFilters(data, columns);
    });

    $('#objListMatchType').off('change.objlist').on('change.objlist', function () {
        applyObjectListFilters(data, columns);
    });

    attachKeyboardNavigation();
}

/**
 * Handles the Done button click — returns selected row(s) to the callback.
 * Single-select: returns array with one object.
 * Multi-select:  returns array with all selected objects.
 */
function onObjectList_Done() {
    const $selectedRows = $('#objListTableBody .objlist-row.table-primary');
    const callbackFunctionName = $('#hfObjList_CallBackFunctionName').val();

    if ($selectedRows.length === 0) {
        if (typeof toastr !== 'undefined') {
            toastr.warning('Please select a record');
        } else {
            alert('Please select a record');
        }
        return;
    }

    const selectedData = [];
    $selectedRows.each(function () {
        const index = parseInt($(this).data('index'), 10);
        const row = G_ObjectListFilteredData[index];
        if (row) selectedData.push(row);
    });

    if (callbackFunctionName && typeof window[callbackFunctionName] === 'function') {
        window[callbackFunctionName](selectedData);
    }

    $(`#${G_ObjectListModalId}`).modal('hide');
}

/**
 * Initializes and opens the Object List Control modal
 * @param {Object}  options
 * @param {string}  options.ModalId                     - Optional modal element ID
 * @param {Array}   options.ClientOrderProjectData       - Data array to display
 * @param {Array}   options.Columns                     - Only list columns to hide/rename;
 *                                                         all data keys auto-shown by default
 * @param {string}  options.CallBackFunctionName_btnDone - Global callback name
 * @param {string}  options.searchvalue                  - Pre-fill search; '.' = show all
 * @param {boolean} options.MultiSelect           - true = multi-row toggle; false = single
 * @param {string}  options.DefaultColumnfilter  - field name to pre-select in the column
 *                                                 dropdown when the modal opens (e.g. 'OrderNo')
 * @param {Array}   options.NumericColumns        - field names to sum for selected rows
 *                                                 e.g. ['Qty', 'Weight', 'Amount']
 * @param {number}  options.NoOfHideColumn        - hide last N columns automatically
 *                                                 e.g. 10 → last 10 columns are hidden
 */
function initializeObjectlistControl(options) {
    options = options || {};

    G_ObjectListMultiSelect         = options.MultiSelect         === true;
    G_ObjectListDefaultColumnFilter = (options.DefaultColumnfilter || '').toString().trim();
    G_ObjectListNumericColumns      = Array.isArray(options.NumericColumns) ? options.NumericColumns : [];
    G_ObjectListModalId             = (options.ModalId || 'ObjectListControlModal');

    const modalId = createObjectlistControlModal(options.ModalId || 'ObjectListControlModal');

    G_ObjectListData = Array.isArray(options.ClientOrderProjectData) ? options.ClientOrderProjectData : [];

    // Build override map — only list columns to HIDE or rename
    const overrideMap = {};
    if (Array.isArray(options.Columns)) {
        options.Columns.forEach(function (col) {
            overrideMap[col.field] = col;
        });
    }

    let columns = [];
    if (G_ObjectListData.length > 0) {
        const allKeys  = Object.keys(G_ObjectListData[0]);
        const hideCount = parseInt(options.NoOfHideColumn, 10) || 0;
        const hideFromIndex = hideCount > 0 ? Math.max(0, allKeys.length - hideCount) : allKeys.length;

        columns = allKeys.map(function (key, idx) {
            const override = overrideMap[key] || {};
            // Hidden by NoOfHideColumn (last N) unless explicitly overridden
            const hiddenByCount = idx >= hideFromIndex;
            return {
                field:   key,
                header:  override.header  !== undefined ? override.header  : key,
                visible: override.visible !== undefined ? override.visible : !hiddenByCount
            };
        });
    }

    arrayObjectListColumns = columns;

    if (options.CallBackFunctionName_btnDone) {
        $('#hfObjList_CallBackFunctionName').val(options.CallBackFunctionName_btnDone);
    }

    if (options.ModalTitle) {
        $(`#${modalId} .modal-title`).text(options.ModalTitle);
    }
    if (options.DoneButtonText) {
        $(`#${modalId}`).find('button.btn-primary.btn-height').first().text(options.DoneButtonText);
    }

    // Apply initial search value
    const rawSearch   = (options.searchvalue || '').toString().trim();
    const searchValue = (rawSearch === '.') ? '' : rawSearch;
    const matchType   = (options.MatchType || 'contains').toString().toLowerCase();

    // If a search value is provided, check how many rows match before opening the modal
    if (searchValue !== '') {
        const matchField = (G_ObjectListDefaultColumnFilter || '').trim();
        const term = searchValue.toLowerCase();
        const preFiltered = G_ObjectListData.filter(function (row) {
            if (matchField !== '') {
                const cellValue = String(row[matchField] !== null && row[matchField] !== undefined ? row[matchField] : '');
                return objListMatchValue(cellValue, term, matchType);
            }
            return arrayObjectListColumns.some(function (col) {
                if (col.visible === false) return false;
                const cellValue = String(row[col.field] !== null && row[col.field] !== undefined ? row[col.field] : '');
                return objListMatchValue(cellValue, term, matchType);
            });
        });

        // Exactly one match — return directly without opening the modal
        if (preFiltered.length === 1) {
            const callbackFunctionName = options.CallBackFunctionName_btnDone || '';
            if (callbackFunctionName && typeof window[callbackFunctionName] === 'function') {
                window[callbackFunctionName]([preFiltered[0]]);
            }
            return;
        }
    }

    $('#objListSearchInput').val(searchValue);
    $('#objListMatchType').val(matchType === 'startswith' || matchType === 'endswith' ? matchType : 'contains');
    $('#objListTableBody .objlist-row').removeClass('table-primary');

    buildObjectListTable(G_ObjectListData, arrayObjectListColumns);

    // Pre-select the default column in the dropdown
    $('#objListFilterDropdown').val(G_ObjectListDefaultColumnFilter || '');

    if (searchValue !== '') {
        applyObjectListFilters(G_ObjectListData, arrayObjectListColumns);
    }

    setTimeout(function () {
        $(`#${modalId}`).modal({
            backdrop: 'static',
            keyboard: false
        });
        $(`#${modalId}`).modal('show');

        // Remove keyboard listener when modal is closed
        $(`#${modalId}`).off('hidden.bs.modal.objlist').on('hidden.bs.modal.objlist', function () {
            $(document).off('keydown.objlist');
        });
    }, 100);
}

window.onObjectList_Done = onObjectList_Done;
window.initializeObjectlistControl = initializeObjectlistControl;
window.createObjectlistControlModal = createObjectlistControlModal;

export {
    createObjectlistControlModal,
    buildObjectListHeader,
    buildObjectListTable,
    renderObjectListRows,
    onObjectList_Done,
    initializeObjectlistControl
};
