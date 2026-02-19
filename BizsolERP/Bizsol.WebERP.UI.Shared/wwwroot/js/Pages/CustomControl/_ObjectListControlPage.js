'use strict';

var Conn_Local = null;
    var LocalMultiSelect = false;
    var get_value = '';
    var Values = '';
    var GlobalUseLikeSearchInBothSide = 'N';
    var GlobalQuery = '';
    var GlobalFilterCondition = '';
    var GlobalFilterCondition1 = '';
    var GlobalNoOfHideColumn = 0;
    var GlobalFilterValueDataType = '';
    var GlobalColumnNameToIncreaseWidth = '';
    var GlobalSelectAllItems = false;
    var GlobalFilterValue = '';
    var GlobalDataSetFilter = null;
    var DataSetFilter = null;
    var originalTable = [];
    var originalColumns = [];
    var Code = 0;
    var ShowObjList = false;
    var ColsForSum = '';
    var Ds = { tables: [{ rows: [], columns: [] }] };
    var IsSelectionProcessing = false;
    var UseForManualFilter = false;
    var FieldDataType = '';
    var escapePress = false;

var modalId = 'ObjectListControlModal';
var cmbFieldList, cmbOperatorListString, cmbOperatorsListNumeric, txtSearch, txtSearchTo;
var fraTotal, lvwResultHead, lvwResultBody, lovStatus, btnObjectListDone, hfCallBackFunctionName_btnDone;

function getEl(id) {
        return document.getElementById(id);
    }

    function showModal() {
        if (typeof $ !== 'undefined' && $.fn.modal) {
            $('#' + modalId).modal('show');
        }
    }

    function hideModal() {
        if (typeof $ !== 'undefined' && $.fn.modal) {
            $('#' + modalId).modal('hide');
        }
    }

    function escapeFilterValue(val) {
        if (typeof val !== 'string') return val;
        return val.replace(/\*/g, '[*]').replace(/'/g, "''").replace(/%/g, '[%]');
    }

    function getColumnIndexByName(columnName) {
        if (!lvwResultHead) return -1;
        var thead = lvwResultHead.querySelectorAll('th');
        for (var i = 0; i < thead.length; i++) {
            if (thead[i].textContent.trim().toUpperCase() === String(columnName).toUpperCase())
                return i;
        }
        return -1;
    }

    function getColumnSum(columnIndex) {
        var total = 0;
        if (!lvwResultBody) return total;
        var rows = lvwResultBody.querySelectorAll('tr.selected');
        for (var j = 0; j < rows.length; j++) {
            var cells = rows[j].querySelectorAll('td');
            if (cells[columnIndex]) {
                var text = cells[columnIndex].textContent.trim();
                var num = parseFloat(text);
                if (!isNaN(num)) total += num;
            }
        }
        return total;
    }

    function updateTotalLabel() {
        if (!fraTotal) return;
        if (!ColsForSum) {
            fraTotal.style.display = 'none';
            return;
        }
        fraTotal.style.display = '';
        var arr = ColsForSum.split(',');
        var parts = [];
        for (var i = 0; i < arr.length; i++) {
            var colName = arr[i].trim();
            var idx = getColumnIndexByName(colName);
            var total = idx >= 0 ? getColumnSum(idx) : 0;
            parts.push(colName + ' : ' + total);
        }
        fraTotal.textContent = parts.join(', ');
    }

    function getCodeValueFromlvw() {
        get_value = '';
        Values = '';
        if (!lvwResultBody) return Values;
        var rows = lvwResultBody.querySelectorAll('tr.selected');
        for (var j = 0; j < rows.length; j++) {
            var code = rows[j].getAttribute('data-code');
            var text = rows[j].querySelector('td');
            text = text ? text.textContent.trim() : '';
            get_value += "'" + text.replace(/'/g, "''") + "',";
            var codeNum = parseInt(code, 10);
            if (!isNaN(codeNum) && (codeNum > 0 || codeNum < 0)) {
                Values += "'" + code + "',";
            } else {
                Values += "'" + String(code || text).replace(/'/g, "''") + "',";
            }
        }
        get_value = get_value.replace(/,$/, '');
        Values = Values.replace(/,$/, '');
        return Values;
    }

    function getValueFromlvw() {
        getCodeValueFromlvw();
        return get_value;
    }

    function applyRowFilter(rows, filterCondition, filterValue, dataType, likeBothSides) {
        filterValue = escapeFilterValue(filterValue);
        if (String(filterValue).indexOf('[%]') === 0)
            filterValue = '%' + filterValue.substring(3);
        var result = [];
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var match = false;
            if (dataType === 'S') {
                var val = String(row[filterCondition] || '').toUpperCase();
                var search = String(filterValue || '').toUpperCase();
                if (likeBothSides === 'N')
                    match = val.indexOf(search) === 0;
                else
                    match = val.indexOf(search) !== -1;
            } else if (dataType === 'N') {
                var num = parseFloat(filterValue);
                if (!isNaN(num)) {
                    var rowVal = parseFloat(row[filterCondition]);
                    if (!isNaN(rowVal) && rowVal === num) match = true;
                    if (!match && GlobalFilterCondition1) {
                        var val1 = String(row[GlobalFilterCondition1] || '');
                        if (likeBothSides === 'N')
                            match = val1.toUpperCase().indexOf(String(filterValue).toUpperCase()) === 0;
                        else
                            match = val1.toUpperCase().indexOf(String(filterValue).toUpperCase()) !== -1;
                    }
                } else {
                    var val1 = String(row[GlobalFilterCondition1] || '');
                    if (likeBothSides === 'N')
                        match = val1.toUpperCase().indexOf(String(filterValue).toUpperCase()) === 0;
                    else
                        match = val1.toUpperCase().indexOf(String(filterValue).toUpperCase()) !== -1;
                }
            }
            if (match) result.push(row);
        }
        return result;
    }

    function buildManualFilterExpr(searchText, searchTextTo, field, opStr, opNum, isNumber) {
        searchText = escapeFilterValue(searchText).toUpperCase();
        searchTextTo = escapeFilterValue(searchTextTo).toUpperCase();
        if (field === '<All>') {
            var parts = [];
            for (var c = 0; c < originalColumns.length; c++) {
                if (c >= originalColumns.length - GlobalNoOfHideColumn) continue;
                var colName = originalColumns[c];
                if (opStr === 'Start With')
                    parts.push("(String(row['" + colName + "']||'').toUpperCase().indexOf('" + searchText + "')===0)");
                else if (opStr === 'End With')
                    parts.push("(String(row['" + colName + "']||'').toUpperCase().indexOf('" + searchText + "')!==-1 && String(row['" + colName + "']||'').toUpperCase().slice(-" + searchText.length + ")==='" + searchText + "')");
                else
                    parts.push("(String(row['" + colName + "']||'').toUpperCase().indexOf('" + searchText + "')!==-1)");
            }
            return parts.length ? 'return (' + parts.join(' || ') + ');' : 'return true;';
        }
        if (isNumber) {
            var s = parseFloat(searchText);
            var t = parseFloat(searchTextTo);
            if (opNum === 'In Between' && !isNaN(s) && !isNaN(t))
                return function (row) { var v = parseFloat(row[field]); return !isNaN(v) && v >= s && v <= t; };
            if (opNum === '=') return function (row) { return parseFloat(row[field]) === s; };
            if (opNum === '>') return function (row) { return parseFloat(row[field]) > s; };
            if (opNum === '>=') return function (row) { return parseFloat(row[field]) >= s; };
            if (opNum === '<') return function (row) { return parseFloat(row[field]) < s; };
            if (opNum === '<=') return function (row) { return parseFloat(row[field]) <= s; };
        } else {
            if (opStr === 'Start With')
                return function (row) { return String(row[field] || '').toUpperCase().indexOf(searchText) === 0; };
            if (opStr === 'End With')
                return function (row) { var v = String(row[field] || '').toUpperCase(); return v.indexOf(searchText) !== -1 && v.slice(-searchText.length) === searchText; };
            return function (row) { return String(row[field] || '').toUpperCase().indexOf(searchText) !== -1; };
        }
        return function () { return true; };
    }

    function fieldListType(fieldName) {
        if (fieldName === '<All>') {
            FieldDataType = 'String';
            return;
        }
        if (Ds.tables[0].columns.indexOf(fieldName) >= 0) {
            var sample = originalTable[0];
            if (sample && fieldName in sample) {
                var v = sample[fieldName];
                if (typeof v === 'number' || (typeof v === 'string' && /^-?\d*\.?\d+$/.test(v)))
                    FieldDataType = 'Number';
                else
                    FieldDataType = 'String';
            } else
                FieldDataType = 'String';
        }
    }

    function fillDataIntoList(rows, manualFilterFn) {
        var displayRows = rows;
        if (manualFilterFn && typeof manualFilterFn === 'function') {
            displayRows = rows.filter(manualFilterFn);
        } else if (GlobalFilterCondition && !UseForManualFilter) {
            displayRows = applyRowFilter(rows, GlobalFilterCondition, GlobalFilterValue, GlobalFilterValueDataType, GlobalUseLikeSearchInBothSide);
        }
        if (displayRows.length === 0 && !UseForManualFilter) {
            ShowObjList = true;
            displayRows = rows;
        }
        if (UseForManualFilter && !manualFilterFn) {
            ShowObjList = true;
            displayRows = rows;
        }

        DataSetFilter = displayRows;
        GlobalDataSetFilter = displayRows;
        var colCount = originalColumns.length - GlobalNoOfHideColumn;
        var columns = originalColumns.slice(0, colCount);

        if (!lvwResultHead || !lvwResultBody) return Promise.resolve(null);

        lvwResultHead.innerHTML = '';
        lvwResultBody.innerHTML = '';
        var trHead = document.createElement('tr');
        for (var i = 0; i < columns.length; i++) {
            var th = document.createElement('th');
            th.textContent = columns[i];
            trHead.appendChild(th);
        }
        lvwResultHead.appendChild(trHead);

        for (var r = 0; r < displayRows.length; r++) {
            var rowData = displayRows[r];
            var tr = document.createElement('tr');
            var codeVal = rowData.Code !== undefined ? rowData.Code : rowData[originalColumns[0]];
            tr.setAttribute('data-code', String(codeVal));
            if (LocalMultiSelect) tr.setAttribute('data-multi', '1');
            for (var c = 0; c < columns.length; c++) {
                var td = document.createElement('td');
                td.textContent = rowData[columns[c]] != null ? String(rowData[columns[c]]) : '';
                tr.appendChild(td);
            }
            tr.addEventListener('click', function (ev) {
                if (!LocalMultiSelect) {
                    if (lvwResultBody) lvwResultBody.querySelectorAll('tr').forEach(function (row) { row.classList.remove('selected'); });
                    this.classList.add('selected');
                } else {
                    this.classList.toggle('selected');
                }
                setTimeout(updateTotalLabel, 0);
            });
            tr.addEventListener('dblclick', function () {
                get_value = getValueFromlvw();
                Values = getCodeValueFromlvw();
                closeLOV(false);
            });
            if (GlobalSelectAllItems) tr.classList.add('selected');
            lvwResultBody.appendChild(tr);
        }

        if (displayRows.length > 0 && !lvwResultBody.querySelector('tr.selected'))
            lvwResultBody.querySelector('tr').classList.add('selected');
        updateTotalLabel();
        if (lovStatus) lovStatus.textContent = displayRows.length + ' row(s)';

        if (displayRows.length > 1 && !UseForManualFilter) {
            return new Promise(function (resolve) {
                window.__lovResolve = function (esc) {
                    escapePress = esc;
                    resolve({ escapePress: esc, code: Code, values: Values, get_value: get_value, dataView: DataSetFilter });
                };
            });
        }
        if (displayRows.length === 1 && ShowObjList) {
            return new Promise(function (resolve) {
                window.__lovResolve = function (esc) {
                    escapePress = esc;
                    resolve({ escapePress: esc, code: Code, values: Values, get_value: get_value, dataView: DataSetFilter });
                };
            });
        }
        if (displayRows.length === 0 || displayRows.length === 1) {
            var isNum = parseInt(Values, 10);
            Code = !isNaN(isNum) ? isNum : 0;
            return Promise.resolve({ escapePress: true, code: Code, values: Values, get_value: get_value, dataView: DataSetFilter });
        }
        return Promise.resolve(null);
    }

    function closeLOV(escapePressed) {
        hideModal();
        if (escapePressed) {
            Code = 0;
            DataSetFilter = null;
        } else {
            Values = getCodeValueFromlvw();
            get_value = getValueFromlvw();
            var v = Values.replace(/'/g, '');
            if (/^-?\d+$/.test(v)) Code = parseInt(v, 10);
            else Code = 0;
        }
        if (window.__lovResolve) {
            window.__lovResolve(escapePressed);
            window.__lovResolve = null;
        }
    }

    function filterData() {
        if (!originalTable.length) return;
        var field = cmbFieldList.value;
        var searchText = txtSearch.value.trim();
        var searchTextTo = txtSearchTo.value.trim();
        fieldListType(field);
        var isNumber = FieldDataType === 'Number';
        var opStr = cmbOperatorListString.value;
        var opNum = cmbOperatorsListNumeric.value;
        var manualFilterFn = buildManualFilterExpr(searchText, searchTextTo, field, opStr, opNum, isNumber);
        UseForManualFilter = true;
        fillDataIntoList(originalTable, manualFilterFn);
    }

    function initControls() {
        if (!cmbFieldList) return;
        cmbFieldList.innerHTML = '';
        for (var i = 0; i < originalColumns.length - GlobalNoOfHideColumn; i++) {
            var opt = document.createElement('option');
            opt.value = originalColumns[i];
            opt.textContent = originalColumns[i];
            cmbFieldList.appendChild(opt);
        }
        var optAll = document.createElement('option');
        optAll.value = '<All>';
        optAll.textContent = '<All>';
        cmbFieldList.appendChild(optAll);
        cmbFieldList.value = '<All>';
        if (cmbOperatorListString) cmbOperatorListString.style.display = '';
        if (cmbOperatorsListNumeric) cmbOperatorsListNumeric.style.display = 'none';
        if (txtSearchTo) txtSearchTo.style.display = 'none';
        if (txtSearch) txtSearch.value = '';
        if (txtSearchTo) txtSearchTo.value = '';
    }

    var FrmLOV = {
        escapePress: false,
        lstItem: { Tag: '' },
        initialize: function (data, hideFirstColumn) {
            escapePress = false;
            var columns = data.columns || (data[0] ? Object.keys(data[0]) : []);
            var rows = data.rows || data;
            originalColumns = columns;
            originalTable = rows.map(function (r) {
                var obj = {};
                for (var i = 0; i < columns.length; i++) obj[columns[i]] = r[i];
                return obj;
            });
            if (originalTable[0] && !originalTable[0].Code && columns[0])
                originalTable.forEach(function (r) { r.Code = r[columns[0]]; });
            GlobalNoOfHideColumn = hideFirstColumn ? 1 : 0;
            initControls();
            if (fraTotal) fraTotal.style.display = 'none';
            return fillDataIntoList(originalTable).then(function (result) {
                showModal();
                if (txtSearch) txtSearch.focus();
                return new Promise(function (res) {
                    window.__lovResolve = function (esc) {
                        closeLOV(esc);
                        res(result || { escapePress: esc, code: Code, values: Values, get_value: get_value, dataView: DataSetFilter });
                    };
                });
            });
        },
        initialize1: function (options) {
            var opts = options || {};
            escapePress = false;
            GlobalUseLikeSearchInBothSide = opts.useLikeSearchInBothSide || 'N';
            GlobalFilterValue = opts.filterValue || '';
            LocalMultiSelect = opts.multiSelect || false;
            GlobalSelectAllItems = opts.selectAllItems || false;
            GlobalFilterValueDataType = opts.filterValueDataType || 'S';
            ColsForSum = opts.showTotalColumnNameByCommaSeparated || '';
            GlobalFilterCondition1 = opts.filterCondition1 || '';
            GlobalQuery = opts.query || '';
            GlobalColumnNameToIncreaseWidth = opts.columnNameToIncreaseWidth || '';
            GlobalFilterCondition = opts.filterCondition || '';
            GlobalNoOfHideColumn = opts.noOfColumnToHide || 0;
            ShowObjList = false;
            UseForManualFilter = false;

            if (fraTotal) {
                if (ColsForSum) fraTotal.style.display = '';
                else fraTotal.style.display = 'none';
            }

            GlobalFilterValue = escapeFilterValue(GlobalFilterValue);
            if (String(GlobalFilterValue).indexOf('[%]') === 0)
                GlobalFilterValue = '%' + GlobalFilterValue.substring(3);

            return (typeof opts.data !== 'undefined'
                ? Promise.resolve(opts.data)
                : (typeof opts.loadData === 'function' ? opts.loadData(GlobalQuery) : Promise.resolve([]))
            ).then(function (data) {
                var columns = data.columns || (data[0] ? Object.keys(data[0]) : []);
                var rows = data.rows || data;
                originalColumns = columns;
                originalTable = Array.isArray(rows) ? rows : [];
                if (originalTable[0] && originalTable[0].Code === undefined && columns[0])
                    originalTable.forEach(function (r) { r.Code = r[columns[0]]; });
                Ds.tables[0].rows = originalTable;
                Ds.tables[0].columns = columns;
                initControls();
                var promise = fillDataIntoList(originalTable);
                showModal();
                if (txtSearch) {
                    txtSearch.value = GlobalFilterValue;
                    txtSearch.focus();
                }
                if (promise && promise.then) {
                    return promise.then(function (result) {
                        return new Promise(function (resolve) {
                            window.__lovResolve = function (esc) {
                                closeLOV(esc);
                                resolve(result || { escapePress: esc, code: Code, values: Values, get_value: get_value, dataView: DataSetFilter });
                            };
                        });
                    });
                }
                return new Promise(function (resolve) {
                    window.__lovResolve = function (esc) {
                        closeLOV(esc);
                        resolve({ escapePress: esc, code: Code, values: Values, get_value: get_value, dataView: DataSetFilter });
                    };
                });
            });
        }
    };

    function bindEvents() {
        if (cmbOperatorsListNumeric) {
            cmbOperatorsListNumeric.addEventListener('change', function () {
                if (this.value === 'In Between') {
                    if (txtSearchTo) txtSearchTo.style.display = '';
                    if (txtSearch) txtSearch.style.width = '50%';
                } else {
                    if (txtSearchTo) txtSearchTo.style.display = 'none';
                    if (txtSearch) txtSearch.style.width = '';
                }
            });
        }
        if (cmbFieldList) {
            cmbFieldList.addEventListener('change', function () {
                fieldListType(this.value);
                if (txtSearch) txtSearch.value = '';
                if (txtSearchTo) txtSearchTo.value = '';
                if (txtSearchTo) txtSearchTo.style.display = 'none';
                if (FieldDataType === 'Number') {
                    if (cmbOperatorListString) cmbOperatorListString.style.display = 'none';
                    if (cmbOperatorsListNumeric) {
                        cmbOperatorsListNumeric.style.display = '';
                        cmbOperatorsListNumeric.value = '=';
                    }
                } else {
                    if (cmbOperatorListString) {
                        cmbOperatorListString.style.display = '';
                        cmbOperatorListString.value = 'In Between';
                    }
                    if (cmbOperatorsListNumeric) cmbOperatorsListNumeric.style.display = 'none';
                }
            });
        }
        if (txtSearch) {
            txtSearch.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    if (cmbOperatorsListNumeric && cmbOperatorsListNumeric.style.display !== 'none' && cmbOperatorsListNumeric.value === 'In Between') return;
                    filterData();
                    if (lvwResultBody && lvwResultBody.querySelector('tr')) lvwResultBody.querySelector('tr').focus();
                }
            });
            txtSearch.addEventListener('keypress', function (e) {
                if (e.key === 'Escape') {
                    escapePress = true;
                    closeLOV(true);
                }
                if (cmbOperatorsListNumeric && cmbOperatorsListNumeric.style.display !== 'none') {
                    if (!/[\d.]/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey) e.preventDefault();
                }
            });
        }
        if (txtSearchTo) {
            txtSearchTo.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && cmbOperatorsListNumeric && cmbOperatorsListNumeric.value === 'In Between') {
                    filterData();
                    if (lvwResultBody && lvwResultBody.querySelector('tr')) lvwResultBody.querySelector('tr').focus();
                }
            });
        }
        document.addEventListener('keydown', function (e) {
            if (!getEl(modalId) || !getEl(modalId).classList.contains('show')) return;
            if (e.key === 'Escape') {
                escapePress = true;
                closeLOV(true);
            }
            if (e.key === 'Enter' && document.activeElement && lvwResultBody && lvwResultBody.contains(document.activeElement)) {
                var sel = lvwResultBody.querySelector('tr.selected');
                if (sel) {
                    get_value = getValueFromlvw();
                    Values = getCodeValueFromlvw();
                    closeLOV(false);
                }
            }
        });
        var modalEl = getEl(modalId);
        if (modalEl) {
            modalEl.addEventListener('click', function (e) {
                if (e.target === modalEl) { escapePress = true; closeLOV(true); }
            });
        }
        if (btnObjectListDone) {
            btnObjectListDone.addEventListener('click', function () {
                get_value = getValueFromlvw();
                Values = getCodeValueFromlvw();
                var callbackName = hfCallBackFunctionName_btnDone ? hfCallBackFunctionName_btnDone.value : '';
                if (callbackName && typeof window[callbackName] === 'function') {
                    window[callbackName]();
                }
                closeLOV(false);
            });
        }
}

export function initObjectListControl() {
    cmbFieldList = getEl('cmbFieldList');
    cmbOperatorListString = getEl('cmbOperatorListString');
    cmbOperatorsListNumeric = getEl('cmbOperatorsListNumeric');
    txtSearch = getEl('txtSearch');
    txtSearchTo = getEl('txtSearchTo');
    fraTotal = getEl('fraTotal');
    lvwResultHead = getEl('lvwResultHead');
    lvwResultBody = getEl('lvwResultBody');
    lovStatus = getEl('lovStatus');
    btnObjectListDone = getEl('btnObjectListDone');
    hfCallBackFunctionName_btnDone = getEl('hfCallBackFunctionName_btnDone');

    bindEvents();
    window.FrmLOV = FrmLOV;
}
