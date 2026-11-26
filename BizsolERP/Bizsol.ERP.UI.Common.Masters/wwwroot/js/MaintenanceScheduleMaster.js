import { MaintenanceScheduleMasterService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MaintenanceScheduleMasterService.js';
import { initializeObjectlistControl } from '../../Bizsol.WebERP.UI.Shared/js/Pages/CustomControl/_ObjectListControlPage.js';
import { MenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/MenuServices.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

let currentCode = 0;
let machineList = [];
let maintenanceTabNames = [];
let maintenanceChecklistOptions = [];
let occurrenceTabNames = [];
let suppressMaintenanceTypeChange = false;
let itemList = [];
let itemNameList = [];
let actionList = [];
let locatedTabs = null;
let locatedDetailCodes = [];
let periodicityOptions = [];
let monthOptions = [];
const MSM_MODULE_NAME = 'Maintenance Schedule Master';

function msmModuleName() {
    try {
        const fromUrl = new URLSearchParams(window.location.search).get('ModuleDesp');
        if (fromUrl && fromUrl.trim()) return decodeURIComponent(fromUrl.trim());
    } catch (e) { /* use the page name */ }
    return MSM_MODULE_NAME;
}

function checkMsmOptionRight(optionName) {
    return MenuService.CheckModuleOptionRight(msmModuleName(), optionName, 'Y', BizSolHelperFunction.getFinancialYear())
        .then(function (response) {
            if (response && (response.CheckModuleOptionRight === 'N' || response.checkModuleOptionRight === 'N')) {
                toastr.error((response.Msg || response.msg) || ('No rights for ' + optionName));
                return false;
            }
            return true;
        })
        .catch(function () {
            toastr.error('Unable to verify module rights.');
            return false;
        });
}

function msmSelect2DropdownParent() {
    return $(document.body);
}

function closeOpenSelect2Dropdowns() {
    $('.select2-hidden-accessible').each(function () {
        const $el = $(this);
        const instance = $el.data('select2');
        if (instance && instance.isOpen()) $el.select2('close');
    });
}

function scrollEventInsideSelect2(event) {
    const target = event && (event.target || event.srcElement);
    if (!target || !target.closest) return false;
    return !!target.closest('.select2-container--open, .select2-dropdown, .select2-results, .select2-results__options');
}

function initMsmSelect2ScrollFix() {
    if (window.__msmSelect2ScrollFix) return;
    window.__msmSelect2ScrollFix = true;
    const onScroll = function (event) {
        if (scrollEventInsideSelect2(event)) return;
        closeOpenSelect2Dropdowns();
    };
    window.addEventListener('scroll', onScroll, true);
    $(window).on('scroll.msmSelect2', onScroll);
}

$(document).ready(function () {
    initMsmSelect2ScrollFix();
    loadMaintenanceList();
    loadMachineList();
    loadPeriodicityList();
    loadMonthList();
    loadMaintenanceLookups();
    loadActionList();
    loadItemList();
    generateTabsFromOccurrence();

    $('#txtLocation').prop('readonly', true).prop('disabled', false).attr('autocomplete', 'off').val('')
        .on('focus.msmLocation click.msmLocation', function () {
            this.scrollLeft = 0;
            try { this.setSelectionRange(0, 0); } catch (e) { }
        });

    $('#deleteConfirmBackdrop').on('click', function (event) {
        if (event.target === this) CloseModalDelete();
    });

    $(document).on('keydown.msmDeleteModal', function (event) {
        if (event.key === 'Escape' && $('#deleteConfirmBackdrop').hasClass('show')) {
            CloseModalDelete();
        }
    });

    $('#txtEffectiveDate').on('change', function () {
        document.querySelectorAll('.occurrence-tab-pane').forEach(function (pane) {
            renderOccurrenceRows(pane);
            pane.querySelectorAll('.occurrence-day').forEach(function (dayInput) {
                applyDayLimit(dayInput, false);
            });
        });
    });

    $('#ddlMaintenanceType').on('change', function () {
        if (suppressMaintenanceTypeChange) return;
        generateTabsFromOccurrence();
    });

    document.querySelectorAll('.email-entry').forEach(function (input) {
        input.readOnly = false;
        input.removeAttribute('readonly');
        input.addEventListener('mousedown', function () {
            input.readOnly = false;
            input.removeAttribute('readonly');
        });
        input.addEventListener('focus', function () {
            input.readOnly = false;
            input.removeAttribute('readonly');
        });
    });
});

let numericWarningAt = 0;

document.addEventListener('keydown', function (event) {
    if (!event.target.classList || !event.target.classList.contains('numeric-only')) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const allowed = ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.indexOf(event.key) !== -1) return;
    if (/^[0-9]$/.test(event.key)) return;
    event.preventDefault();
    const now = Date.now();
    if (now - numericWarningAt > 1500) {
        numericWarningAt = now;
        toastr.warning('Please enter only number value.');
    }
});

document.addEventListener('input', function (event) {
    if (event.target.classList && event.target.classList.contains('tab-occurrence')) {
        const pane = event.target.closest('.occurrence-tab-pane');
        if (pane && event.isTrusted) pane._msmChecklistLocked = false;
        if (pane) renderOccurrenceRows(pane);
    }
    if (event.target.classList && event.target.classList.contains('occurrence-day')) {
        const digits = String(event.target.value || '').replace(/\D/g, '');
        if (event.target.value !== digits) event.target.value = digits;
        if (digits.length >= 2 || Number(digits) > Number(event.target.dataset.maxDay || 31)) applyDayLimit(event.target, true);
        return;
    }
    if (!event.target.classList || !event.target.classList.contains('numeric-only')) return;
    const digits = String(event.target.value || '').replace(/\D/g, '');
    if (event.target.value !== digits) event.target.value = digits;
});

function loadMachineList() {
    MaintenanceScheduleMasterService.GetMachineMasterList().then(function (response) {
        const list = Array.isArray(response) ? response : ((response && response.$values) || []);
        if (list.length > 0) {
            machineList = list;
            const machineSelect = $('#ddlMachineNo')[0];
            machineSelect.innerHTML = '<option value=""></option>' + list.map(function (item) {
                return '<option value="' + escapeHtml(item.Code) + '">' + escapeHtml(item.Desp || item.MachineNo || '') + '</option>';
            }).join('');

            $('#ddlMachineNo').select2({
                width: '100%',
                minimumResultsForSearch: Infinity,
                placeholder: '',
                dropdownParent: msmSelect2DropdownParent()
            });

            $('#ddlMachineNo').off('change.machineLocation').on('change.machineLocation', function () {
                bindMachineLocation($(this).val());
            });
            if ($('#dvGrid').is(':visible')) loadMaintenanceList();
        } else {
            toastr.error('No data received or empty response');
        }
    }).catch(function (error) {
        console.log('Error fetching Machine Name data:', error);
    });
}

function machineLocationText(item) {
    if (!item) return '';
    const names = ['Location', 'location', 'Loc', 'LocationName', 'MachineLocation', 'GodownName', 'Address'];
    for (let index = 0; index < names.length; index++) {
        const value = item[names[index]];
        if (value != null && String(value).trim() !== '') return String(value).trim();
    }
    const key = Object.keys(item).find(function (name) {
        return name.replace(/[\s_]/g, '').toLowerCase() === 'location';
    });
    return key && item[key] != null ? String(item[key]).trim() : '';
}

function showLocationValue(location) {
    const input = document.getElementById('txtLocation');
    if (!input) return;
    const text = String(location || '').trim();
    input.readOnly = true;
    input.disabled = false;
    input.value = text;
    input.title = text;
    input.scrollLeft = 0;
    try { input.setSelectionRange(0, 0); } catch (e) { }
}

function bindMachineLocation(code) {
    const selected = machineList.find(function (item) {
        return String(item.Code) === String(code);
    });
    showLocationValue(machineLocationText(selected));
}

function locationForMachineNo(machineNo) {
    const key = String(machineNo || '').trim().toLowerCase();
    if (!key || !machineList.length) return '';
    const found = machineList.find(function (item) {
        const number = String(item.MachineNo || item.machineNo || item.Desp || item.desp || '').trim().toLowerCase();
        return number === key;
    });
    return machineLocationText(found);
}

function normalizeLookupList(response) {
    if (Array.isArray(response)) return response;
    if (!response || typeof response !== 'object') return [];
    if (Array.isArray(response.$values)) return response.$values;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.Table)) return response.Table;
    if (Array.isArray(response.table)) return response.table;
    const lists = Object.keys(response).map(function (key) { return response[key]; }).filter(Array.isArray);
    return lists.length ? lists[0] : [];
}

function lookupField(item, names) {
    if (!item || typeof item !== 'object') return '';
    const keys = Object.keys(item);
    for (let i = 0; i < names.length; i++) {
        const found = keys.find(function (key) { return key.toLowerCase() === names[i].toLowerCase(); });
        if (found != null && item[found] != null && String(item[found]).trim() !== '') return item[found];
    }
    return '';
}

function toLookupOption(item) {
    if (item == null) return null;
    if (typeof item === 'string' || typeof item === 'number') {
        const text = String(item);
        return text ? { value: text, text: text } : null;
    }

    const text = lookupField(item, [
        'MaintenanceCheckListName', 'MaintenanceChecklistName', 'ChecklistName', 'CheckListName',
        'MaintenanceTypeName', 'Desp', 'Description', 'ActionName', 'Checklist', 'CheckList', 'Name', 'Type', 'Value'
    ]);
    const rawValue = lookupField(item, ['Code', 'Value']) || text;
    if (rawValue == null || rawValue === '') return null;

    return { value: String(rawValue), text: String(text || rawValue) };
}

function loadMaintenanceLookups() {
    function loadLookup(request, emptyMessage) {
        return request.then(function (response) {
            const list = normalizeLookupList(response).map(toLookupOption).filter(Boolean);
            if (!list.length) toastr.error(emptyMessage);
            return list;
        }).catch(function (error) {
            console.log(emptyMessage, error);
            return [];
        });
    }

    Promise.all([
        loadLookup(MaintenanceScheduleMasterService.GetMaintenanceTypeList(), 'No maintenance type data received'),
        loadLookup(MaintenanceScheduleMasterService.GetMaintenanceChecklist(), 'No maintenance checklist data received')
    ]).then(function (results) {
        maintenanceTabNames = results[0];
        maintenanceChecklistOptions = results[1];
        applyMaintenanceLookups();
    });
}

function monthField(item, names) {
    if (!item || typeof item !== 'object') return '';
    const keys = Object.keys(item);
    for (let i = 0; i < names.length; i++) {
        const found = keys.find(function (key) { return key.toLowerCase() === names[i].toLowerCase(); });
        if (found != null && item[found] != null && String(item[found]).trim() !== '') return item[found];
    }
    return '';
}

function unwrapMonthPayload(value, depth) {
    if (value == null || depth > 5) return [];
    if (typeof value === 'string') {
        const text = value.trim();
        if (!text || text === 'Error To Fetch Connection String') return [];
        if (text.charAt(0) === '{' || text.charAt(0) === '[') {
            try { return unwrapMonthPayload(JSON.parse(text), depth + 1); } catch (e) { /* use the text below */ }
        }
        if (/[,~|]/.test(text)) {
            return text.split(/[,~|]/).map(function (part) { return part.trim(); }).filter(Boolean);
        }
        return [text];
    }
    if (Array.isArray(value)) return value;
    if (typeof value !== 'object') return [];

    const preferred = ['$values', 'data', 'result', 'table', 'table1', 'value', 'months', 'monthlist', 'monthslist', 'list'];
    const keys = Object.keys(value);
    for (let i = 0; i < preferred.length; i++) {
        const found = keys.find(function (key) { return key.toLowerCase() === preferred[i]; });
        if (!found || value[found] == null) continue;
        const nested = unwrapMonthPayload(value[found], depth + 1);
        if (nested.length) return nested;
    }
    for (let i = 0; i < keys.length; i++) {
        if (Array.isArray(value[keys[i]]) && value[keys[i]].length) return value[keys[i]];
    }
    return [value];
}

function monthRecord(item) {
    if (item == null) return null;
    if (typeof item === 'string' || typeof item === 'number') {
        const text = String(item).trim();
        return text ? Object.assign({ value: text, text: text }, monthPartsFromText(text)) : null;
    }
    if (Array.isArray(item)) {
        const text = item.map(function (cell) { return cell == null ? '' : String(cell).trim(); }).filter(Boolean).join(' ');
        return text ? Object.assign({ value: text, text: text }, monthPartsFromText(text)) : null;
    }

    const cells = monthField(item, ['ItemArray', 'itemArray']);
    if (Array.isArray(cells) && cells.length) return monthRecord(cells);

    let text = String(monthField(item, [
        'MonthNameWithYear', 'MonthWithYear', 'MonthYearName', 'Month_Name', 'MonthName',
        'MonthsName', 'Months', 'Monthslist', 'MonthList', 'Desp', 'Description', 'Name', 'Value', 'Text'
    ]) || '').trim();
    const monthName = String(monthField(item, ['MonthName', 'Month_Name', 'Months', 'Month']) || '').trim();
    const yearText = String(monthField(item, ['MonthYear', 'Year', 'YearName', 'FinYear']) || '').trim();
    if (monthName && yearText && text.indexOf(yearText) === -1 && !/^\d+$/.test(monthName)) {
        text = monthName + ' ' + yearText;
    }
    if (!text) {
        const ignored = { code: 1, id: 1, status: 1, msg: 1, message: 1, monthnumber: 1, monthno: 1, year: 1, monthyear: 1 };
        const extra = Object.keys(item).find(function (key) {
            return !ignored[key.toLowerCase()] && item[key] != null && String(item[key]).trim() !== '' && typeof item[key] !== 'object';
        });
        if (extra) text = String(item[extra]).trim();
    }
    if (!text) return null;

    const parsed = monthPartsFromText(text);
    const monthNumber = Number(monthField(item, ['MonthNumber', 'MonthNo', 'Month_No']) || parsed.monthNumber || 0);
    const monthYear = Number(monthField(item, ['MonthYear', 'Year']) || parsed.monthYear || 0);
    const rawValue = monthField(item, ['Code', 'Value', 'Id']);
    return {
        value: rawValue !== '' ? String(rawValue) : text,
        text: text,
        monthNumber: monthNumber,
        monthYear: monthYear
    };
}

function daysInMonthName(monthName) {
    const monthNumber = monthPartsFromText(monthName).monthNumber;
    if (!monthNumber) return 31;
    const effective = document.getElementById('txtEffectiveDate');
    let year = new Date().getFullYear();
    if (effective && effective.value) {
        const parsed = new Date(effective.value + 'T00:00:00');
        if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
    }
    return new Date(year, monthNumber, 0).getDate();
}

function dayLimitForRow(row) {
    const monthSelect = row && row.querySelector('.occurrence-month');
    if (monthSelect) {
        const monthName = String((monthSelect.options[monthSelect.selectedIndex] && monthSelect.options[monthSelect.selectedIndex].text) || monthSelect.value || '').trim();
        return { monthName: monthName, maxDay: daysInMonthName(monthName) };
    }
    const pane = row && row.closest('.occurrence-tab-pane');
    if (pane && occurrenceScheduleMode(pane) === 'monthly') {
        const monthName = effectiveDateMonthName();
        return { monthName: monthName, maxDay: daysInMonthName(monthName) };
    }
    return { monthName: '', maxDay: 31 };
}

function applyDayLimit(dayInput, notify) {
    if (!dayInput) return;
    const limit = dayLimitForRow(dayInput.closest('.occurrence-generated-row'));
    dayInput.maxLength = 2;
    dayInput.dataset.maxDay = String(limit.maxDay);
    dayInput.placeholder = '1-' + limit.maxDay;
    const day = Number(dayInput.value || 0);
    if (dayInput.value && (day < 1 || day > limit.maxDay)) {
        dayInput.value = '';
        if (notify) toastr.warning((limit.monthName || 'The selected month') + ' allows days 1 to ' + limit.maxDay + '.');
    }
}

function monthPartsFromText(text) {
    const names = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const lower = String(text || '').toLowerCase();
    const monthNumber = names.findIndex(function (name) { return lower.indexOf(name) !== -1; }) + 1;
    const yearMatch = String(text || '').match(/(19|20)\d{2}/);
    return {
        monthNumber: monthNumber > 0 ? monthNumber : 0,
        monthYear: yearMatch ? Number(yearMatch[0]) : 0
    };
}

function monthNameOnly(item) {
    if (item == null) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
    const key = Object.keys(item).find(function (name) {
        return name.replace(/[\s_]/g, '').toLowerCase() === 'monthname';
    });
    return key && item[key] != null ? String(item[key]).trim() : '';
}

function loadMonthList() {
    MaintenanceScheduleMasterService.GetMonthslist().then(function (response) {
        const seen = {};
        monthOptions = unwrapMonthPayload(response, 0).map(function (item) {
            const text = monthNameOnly(item);
            if (!text || seen[text.toLowerCase()]) return null;
            seen[text.toLowerCase()] = true;
            return {
                value: text,
                text: text,
                monthNumber: monthPartsFromText(text).monthNumber,
                monthYear: 0
            };
        }).filter(Boolean);
        if (!monthOptions.length) {
            toastr.error('No month data received');
            return;
        }
        document.querySelectorAll('.occurrence-tab-pane').forEach(renderOccurrenceRows);
    }).catch(function (error) {
        console.log('Error fetching month data:', error);
    });
}

function monthOptionMarkup(selected) {
    const current = String(selected || '').toLowerCase();
    return monthOptions.map(function (item) {
        const isSelected = current === String(item.text).toLowerCase();
        return '<option value="' + escapeHtml(item.text) + '" data-month="' + escapeHtml(item.monthNumber || '') + '"' + (isSelected ? ' selected' : '') + '>' + escapeHtml(item.text) + '</option>';
    }).join('');
}

function startMonthIndex() {
    const effective = document.getElementById('txtEffectiveDate');
    let date = effective && effective.value ? new Date(effective.value + 'T00:00:00') : new Date();
    if (isNaN(date.getTime())) date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const byNumber = monthOptions.findIndex(function (item) {
        return item.monthNumber === month && (!item.monthYear || item.monthYear === year);
    });
    if (byNumber >= 0) return byNumber;
    const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toLowerCase();
    const byName = monthOptions.findIndex(function (item) { return String(item.text).toLowerCase() === label; });
    return byName >= 0 ? byName : 0;
}

function monthAt(index, periodicityText) {
    if (!monthOptions.length) return null;
    const step = Math.max(1, monthStepFromLabel(periodicityText));
    const at = startMonthIndex() + (index * step);
    return monthOptions[Math.min(monthOptions.length - 1, at)] || null;
}

function loadPeriodicityList() {    
    MaintenanceScheduleMasterService.GetPeriodicityMasterList().then(function (response) {
        const list = normalizeLookupList(response).map(function (item) {
            const option = toLookupOption(item);
            return option ? { Code: option.value, Desp: option.text } : null;
        }).filter(Boolean);

        if (!list.length) {
            toastr.error('No periodicity data received');
            return;
        }

        periodicityOptions = sortPeriodicityOptions(list);
        applyTabPeriodicityLookups();
    }).catch(function (error) {
        console.log('Error fetching periodicity data:', error);
    });
}

function loadActionList() {
    MaintenanceScheduleMasterService.GetActionMasterList().then(function (response) {
        actionList = normalizeLookupList(response).map(toLookupOption).filter(Boolean);
        if (!actionList.length) {
            toastr.error('No action data received');
            return;
        }
        applyActionLookups();
    }).catch(function (error) {
        console.log('Error fetching action data:', error);
    });
}

function actionOptionMarkup(selected) {
    const current = String(selected || '');
    const options = actionList.map(function (action) {
        const isSelected = current === String(action.value) || current === String(action.text);
        return `<option value="${escapeHtml(action.value)}" ${isSelected ? 'selected' : ''}>${escapeHtml(action.text)}</option>`;
    }).join('');
    return `<option value="" ${current ? '' : 'selected'}>Select Action</option>${options}`;
}

function applyActionLookups() {
    document.querySelectorAll('.item-action-select').forEach(function (select) {
        const row = select.closest('tr');
        const current = select.value || (row && row.dataset.action) || '';
        select.innerHTML = actionOptionMarkup(current);
        if (row && select.value) row.dataset.action = select.value;
    });
}
function loadItemList() {
    MaintenanceScheduleMasterService.GetItemMasterList().then(function (response) {
        itemList = normalizeLookupList(response);
        itemNameList = itemList.slice();
        applyItemLookups();
    }).catch(function (error) {
        console.log('Error fetching item data:', error);
    });
}

function itemKeyOf(item) {
    if (!item) return '';
    return item.Code ?? item.code ?? item.ItemMaster_Code ?? item['Item Master Code'] ?? '';
}

function itemCodeOf(item) {
    if (!item) return '';
    return item.ItemCode || item.itemCode || item['Item Code'] || '';
}

function itemNameOf(item) {
    if (!item) return '';
    return item.ItemName || item.itemName || item['Item Name'] || item.Desp || item.Description || '';
}

function itemLabel(item, preferName) {
    const known = preferName ? (itemNameOf(item) || itemCodeOf(item)) : (itemCodeOf(item) || itemNameOf(item));
    if (known) return known;
    if (!item || typeof item !== 'object') return '';
    const key = Object.keys(item).find(function (name) {
        const value = item[name];
        return typeof value === 'string' && value.trim() && name.toLowerCase() !== 'code';
    });
    return key ? String(item[key]) : '';
}

function optionValue(item) {
    const key = itemKeyOf(item);
    if (key !== '' && key != null) return String(key);
    return String(itemCodeOf(item) || itemNameOf(item));
}

function findIn(list, code, text) {
    return (list || []).find(function (item) {
        return code && (String(itemKeyOf(item)) === String(code) || String(optionValue(item)) === String(code));
    }) || (list || []).find(function (item) {
        return text && (String(itemCodeOf(item)) === String(text) || String(itemNameOf(item)) === String(text));
    }) || null;
}

function findItem(code, itemCode) {
    return findIn(itemList, code, itemCode);
}

function itemOptionMarkup(selectedCode, selectedItemCode) {
    const matched = findItem(selectedCode, selectedItemCode);
    const selected = matched ? optionValue(matched) : '';
    return '<option value="">Select Item</option>' + itemList.map(function (item) {
        const value = optionValue(item);
        const label = itemLabel(item, false);
        if (!label) return '';
        return `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('');
}

function itemNameOptionMarkup(selectedCode, selectedName) {
    const matched = findIn(itemNameList, selectedCode, selectedName);
    const selected = matched ? optionValue(matched) : '';
    return '<option value="">Select Name</option>' + itemNameList.map(function (item) {
        const value = optionValue(item);
        const label = itemLabel(item, true);
        if (!label) return '';
        return `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('');
}

function bindItemRow(row, source) {
    if (!row) return;
    const codeSelect = row.querySelector('.item-code');
    const nameSelect = row.querySelector('.item-name');

    if (source === 'name' && nameSelect && nameSelect.tagName !== 'SELECT') {
        const typed = String(nameSelect.value || '').trim();
        const named = findIn(itemNameList, '', typed) || findItem('', typed);
        if (!named) return;
        applyScheduleItemFromObj(row, {
            Code: itemKeyOf(named),
            'Item Name': itemNameOf(named),
            'Item Code': itemCodeOf(named)
        });
        return;
    }

    if (source === 'name' && nameSelect) {
        const named = findIn(itemNameList, nameSelect.value, nameSelect.value);
        row.dataset.itemName = named ? itemNameOf(named) : '';
        if (named && itemKeyOf(named) !== '') row.dataset.itemMasterCode = itemKeyOf(named);
        const codeMatch = named ? findItem(itemKeyOf(named), itemCodeOf(named)) : null;
        if (codeSelect && codeMatch) codeSelect.value = optionValue(codeMatch);
        if (codeMatch) row.dataset.itemCode = itemCodeOf(codeMatch);
        return;
    }

    const item = codeSelect ? findItem(codeSelect.value, '') : null;
    if (!item) {
        row.dataset.itemMasterCode = '';
        row.dataset.itemCode = '';
        row.dataset.itemName = '';
        if (nameSelect) nameSelect.value = '';
        return;
    }

    row.dataset.itemMasterCode = itemKeyOf(item);
    row.dataset.itemCode = itemCodeOf(item);
    row.dataset.itemName = itemNameOf(item);
    if (nameSelect && nameSelect.tagName === 'SELECT') {
        const named = findIn(itemNameList, itemKeyOf(item), itemNameOf(item));
        nameSelect.value = named ? optionValue(named) : '';
    } else if (nameSelect) {
        nameSelect.value = itemNameOf(item);
    }
}

const scheduleItemModalId = 'MaintenanceScheduleItemObjectListModal';
let scheduleItemRow = null;
let scheduleItemInput = null;

function scheduleItemObjectRows() {
    const merged = new Map();
    function addItem(item) {
        if (!item) return;
        const linked = findItem(itemKeyOf(item), itemCodeOf(item)) || findIn(itemNameList, itemKeyOf(item), itemNameOf(item)) || item;
        const key = String(itemKeyOf(item) || itemKeyOf(linked) || itemCodeOf(item) || itemCodeOf(linked) || itemNameOf(item) || '');
        if (!key) return;
        const current = merged.get(key) || {};
        merged.set(key, {
            'Item Code': itemCodeOf(item) || itemCodeOf(linked) || current['Item Code'] || '',
            'Item Name': itemNameOf(item) || itemNameOf(linked) || current['Item Name'] || '',
            Code: itemKeyOf(item) || itemKeyOf(linked) || current.Code || ''
        });
    }
    itemList.forEach(addItem);
    itemNameList.forEach(addItem);
    return Array.from(merged.values()).filter(function (row) {
        return String(row['Item Name'] || '').trim() || String(row['Item Code'] || '').trim() || row.Code;
    });
}

function parseScheduleItemOpen(value) {
    const typed = String(value == null ? '' : value);
    const raw = typed.trim();
    const useContains = raw.indexOf('*') >= 0;
    const cleaned = raw.replace(/\*/g, '').trim();
    const isBrowse = cleaned === '' || cleaned === '.' || cleaned === '..';
        return {
        typed: typed,
        matchType: useContains ? 'contains' : 'startswith',
        searchValue: isBrowse ? '.' : cleaned
    };
}

function shouldOpenScheduleItemList(typedValue, selectedCode, selectedName) {
    const raw = String(typedValue || '').trim();
    if (!raw) return false;
    if (raw === '.' || raw === '..' || raw.indexOf('*') === 0) return true;
    if (!String(selectedCode || '').trim()) return true;
    return raw !== String(selectedName || '').trim();
}

function clearScheduleItemLookup(row) {
    if (!row) return;
    row.dataset.itemMasterCode = '';
    row.dataset.itemCode = '';
    row.dataset.itemName = '';
    const nameInput = row.querySelector('.item-name');
    if (nameInput) nameInput.value = '';
    const codeSelect = row.querySelector('.item-code');
    if (codeSelect) codeSelect.value = '';
}

function applyScheduleItemFromObj(row, picked) {
    if (!row || !picked) return;
    const code = picked.Code ?? picked.code ?? '';
    const master = findItem(code, picked['Item Code']) || findIn(itemNameList, code, picked['Item Name']) || picked;
    const name = picked['Item Name'] || itemNameOf(master);
    const itemCode = picked['Item Code'] || itemCodeOf(master);
    row.dataset.itemMasterCode = String(code || itemKeyOf(master) || '');
    row.dataset.itemCode = itemCode || '';
    row.dataset.itemName = name || '';
    const nameInput = row.querySelector('.item-name');
    if (nameInput && nameInput.tagName === 'INPUT') nameInput.value = name || '';
    const codeInput = row.querySelector('.item-code');
    if (codeInput && codeInput.tagName === 'INPUT') {
        codeInput.value = itemCode || '';
    } else if (codeInput) {
        const match = findItem(row.dataset.itemMasterCode, itemCode);
        if (match) codeInput.value = optionValue(match);
    }
}

let suppressScheduleItemFocus = false;

function renumberItemRows(tbody) {
    if (!tbody) return;
    Array.from(tbody.rows).forEach(function (itemRow, index) {
        if (itemRow.cells[0]) itemRow.cells[0].textContent = index + 1;
    });
    updateDeleteButtons(tbody);
}

function showScheduleItemObjectList(row, value, filterColumn) {
    const list = scheduleItemObjectRows();
    if (!list.length) {
        toastr.warning('No item data available.');
        return;
    }
    const typed = String(value || '').trim();
    const open = parseScheduleItemOpen(typed || '..');
    scheduleItemRow = row;
    scheduleItemInput = row.querySelector(filterColumn === 'Item Code' ? '.item-code' : '.item-name');
    initializeObjectlistControl({
        ModalId: scheduleItemModalId,
        searchvalue: open.searchValue,
        MatchType: open.matchType,
        MultiSelect: true,
        ClientOrderProjectData: list,
        CallBackFunctionName_btnDone: 'onMaintenanceScheduleItemSelected',
        DefaultColumnfilter: filterColumn || 'Item Name',
        ModalTitle: 'Select Item',
        NumericColumns: [],
        Columns: [
            { field: 'Item Code', header: 'Item Code', visible: true },
            { field: 'Item Name', header: 'Item Name', visible: true },
            { field: 'Code', visible: false }
        ]
    });
    if (!scheduleItemRow) return;
    const $modal = $('#' + scheduleItemModalId);
    $modal.off('hidden.bs.modal.msItem').on('hidden.bs.modal.msItem', function () {
        if (scheduleItemRow && scheduleItemInput) {
            scheduleItemInput.value = scheduleItemSelectedText(scheduleItemInput, scheduleItemRow);
        }
        scheduleItemRow = null;
        scheduleItemInput = null;
        suppressScheduleItemFocus = true;
        setTimeout(function () { suppressScheduleItemFocus = false; }, 400);
    });
}

window.onMaintenanceScheduleItemSelected = function (response) {
    if (!response || !response.length || !scheduleItemRow) return;
    const startRow = scheduleItemRow;
    scheduleItemRow = null;
    scheduleItemInput = null;
    const tbody = startRow.closest('tbody');
    const tabName = tbody && tbody.id.indexOf('items-') === 0 ? tbody.id.substring('items-'.length) : '';
    let anchor = startRow;
    response.forEach(function (item, index) {
        let row = anchor;
        if (index > 0 && anchor && anchor.parentNode) {
            anchor.insertAdjacentHTML('afterend', createItemRowMarkup(tabName, 0));
            row = anchor.nextElementSibling;
            anchor = row;
        }
        applyScheduleItemFromObj(row, item);
    });
    renumberItemRows(tbody);
    suppressScheduleItemFocus = true;
    const qty = startRow.querySelector('.item-quantity');
    if (qty) qty.focus();
    setTimeout(function () { suppressScheduleItemFocus = false; }, 400);
};

function scheduleItemFilterColumn(input) {
    return input && input.classList.contains('item-code') ? 'Item Code' : 'Item Name';
}

function scheduleItemSelectedText(input, row) {
    if (!input || !row) return '';
    if (input.classList.contains('item-code')) return row.dataset.itemCode || '';
    return row.dataset.itemName || '';
}

function focusNextScheduleItemField(input) {
    const row = input && input.closest('tr');
    if (!row) return;
    const fields = Array.from(row.querySelectorAll('input, select')).filter(function (el) {
        return !el.disabled && el.type !== 'hidden';
    });
    const index = fields.indexOf(input);
    if (index >= 0 && index < fields.length - 1) {
        fields[index + 1].focus();
        return;
    }
    const tbody = row.closest('tbody');
    if (!tbody) return;
    const rows = Array.from(tbody.rows);
    const rowIndex = rows.indexOf(row);
    if (rowIndex === rows.length - 1) {
        const tabName = tbody.id.indexOf('items-') === 0 ? tbody.id.substring('items-'.length) : '';
        addItemRow(tabName);
        const next = tbody.rows[tbody.rows.length - 1];
        const first = next && next.querySelector('.item-code');
        if (first) first.focus();
        return;
    }
    const first = rows[rowIndex + 1] && rows[rowIndex + 1].querySelector('.item-code');
    if (first) first.focus();
}

document.addEventListener('keydown', function (event) {
    const input = event.target;
    if (!input.classList || !input.classList.contains('item-lookup') || input.tagName !== 'INPUT') return;
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const row = input.closest('tr');
    if (!row) return;
    if ($('#' + scheduleItemModalId).hasClass('show')) return;
    const typed = String(input.value || '');
    if (!typed.trim()) {
        toastr.warning('Type .. and press Enter to open the item list.');
        return;
    }
    const selectedCode = row.dataset.itemMasterCode || '';
    const selectedText = scheduleItemSelectedText(input, row);
    if (shouldOpenScheduleItemList(typed, selectedCode, selectedText)) {
        showScheduleItemObjectList(row, typed, scheduleItemFilterColumn(input));
        return;
    }
    focusNextScheduleItemField(input);
});

function applyItemLookups() {
    document.querySelectorAll('#maintenanceTabContent tbody tr').forEach(function (row) {
        const codeInput = row.querySelector('.item-code');
        const nameInput = row.querySelector('.item-name');
        if (codeInput && codeInput.tagName === 'INPUT' && !codeInput.value && row.dataset.itemCode) {
            codeInput.value = row.dataset.itemCode;
        }
        if (nameInput && nameInput.tagName === 'INPUT' && !nameInput.value && row.dataset.itemName) {
            nameInput.value = row.dataset.itemName;
        }
    });
}

function readItemRow(row) {
    const codeInput = row.querySelector('.item-code');
    const nameInput = row.querySelector('.item-name');
    const typedCode = codeInput && codeInput.tagName !== 'SELECT' ? String(codeInput.value || '').trim() : '';
    const typedName = nameInput && nameInput.tagName !== 'SELECT' ? String(nameInput.value || '').trim() : '';
    const item = findItem(row.dataset.itemMasterCode, typedCode || row.dataset.itemCode || '');
                return {
        Code: Number(row.dataset.code || 0),
        ItemMaster_Code: Number(itemKeyOf(item) || row.dataset.itemMasterCode || 0),
        ItemCode: typedCode || itemCodeOf(item) || row.dataset.itemCode || '',
        ItemName: typedName || itemNameOf(item) || row.dataset.itemName || '',
        Quantity: Number((row.querySelector('.item-quantity') || {}).value || 0),
        Action: row.dataset.action || (row.querySelector('.item-action-select') || {}).value || ''
    };
}

function getSessionAuth() {
    try {
        return JSON.parse(sessionStorage.getItem('authKey') || '{}') || {};
    } catch (e) {
        return {};
    }
}

function getScheduleRows() {
    return Array.from(document.querySelectorAll('.occurrence-tab-pane')).map(function (pane, index) {
        const dayInput = pane.querySelector('.occurrence-day');
        return {
            Sno: index + 1,
            Tab: pane.getAttribute('data-occurrence-tab'),
            Type: (pane.querySelector('.occurrence-type') && pane.querySelector('.occurrence-type').value) || '',
            Day: dayInput ? String(dayInput.value || '').trim() : '',
            Periodicity: panePeriodicity(pane),
            Occurrence: paneOccurrence(pane),
            ChecklistItems: Array.from(pane.querySelectorAll('.maintenance-checkbox:checked')).map(item => item.value)
        };
    });
}

function tabEmailValues(pane) {
    if (!pane) {
        return { Recipients: '', EstimatedStartDate: '', EscalationMail: '', EscalationGap: '' };
    }
    return {
        Recipients: String((pane.querySelector('.tab-recipients') || {}).value || '').trim(),
        EstimatedStartDate: String((pane.querySelector('.tab-estimated-days') || {}).value || '').trim(),
        EscalationMail: String((pane.querySelector('.tab-escalation-mail') || {}).value || '').trim(),
        EscalationGap: String((pane.querySelector('.tab-escalation-gap') || {}).value || '').trim()
    };
}

function getMaintenanceTypes() {
    const rows = [];
    document.querySelectorAll('.occurrence-tab-pane').forEach(function (pane) {
        const items = Array.from(pane.querySelectorAll('tbody tr')).map(readItemRow)
            .filter(function (item) {
                return item.ItemMaster_Code || item.ItemCode || item.ItemName || item.Quantity > 0 || item.Action;
            });
        const generated = pane.querySelectorAll('.occurrence-generated-row');
        const base = Object.assign({
            Type: pane.getAttribute('data-occurrence-tab'),
            MaintenanceType: (pane.querySelector('.occurrence-type') && pane.querySelector('.occurrence-type').value) || '',
            Periodicity: panePeriodicity(pane),
            Occurrence: paneOccurrence(pane),
            Items: items
        }, tabEmailValues(pane));
        if (!generated.length) {
            rows.push(Object.assign({ Sno: rows.length + 1, Day: '', Month: '', ChecklistItems: [] }, base));
            return;
        }
        generated.forEach(function (row, index) {
            const dayInput = row.querySelector('.occurrence-day');
            const monthInput = row.querySelector('.occurrence-month');
            const monthOption = monthInput && monthInput.options ? monthInput.options[monthInput.selectedIndex] : null;
            const rowKeyed = !monthInput;
            rows.push(Object.assign({
                Sno: rows.length + 1,
                Day: dayInput ? String(dayInput.value || '').trim() : '',
                Month: rowKeyed
                    ? String(index + 1)
                    : (monthOption ? String(monthOption.text || '').trim() : (monthInput ? String(monthInput.value || '').trim() : '')),
                MonthNumber: monthOption ? Number(monthOption.getAttribute('data-month') || 0) : 0,
                MonthYear: monthOption ? Number(monthOption.getAttribute('data-year') || 0) : 0,
                ChecklistItems: Array.from(row.querySelectorAll('.maintenance-checkbox:checked')).map(function (item) { return item.value; })
            }, base));
        });
    });
    return rows;
}

function activeSchedulePane() {
    return document.querySelector('.occurrence-tab-pane.active') || document.querySelector('.occurrence-tab-pane');
}

function panePeriodicity(pane) {
    const select = pane && pane.querySelector('.tab-periodicity');
    return select ? (select.value || '') : '';
}

function paneOccurrence(pane) {
    const input = pane && pane.querySelector('.tab-occurrence');
    return Number((input && input.value) || 0);
}

function getFormPayload() {
    const auth = getSessionAuth();
    const activePane = activeSchedulePane();
    return {
        Code: currentCode,
        MachineMaster_Code: $('#ddlMachineNo').val() || '',
        EffectiveDate: $('#txtEffectiveDate').val() || '',
        Periodicity: panePeriodicity(activePane),
        Occurrence: paneOccurrence(activePane),
        Location: String($('#txtLocation').val() || '').trim(),
        Schedule: getScheduleRows(),
        MaintenanceTypes: getMaintenanceTypes(),
        UserMaster_Code: auth.UserMaster_Code || 0,
        CompanyCode: auth.CompanyCode || 0
    };
}

document.addEventListener('change', function (event) {
    if (event.target.classList.contains('occurrence-month')) {
        const dayInput = event.target.closest('.occurrence-generated-row') && event.target.closest('.occurrence-generated-row').querySelector('.occurrence-day');
        applyDayLimit(dayInput, true);
        return;
    }

    if (event.target.classList.contains('tab-periodicity')) {
        const pane = event.target.closest('.occurrence-tab-pane');
        if (pane && event.isTrusted) pane._msmChecklistLocked = false;
        if (pane) renderOccurrenceRows(pane);
        return;
    }

    if (event.target.classList.contains('item-code') && event.target.tagName === 'SELECT') {
        bindItemRow(event.target.closest('tr'), 'code');
        return;
    }

    if (event.target.classList.contains('item-name')) {
        bindItemRow(event.target.closest('tr'), 'name');
        return;
    }

    if (!event.target.classList.contains('maintenance-checkbox')
        && !event.target.classList.contains('maintenance-checklist-select-all-input')) return;

    const editedPane = event.target.closest('.occurrence-tab-pane');
    if (editedPane && event.isTrusted) editedPane._msmChecklistLocked = false;

    const dropdown = event.target.closest('.maintenance-checklist-dropdown');
    const button = dropdown && dropdown.querySelector('.maintenance-checklist-button');
    if (!button) return;

    if (event.target.classList.contains('maintenance-checklist-select-all-input')) {
        dropdown.querySelectorAll('.maintenance-checkbox').forEach(item => item.checked = event.target.checked);
    }

    const selected = Array.from(dropdown.querySelectorAll('.maintenance-checkbox:checked'))
        .map(item => item.nextElementSibling.textContent.trim());
    button.textContent = selected.length ? selected.join(', ') : 'Select checklist';

    const selectAll = dropdown.querySelector('.maintenance-checklist-select-all-input');
    if (selectAll && event.target.classList.contains('maintenance-checkbox')) {
        selectAll.checked = dropdown.querySelectorAll('.maintenance-checkbox:checked').length === dropdown.querySelectorAll('.maintenance-checkbox').length;
    }
});

document.addEventListener('click', function (event) {
    const button = event.target.closest('.maintenance-checklist-see-more');
    if (!button) return;
    event.preventDefault();
    const menu = button.closest('.maintenance-checklist-menu');
    if (!menu) return;
    const expanded = menu.classList.toggle('is-expanded');
    button.textContent = expanded ? 'See less' : 'See more';
});

document.addEventListener('click', function (event) {
    const panel = document.getElementById('msmCopyPanel');
    if (!panel || panel.hidden) return;
    if (event.target.closest('.msm-copy-wrap')) return;
    panel.hidden = true;
});

function clearForm() {
    currentCode = 0;
    locatedTabs = null;
    locatedDetailCodes = [];
    $('#ddlMachineNo').val(null).trigger('change');
    $('#txtEffectiveDate, #txtLocation').val('');
    suppressMaintenanceTypeChange = true;
    $('#ddlMaintenanceType').val(null).trigger('change');
    suppressMaintenanceTypeChange = false;
    window.currentMaintenanceSchedules = [];
    generateTabsFromOccurrence();
}

function setFormReadOnly(readOnly) {
    const form = $('#dvFromNEW');
    form.toggleClass('msm-view-mode', readOnly);
    form.find('input, select, textarea, button')
        .not('.msm-btn-back, .maintenance-tab, #btnSubmitMaintenance, #txtLocation')
        .prop('disabled', readOnly);
    $('#txtLocation').prop('readonly', true).prop('disabled', false).attr('autocomplete', 'off');
    $('#btnSubmitMaintenance').prop('disabled', readOnly);
}

function syncMsmFloatBar(mode) {
    const badge = document.getElementById('msmFloatModeBadge');
    const title = document.getElementById('msmFloatTitle');
    if (!badge || !title) return;
    const m = String(mode || '').toUpperCase();
    if (m === 'VIEW') {
        badge.textContent = 'VIEW';
        badge.className = 'msm-mode-badge badge bg-secondary';
        title.textContent = currentCode ? 'Schedule #' + currentCode : 'Maintenance Schedule';
    } else if (m === 'EDIT') {
        badge.textContent = 'EDIT';
        badge.className = 'msm-mode-badge badge bg-primary';
        title.textContent = currentCode ? 'Schedule #' + currentCode : 'Maintenance Schedule';
    } else {
        badge.textContent = 'NEW';
        badge.className = 'msm-mode-badge badge bg-success';
        title.textContent = 'New Maintenance Schedule';
    }
}

function showMsmForm(mode) {
    $('#dvGrid').hide();
    $('#dvFromNEW').show();
    $('#msmFloatBar').css('display', 'flex');
    syncMsmFloatBar(mode);
}

function hideMsmForm() {
    $('#dvFromNEW').hide();
    $('#dvGrid').show();
    $('#msmFloatBar').hide();
}

function CreateNew() {
    checkMsmOptionRight('New').then(function (ok) {
        if (!ok) return;
        setFormReadOnly(false);
        clearForm();
        showMsmForm('NEW');
    });
}

function BackMaster() {
    hideMsmForm();
    loadMaintenanceList();
}

function loadMaintenanceList() {
    return MaintenanceScheduleMasterService.GetMaintenanceScheduleMasterList()
        .then(function (response) {
            const rows = Array.isArray(response) ? response
                : (response && Array.isArray(response.$values) ? response.$values
                    : (response && Array.isArray(response.data) ? response.data : []));
            if (!rows.length) {
                $('#table-header, #table-body').empty();
                $('#paginator-tblMachineMaintenance').empty();
                $('#table-body').html('<tr><td class="text-center text-muted py-3">No maintenance schedules found. Click Create New to add one.</td></tr>');
                return;
            }
            const gridRows = rows.map(function (item, index) {
                const code = Number(fieldValue(item, 'code', 'Code') || 0);
                const machineNo = fieldValue(item, 'machine No', 'Machine No');
                let location = String(fieldValue(item, 'location', 'Location') || '').trim();
                if (!location) location = locationForMachineNo(machineNo);
                return {
                    'S.No.': fieldValue(item, 's.No.', 'S.No.') || index + 1,
                    Code: code,
                    'Machine No': machineNo,
                    Location: location,
                    'Effective Date': fieldValue(item, 'effective Date', 'Effective Date'),
                    Action: '<button type="button" class="msm-btn-view" title="View" onclick="View(' + code + ')"><i class="fas fa-eye"></i></button>'
                        + '<button type="button" class="msm-btn-edit" title="Edit" onclick="Edit(' + code + ')"><i class="fas fa-pen"></i></button>'
                        + '<button type="button" class="msm-btn-delete" title="Delete" onclick="Delete(' + code + ')"><i class="fas fa-trash-alt"></i></button>'
                };
            });
            BizsolCustomFilterGrid.CreateDataTable(
                'table-header',
                'table-body',
                gridRows,
                false, [],
                ['Machine No', 'Location', 'Effective Date'],
                [], ['Effective Date'], [],
                ['Code'],
                { 'S.No.': 'center;width:56px;', 'Effective Date': 'center;', Action: 'center;width:120px;white-space:nowrap;' },
                true, null, null, null,
                'Search by machine no, location, effective date...'
            );
        })
        .catch(function () {
            toastr.error('Unable to load maintenance schedule list.');
        });
}

function isPositiveDayCount(value, fieldLabel) {
    const text = String(value || '').trim();
    if (!text) {
        return fieldLabel + ' is required.';
    }
    if (!/^\d+$/.test(text)) {
        return fieldLabel + ' must be a whole number.';
    }
    const num = Number(text);
    if (num < 1 || num > 366) {
        return fieldLabel + ' must be between 1 and 366.';
    }
    return '';
}

function isValidEmailList(value) {
    const emails = String(value || '').split(/[;,]/).map(function (item) { return item.trim(); }).filter(Boolean);
    if (!emails.length) return false;
    return emails.every(function (email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    });
}

function focusOccurrenceTab(tabName) {
    if (tabName && typeof openOccurrenceTab === 'function') openOccurrenceTab(tabName);
}

function validatePayload(payload) {
    if (!payload.MachineMaster_Code || payload.MachineMaster_Code === '0') {
        toastr.error('Please select a machine.');
        $('#ddlMachineNo').focus();
        return false;
    }

    if (!payload.EffectiveDate) {
        toastr.error('Please select an effective date.');
        $('#txtEffectiveDate').focus();
        return false;
    }

    const selectedTypes = $('#ddlMaintenanceType').val() || [];
    if (!selectedTypes.length) {
        toastr.error('Please select maintenance type.');
        if ($('#ddlMaintenanceType').hasClass('select2-hidden-accessible')) $('#ddlMaintenanceType').select2('open');
        return false;
    }

    const tabs = payload.MaintenanceTypes || [];
    if (!tabs.length) {
        toastr.error('Please add at least one occurrence tab.');
        return false;
    }

    for (const tab of tabs) {
        if (!tab.Periodicity || tab.Periodicity === '0') {
            toastr.error('Please select periodicity for ' + tab.Type + '.');
            openOccurrenceTab(tab.Type);
            return false;
        }
        if (!tab.Occurrence || tab.Occurrence < 1 || tab.Occurrence > 20) {
            toastr.error('Occurrence for ' + tab.Type + ' must be between 1 and 20.');
            openOccurrenceTab(tab.Type);
            return false;
        }
        const tabDaily = isDailyPeriodicityCode(tab.Periodicity);
        const tabMonthly = isMonthlyPeriodicityCode(tab.Periodicity);
        if (!tab.ChecklistItems || !tab.ChecklistItems.length) {
            toastr.error('Please select a maintenance checklist for ' + tab.Type + '.');
            openOccurrenceTab(tab.Type);
            return false;
        }
        if (!tabDaily) {
            if (!tab.Day) {
                toastr.error('Please enter day for ' + (tab.Month || tab.Type) + '.');
                openOccurrenceTab(tab.Type);
                return false;
            }
            const maxDay = tabMonthly ? daysInMonthName(effectiveDateMonthName()) : daysInMonthName(tab.Month);
            if (Number(tab.Day) < 1 || Number(tab.Day) > maxDay) {
                const monthLabel = tabMonthly ? effectiveDateMonthName() : (tab.Month || 'Selected month');
                toastr.error(monthLabel + ' allows days 1 to ' + maxDay + '.');
                openOccurrenceTab(tab.Type);
                return false;
            }
        }
        if (!tab.Items || !tab.Items.length) {
            toastr.error('Please add at least one item for ' + tab.Type + '.');
            focusOccurrenceTab(tab.Type);
            return false;
        }
        for (const item of tab.Items) {
            if (!item.ItemMaster_Code && !item.ItemCode) {
                toastr.error('Please select item code for ' + tab.Type + '.');
                focusOccurrenceTab(tab.Type);
                return false;
            }
            if (!item.ItemName) {
                toastr.error('Please select item name for ' + tab.Type + '.');
                focusOccurrenceTab(tab.Type);
                return false;
            }
            if (!item.Quantity || item.Quantity <= 0) {
                toastr.error('Please enter quantity for ' + tab.Type + '.');
                focusOccurrenceTab(tab.Type);
                return false;
            }
            if (!item.Action) {
                toastr.error('Please select action for ' + tab.Type + '.');
                focusOccurrenceTab(tab.Type);
                return false;
            }
        }

        if (!isValidEmailList(tab.Recipients)) {
            toastr.error('Please enter a valid recipients email id for ' + tab.Type + '.');
            focusOccurrenceTab(tab.Type);
            return false;
        }

        const estimatedMsg = isPositiveDayCount(tab.EstimatedStartDate, 'Estimated day for starting mail');
        if (estimatedMsg) {
            toastr.error(estimatedMsg + ' (' + tab.Type + ').');
            focusOccurrenceTab(tab.Type);
            return false;
        }

        if (!isValidEmailList(tab.EscalationMail)) {
            toastr.error('Please enter a valid escalation mail id for ' + tab.Type + '.');
            focusOccurrenceTab(tab.Type);
            return false;
        }

        const escalationGapMsg = isPositiveDayCount(tab.EscalationGap, 'Escalation gap for mail (days)');
        if (escalationGapMsg) {
            toastr.error(escalationGapMsg + ' (' + tab.Type + ').');
            focusOccurrenceTab(tab.Type);
            return false;
        }
    }

    return true;
}

function toMaintenanceDate(effectiveDate, day, tab) {
    const text = String(day || '').trim();
    if (!text) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.substring(0, 10);
    const dayNum = Number(text);
    if (!dayNum) return null;
    const monthNumber = tab && Number(tab.MonthNumber || 0);
    const monthYear = tab && Number(tab.MonthYear || 0);
    if (monthNumber && monthYear) {
        const fromMonth = new Date(monthYear, monthNumber - 1, dayNum);
        if (fromMonth.getFullYear() === monthYear && fromMonth.getMonth() === monthNumber - 1) {
            return monthYear + '-' + String(monthNumber).padStart(2, '0') + '-' + String(fromMonth.getDate()).padStart(2, '0');
        }
    }
    const parts = String(effectiveDate || '').split('-');
    if (parts.length < 3) return null;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const date = new Date(year, month - 1, dayNum);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1) return null;
    return year + '-' + String(month).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function dayFromStoredValue(value) {
    if (value === undefined || value === null || value === '') return '';
    const text = String(value);
    const match = text.match(/^\d{4}-\d{2}-(\d{2})/);
    if (match) return String(Number(match[1]));
    return /^\d+$/.test(text) ? String(Number(text)) : '';
}

function fieldValue(source, camelName, pascalName) {
    if (!source) return '';
    const value = source[camelName] !== undefined && source[camelName] !== null ? source[camelName] : source[pascalName];
    return value === undefined || value === null ? '' : value;
}

function periodicityLabel(code) {
    const found = periodicityOptions.find(function (item) { return String(item.Code) === String(code); });
    return found && found.Desp ? String(found.Desp) : String(code || '');
}

function getSaveRequest(payload) {
    const transactions = [];
    const checkLists = [];
    const items = [];
    const rowNoByTab = {};

    (payload.MaintenanceTypes || []).forEach(function (tab) {
        const key = String(tab.MaintenanceType || '') + '|' + String(tab.Type || '');
        let rowNo = rowNoByTab[key];
        if (!rowNo) {
            rowNo = transactions.length + 1;
            rowNoByTab[key] = rowNo;
            transactions.push({
                rowNo: rowNo,
                maintenanceTypeMaster_Code: Number(tab.MaintenanceType || 0),
                periodicity: periodicityLabel(tab.Periodicity),
                occurrence: Number(tab.Occurrence || 0),
                recipientEmail: tab.Recipients || '',
                estimatedDays: Number(tab.EstimatedStartDate || 0) || 0,
                escalationMail: tab.EscalationMail || '',
                escalationGapForMail: Number(tab.EscalationGap || 0) || 0
            });
            (tab.Items || []).forEach(function (item) {
                items.push({
                    rowNo: rowNo,
                    itemMaster_Code: Number(item.ItemMaster_Code || 0),
                    qty: Number(item.Quantity || 0),
                    action: item.Action || ''
                });
            });
        }
        (tab.ChecklistItems || []).forEach(function (checklistCode) {
            checkLists.push({
                rowNo: rowNo,
                month: tab.Month || '',
                days: Number(tab.Day || 0),
                maintenanceCheckListMaster_Code: Number(checklistCode || 0)
            });
        });
    });

    return {
        master: {
            code: Number(payload.Code || 0),
            machineMaster_Code: Number(payload.MachineMaster_Code || 0),
            effectiveDate: payload.EffectiveDate || null,
            userMaster_Code: Number(payload.UserMaster_Code || 0)
        },
        transactions: transactions,
        checkLists: checkLists,
        items: items
    };
}

let saveInProgress = false;

function SaveMachineMaintenance() {
    if (saveInProgress || $('#dvFromNEW').hasClass('msm-view-mode')) return;
    checkMsmOptionRight(currentCode ? 'Edit' : 'New').then(function (ok) {
        if (!ok) return;
        const payload = getFormPayload();
        if (!validatePayload(payload)) return;

        saveInProgress = true;
        MaintenanceScheduleMasterService.SaveMaintenanceScheduleMaster(getSaveRequest(payload))
        .then(function (response) {
            const result = Array.isArray(response) ? response[0] : response;
            if (result && (result.Status === 'Y' || result.status === 'Y')) {
                currentCode = Number(result.Code || result.code || currentCode || 0);
                toastr.success(result.Msg || result.msg || 'Maintenance schedule saved successfully.');
                BackMaster();
            } else {
                toastr.error((result && (result.Msg || result.msg)) || 'Unable to save maintenance schedule.');
            }
        })
        .catch(function (err) {
            const serverMessage = err && err.xhr && err.xhr.responseText ? String(err.xhr.responseText).trim() : '';
            toastr.error(serverMessage || 'An error occurred while saving the maintenance schedule.');
        })
        .finally(function () {
            saveInProgress = false;
        });
    });
}

let locateInProgress = false;

function LocateMaintenanceSchedule() {
    if (locateInProgress) return;

    const machineCode = $('#ddlMachineNo').val();
    if (!machineCode || machineCode === '0') {
        toastr.error('Please select a machine.');
        if ($('#ddlMachineNo').hasClass('select2-hidden-accessible')) $('#ddlMachineNo').select2('open');
        return;
    }

    locateInProgress = true;
    MaintenanceScheduleMasterService.GetMaintenanceScheduleMasterLocate(machineCode)
        .then(function (response) {
            applyLocatedSchedule(response, machineCode);
        })
        .catch(function () {
            toastr.error('Unable to locate the maintenance schedule.');
        })
        .finally(function () {
            locateInProgress = false;
        });
}

function applyLocatedSchedule(response, selectedMachine) {
    if (typeof response === 'string') {
        toastr.error(response || 'Unable to locate the maintenance schedule.');
        return;
    }

    const status = response && (response.Status || response.status);
    if (response && status === 'N' && !response.master && !response.Master && !response.details && !response.Details) {
        toastr.warning(response.Msg || response.msg || 'No maintenance schedule found.');
        return;
    }

    let master = {};
    let details = [];
    if (Array.isArray(response)) {
        const first = response[0] || {};
        if (first.master || first.Master || first.machineMaster_Code || first.MachineMaster_Code || first.code || first.Code) {
            master = first.master || first.Master || first;
            details = first.details || first.Details || [];
        } else {
            details = response;
        }
    } else if (response && typeof response === 'object') {
        master = response.master || response.Master || response;
        details = response.details || response.Details || master.details || master.Details || [];
    }
    if (!Array.isArray(details)) details = [];

    const scheduleCode = Number(fieldValue(master, 'code', 'Code') || 0);
    if (!scheduleCode && !details.length && !fieldValue(master, 'periodicity', 'Periodicity') && !fieldValue(master, 'occurrence', 'Occurrence')) {
        toastr.warning('No maintenance schedule found for the selected machine.');
        return;
    }

    currentCode = scheduleCode;
    locatedDetailCodes = details.map(function (row) {
        return {
            type: String(fieldValue(row, 'maintenanceTypeMaster_Code', 'MaintenanceTypeMaster_Code') || ''),
            item: String(fieldValue(row, 'itemMaster_Code', 'ItemMaster_Code') || ''),
            checklist: String(fieldValue(row, 'maintenanceCheckListMaster_Code', 'MaintenanceCheckListMaster_Code') || ''),
            code: Number(fieldValue(row, 'code', 'Code') || 0)
        };
    });

    const machineCode = fieldValue(master, 'machineMaster_Code', 'MachineMaster_Code') || selectedMachine;
    $('#ddlMachineNo').val(String(machineCode)).trigger('change');
    const locatedLocation = fieldValue(master, 'location', 'Location');
    if (locatedLocation) showLocationValue(locatedLocation);
    $('#txtEffectiveDate').val(formatDateForInput(fieldValue(master, 'effectiveDate', 'EffectiveDate')));
    const locatedPeriodicity = periodicityValueFromLabel(fieldValue(master, 'periodicity', 'Periodicity'))
        || String(fieldValue(master, 'periodicityMaster_Code', 'PeriodicityMaster_Code') || '');
    const locatedOccurrence = Number(fieldValue(master, 'occurrence', 'Occurrence') || 0);
    const emailDefaults = {
        Recipients: fieldValue(master, 'recipientEmail', 'RecipientEmail'),
        EstimatedStartDate: dayFromStoredValue(fieldValue(master, 'estimatedDate', 'EstimatedDate')),
        EscalationMail: fieldValue(master, 'escalationMail', 'EscalationMail'),
        EscalationGap: (function () {
            const gap = fieldValue(master, 'escalationGapForMail', 'EscalationGapForMail');
            return gap === '' || gap === 0 ? '' : String(gap);
        })()
    };

    const groups = tabsFromDetails(details);
    groups.forEach(function (group) {
        Object.assign(group, emailDefaults);
        if (locatedPeriodicity) group.Periodicity = locatedPeriodicity;
        if (locatedOccurrence > 0) group.Occurrence = locatedOccurrence;
    });
    const typeCodes = [];
    groups.forEach(function (group) {
        if (group.MaintenanceType && typeCodes.indexOf(group.MaintenanceType) === -1) typeCodes.push(group.MaintenanceType);
    });
    suppressMaintenanceTypeChange = true;
    $('#ddlMaintenanceType').val(typeCodes).trigger('change');
    suppressMaintenanceTypeChange = false;

    locatedTabs = groups;
    window.currentMaintenanceSchedules = groups;
    generateTabsFromOccurrence();
    toastr.success('Maintenance schedule located.');
}

function tabsFromDetails(details) {
    const groups = [];
    details.forEach(function (row) {
        const typeCode = String(fieldValue(row, 'maintenanceTypeMaster_Code', 'MaintenanceTypeMaster_Code') || '');
        const matched = maintenanceTabNames.find(function (type) { return String(type.value) === typeCode; });
        const typeName = matched ? matched.text : typeCode;
        if (!typeName) return;
        let group = groups.find(function (item) { return item.Type === typeName; });
        if (!group) {
            group = {
                Type: typeName,
                MaintenanceType: typeCode,
                Day: dayFromStoredValue(fieldValue(row, 'maintenanceDate', 'MaintenanceDate')),
                ChecklistItems: [],
                Items: []
            };
            groups.push(group);
        }
        const checklist = String(fieldValue(row, 'maintenanceCheckListMaster_Code', 'MaintenanceCheckListMaster_Code') || '');
        if (checklist && checklist !== '0' && group.ChecklistItems.indexOf(checklist) === -1) group.ChecklistItems.push(checklist);
        const itemMasterCode = fieldValue(row, 'itemMaster_Code', 'ItemMaster_Code');
        const itemCode = fieldValue(row, 'itemCode', 'ItemCode');
        const itemName = fieldValue(row, 'itemName', 'ItemName');
        const action = fieldValue(row, 'action', 'Action');
        const alreadyAdded = group.Items.some(function (item) {
            return String(item.ItemMaster_Code) === String(itemMasterCode || '')
                && String(item.ItemCode) === String(itemCode || '')
                && String(item.Action) === String(action || '');
        });
        if (!alreadyAdded && (itemMasterCode || itemCode || itemName)) {
            group.Items.push({
                Code: fieldValue(row, 'code', 'Code'),
                ItemMaster_Code: itemMasterCode,
                ItemCode: itemCode,
                ItemName: itemName,
                Quantity: fieldValue(row, 'qty', 'Qty'),
                Action: action
            });
        }
    });
    return groups;
}

function apiErrorMessage(err, fallback) {
    const xhr = err && err.xhr;
    if (xhr && xhr.status === 404) return 'API endpoint not found. Please rebuild and restart the API.';
    const serverMessage = xhr && xhr.responseText ? String(xhr.responseText).trim().substring(0, 300) : '';
    return serverMessage || fallback;
}

function responseList(data, camelName, pascalName) {
    const value = data ? (data[camelName] !== undefined ? data[camelName] : data[pascalName]) : null;
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.$values)) return value.$values;
    return [];
}

function periodicityValueFromLabel(label) {
    const text = String(label || '').trim().toLowerCase();
    const found = periodicityOptions.find(function (item) {
        return String(item.Desp || '').trim().toLowerCase() === text || String(item.Code || '').trim().toLowerCase() === text;
    });
    return found ? String(found.Code) : String(label || '');
}

function editTabsFromResponse(transactions, checkLists, items) {
    return transactions.map(function (transaction) {
        const transactionCode = String(fieldValue(transaction, 'code', 'Code'));
        const typeCode = String(fieldValue(transaction, 'maintenanceTypeMaster_Code', 'MaintenanceTypeMaster_Code'));
        const matched = maintenanceTabNames.find(function (type) { return String(type.value) === typeCode; });
        const rows = [];
        checkLists
            .filter(function (row) { return String(fieldValue(row, 'maintenanceScheduleTransaction_Code', 'MaintenanceScheduleTransaction_Code')) === transactionCode; })
            .forEach(function (row) {
                const month = String(fieldValue(row, 'month', 'Month'));
                const day = String(fieldValue(row, 'days', 'Days'));
                let group = rows.find(function (item) { return item.month === month && item.day === day; });
                if (!group) {
                    group = { month: month, day: day, checklist: [] };
                    rows.push(group);
                }
                group.checklist.push(String(fieldValue(row, 'maintenanceCheckListMaster_Code', 'MaintenanceCheckListMaster_Code')));
            });
        const estimatedDays = fieldValue(transaction, 'estimatedDays', 'EstimatedDays');
        const escalationGap = fieldValue(transaction, 'escalationGapForMail', 'EscalationGapForMail');
        return {
            Type: matched ? matched.text : String(fieldValue(transaction, 'maintenanceTypeName', 'MaintenanceTypeName')),
            MaintenanceType: typeCode,
            Periodicity: periodicityValueFromLabel(fieldValue(transaction, 'periodicity', 'Periodicity')),
            Occurrence: Number(fieldValue(transaction, 'occurrence', 'Occurrence') || 0),
            Recipients: fieldValue(transaction, 'recipientEmail', 'RecipientEmail'),
            EstimatedStartDate: estimatedDays === 0 || estimatedDays === '0' ? '' : String(estimatedDays),
            EscalationMail: fieldValue(transaction, 'escalationMail', 'EscalationMail'),
            EscalationGap: escalationGap === 0 || escalationGap === '0' ? '' : String(escalationGap),
            ChecklistItems: [],
            Rows: rows,
            Items: items
                .filter(function (item) { return String(fieldValue(item, 'maintenanceScheduleTransaction_Code', 'MaintenanceScheduleTransaction_Code')) === transactionCode; })
                .map(function (item) {
                    return {
                        ItemMaster_Code: fieldValue(item, 'itemMaster_Code', 'ItemMaster_Code'),
                        ItemCode: fieldValue(item, 'itemCode', 'ItemCode'),
                        ItemName: fieldValue(item, 'itemName', 'ItemName'),
                        Quantity: fieldValue(item, 'qty', 'Qty'),
                        Action: fieldValue(item, 'action', 'Action')
                    };
                })
        };
    });
}

function placeSavedChecklistRows(savedRows, rowCount) {
    const placed = new Array(rowCount);
    const leftovers = [];
    (savedRows || []).forEach(function (saved) {
        const monthText = String(saved && saved.month != null ? saved.month : '').trim();
        const rowIndex = /^\d+$/.test(monthText) ? Number(monthText) - 1 : -1;
        const dayText = saved && saved.day != null ? String(saved.day).trim() : '';
        const entry = {
            month: monthText,
            day: dayText === '0' ? '' : dayText,
            checklist: ((saved && saved.checklist) || []).map(function (item) { return String(item); }).filter(function (item) { return item && item !== '0'; })
        };
        if (rowIndex >= 0 && rowIndex < rowCount && !placed[rowIndex]) placed[rowIndex] = entry;
        else leftovers.push(entry);
    });
    leftovers.forEach(function (entry) {
        const openIndex = placed.findIndex(function (item) { return !item; });
        if (openIndex >= 0) placed[openIndex] = entry;
        else placed.push(entry);
    });
    const filled = placed.filter(function (item) { return item && item.checklist && item.checklist.length; });
    if (filled.length === 1 && rowCount > 1) {
        const source = filled[0].checklist.slice();
        for (let index = 0; index < rowCount; index++) {
            if (placed[index] && placed[index].checklist && placed[index].checklist.length) continue;
            placed[index] = {
                month: placed[index] ? placed[index].month : '',
                day: placed[index] ? placed[index].day : '',
                checklist: source.slice()
            };
        }
    }
    return placed;
}

function fillEditTabPane(tab) {
    const pane = Array.from(document.querySelectorAll('.occurrence-tab-pane')).find(function (item) {
        return item.dataset.occurrenceTab === tab.Type;
    });
    if (!pane) return;
    const recipients = pane.querySelector('.tab-recipients');
    if (recipients) recipients.value = tab.Recipients || '';
    const estimated = pane.querySelector('.tab-estimated-days');
    if (estimated) estimated.value = tab.EstimatedStartDate || '';
    const escalationMail = pane.querySelector('.tab-escalation-mail');
    if (escalationMail) escalationMail.value = tab.EscalationMail || '';
    const escalationGap = pane.querySelector('.tab-escalation-gap');
    if (escalationGap) escalationGap.value = tab.EscalationGap || '';
    const generatedRows = pane.querySelectorAll('.occurrence-generated-row');
    const savedRows = placeSavedChecklistRows(tab.Rows || [], generatedRows.length);
    pane._msmChecklistRows = savedRows;
    pane._msmChecklistLocked = true;
    generatedRows.forEach(function (row, index) {
        const saved = savedRows[index];
        if (!saved) return;
        const monthSelect = row.querySelector('.occurrence-month');
        if (monthSelect && saved.month && !/^\d+$/.test(String(saved.month))) monthSelect.value = saved.month;
        const dayInput = row.querySelector('.occurrence-day');
        if (dayInput) {
            dayInput.value = saved.day && saved.day !== '0' ? saved.day : '';
            applyDayLimit(dayInput, false);
        }
        const menu = row.querySelector('.maintenance-checklist-menu');
        if (menu) menu.innerHTML = getChecklistMarkup(saved.checklist);
    });
    refreshChecklistButtons(pane);
}

function View(code) {
    checkMsmOptionRight('View').then(function (ok) {
        if (!ok) return;
        openMaintenanceSchedule(code, true);
    });
}

function Edit(code, viewOnly) {
    if (viewOnly === true) {
        openMaintenanceSchedule(code, true);
        return;
    }
    checkMsmOptionRight('Edit').then(function (ok) {
        if (!ok) return;
        openMaintenanceSchedule(code, false);
    });
}

function scheduleMasterRow(response) {
    const rows = responseList(response, 'master', 'Master');
    if (rows.length) return rows[0];
    const master = response && (response.master || response.Master);
    if (master && !Array.isArray(master)) return master;
    return null;
}

function openMaintenanceSchedule(code, viewOnly) {
    MaintenanceScheduleMasterService.GetMaintenanceScheduleMasterByCode(code)
        .then(function (response) {
            const failed = response && (response.Status === 'N' || response.status === 'N')
                && !response.master && !response.Master;
            if (failed) {
                toastr.error(response.Msg || response.msg || 'Maintenance schedule was not found.');
                return;
            }
            const master = scheduleMasterRow(response);
            if (!master) {
                toastr.error('Maintenance schedule was not found.');
                return;
            }
            const transactions = responseList(response, 'transactions', 'Transactions');
            const checkLists = responseList(response, 'checkLists', 'CheckLists');
            const items = responseList(response, 'items', 'Items');

            setFormReadOnly(false);
            clearForm();
            currentCode = Number(fieldValue(master, 'code', 'Code') || code);
            showMsmForm(viewOnly === true ? 'VIEW' : (currentCode ? 'EDIT' : 'NEW'));

            $('#ddlMachineNo').val(String(fieldValue(master, 'machineMaster_Code', 'MachineMaster_Code'))).trigger('change');
            $('#txtEffectiveDate').val(formatDateForInput(fieldValue(master, 'effectiveDate', 'EffectiveDate')));

            const tabs = editTabsFromResponse(transactions, checkLists, items);
            suppressMaintenanceTypeChange = true;
            $('#ddlMaintenanceType').val(tabs.map(function (tab) { return tab.MaintenanceType; })).trigger('change');
            suppressMaintenanceTypeChange = false;

            locatedTabs = tabs;
            window.currentMaintenanceSchedules = [];
            generateTabsFromOccurrence();
            tabs.forEach(fillEditTabPane);
            setFormReadOnly(viewOnly === true);
        })
        .catch(function (err) {
            toastr.error(apiErrorMessage(err, 'Unable to load the maintenance schedule.'));
        });
}

function Delete(code) {
    checkMsmOptionRight('Delete').then(function (ok) {
        if (!ok) return;
        $('#txtcode').val(code);
        $('#deleteConfirmBackdrop').addClass('show');
    });
}

let deleteInProgress = false;

function SaveModalDelete() {
    const code = Number($('#txtcode').val() || 0);
    if (!code || deleteInProgress) return;
    checkMsmOptionRight('Delete').then(function (ok) {
        if (!ok) return;
        deleteMaintenanceSchedule(code);
    });
}

function deleteMaintenanceSchedule(code) {
    deleteInProgress = true;
    MaintenanceScheduleMasterService.DeleteMaintenanceScheduleMaster(code)
        .then(function (response) {
            const result = Array.isArray(response) ? response[0] : response;
            if (result && (result.Status === 'Y' || result.status === 'Y')) {
                toastr.success(result.Msg || result.msg || 'Maintenance schedule deleted successfully.');
                CloseModalDelete();
                loadMaintenanceList();
            } else {
                toastr.error((result && (result.Msg || result.msg)) || 'Unable to delete maintenance schedule.');
            }
        })
        .catch(function (err) {
            toastr.error(apiErrorMessage(err, 'An error occurred while deleting the maintenance schedule.'));
        })
        .finally(function () {
            deleteInProgress = false;
        });
}

function CloseModalDelete() {
    $('#deleteConfirmBackdrop').removeClass('show');
    $('#txtcode').val('');
}

function formatDateForInput(value) {
    if (!value) return '';
    return String(value).substring(0, 10);
}
function BindSelectList(element, list) {
    let option = '<option value="0">Select</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + (val.Code ?? '') + '">' + (val.Desp || val.desp || val.Code || '') + '</option>';
    });
    element.innerHTML = option;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function lockGeneratedRows(pane) {
    const form = document.getElementById('dvFromNEW');
    if (!form || !form.classList.contains('msm-view-mode') || !pane) return;
    pane.querySelectorAll('.occurrence-generated input, .occurrence-generated select, .occurrence-generated button').forEach(function (control) {
        control.disabled = true;
    });
}

function refreshChecklistButtons(root) {
    (root || document).querySelectorAll('.maintenance-checklist-dropdown').forEach(function (dropdown) {
        const button = dropdown.querySelector('.maintenance-checklist-button');
        if (!button) return;
        const selected = Array.from(dropdown.querySelectorAll('.maintenance-checkbox:checked'))
            .map(item => item.nextElementSibling.textContent.trim());
        button.textContent = selected.length ? selected.join(', ') : 'Select checklist';
    });
}

function escapeJs(value) {
    return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function selectedMaintenanceTypes() {
    const values = $('#ddlMaintenanceType').val() || [];
    const selected = Array.isArray(values) ? values : [values];
    return selected.filter(Boolean).map(function (value) {
        return maintenanceTabNames.find(function (type) { return String(type.value) === String(value); });
    }).filter(Boolean);
}

function createOccurrenceTabNames() {
    return selectedMaintenanceTypes().map(function (type) { return type.text; }).filter(Boolean);
}

function periodicitySortRank(label) {
    const text = String(label || '').trim().toLowerCase();
    if (text.indexOf('daily') !== -1) return 1;
    if (text.indexOf('month') !== -1) return 2;
    if (text.indexOf('quarter') !== -1 || text.indexOf('quater') !== -1) return 3;
    if (text.indexOf('half') !== -1) return 4;
    if (text.indexOf('year') !== -1 || text.indexOf('annual') !== -1) return 5;
    return 100;
}

function sortPeriodicityOptions(list) {
    return (list || []).slice().sort(function (a, b) {
        const rankA = periodicitySortRank(a.Desp || a.text || a.Code);
        const rankB = periodicitySortRank(b.Desp || b.text || b.Code);
        if (rankA !== rankB) return rankA - rankB;
        return String(a.Desp || a.text || '').localeCompare(String(b.Desp || b.text || ''));
    });
}

function periodicityOptionMarkup(selected) {
    const current = String(selected || '');
    return '<option value=""' + (current ? '' : ' selected') + '></option>' + sortPeriodicityOptions(periodicityOptions).map(function (item) {
        return '<option value="' + escapeHtml(item.Code) + '"' + (current === String(item.Code) ? ' selected' : '') + '>' + escapeHtml(item.Desp) + '</option>';
    }).join('');
}

function monthStepFromLabel(label) {
    const text = String(label || '').toLowerCase();
    if (text.indexOf('half') !== -1) return 6;
    if (text.indexOf('quarter') !== -1) return 3;
    if (text.indexOf('year') !== -1) return 12;
    return 1;
}

function monthLabelForIndex(index, periodicityText) {
    const fromApi = monthAt(index, periodicityText);
    if (fromApi) return fromApi.text;
    return '';
}

function periodicityTextFromPane(pane) {
    const select = pane && pane.querySelector('.tab-periodicity');
    if (!select) return '';
    const code = String(select.value || '').trim();
    if (code && code !== '0') {
        const label = periodicityLabel(code);
        if (label) return label;
    }
    if (select.selectedIndex >= 0) {
        return String(select.options[select.selectedIndex].text || '').trim();
    }
    return '';
}

function normalizePeriodicityLabel(label) {
    return String(label || '').trim().toLowerCase();
}

function isDailyPeriodicityLabel(label) {
    const text = normalizePeriodicityLabel(label);
    return text === 'daily' || text.startsWith('daily ');
}

function isMonthlyPeriodicityLabel(label) {
    const text = normalizePeriodicityLabel(label);
    if (isDailyPeriodicityLabel(label)) return false;
    return text === 'monthly' || text.startsWith('monthly ');
}

function isDailyPeriodicityCode(code) {
    return isDailyPeriodicityLabel(periodicityLabel(code));
}

function isMonthlyPeriodicityCode(code) {
    return isMonthlyPeriodicityLabel(periodicityLabel(code));
}

function occurrenceScheduleMode(pane) {
    if (!pane) return 'full';
    const label = periodicityTextFromPane(pane) || periodicityLabel(panePeriodicity(pane));
    if (isDailyPeriodicityLabel(label)) return 'daily';
    if (isMonthlyPeriodicityLabel(label)) return 'monthly';
    return 'full';
}

function applyOccurrencePaneLayout(pane) {
    if (!pane) return;
    const mode = occurrenceScheduleMode(pane);
    const isCompact = mode === 'daily' || mode === 'monthly';
    pane.classList.remove(
        'occurrence-schedule-pane-daily',
        'occurrence-schedule-pane-monthly',
        'occurrence-schedule-pane-full',
        'occurrence-schedule-pane-compact'
    );
    pane.classList.add('occurrence-schedule-pane-' + mode);
    if (isCompact) pane.classList.add('occurrence-schedule-pane-compact');
    const shell = pane.querySelector('.msm-schedule-entry-shell');
    if (shell) {
        shell.classList.toggle('msm-schedule-entry-compact', isCompact);
        shell.style.width = '';
        shell.style.maxWidth = '';
        shell.style.boxSizing = '';
    }
    const host = pane.querySelector('.occurrence-generated');
    if (host) {
        if (isCompact) {
            const narrow = window.matchMedia('(max-width: 991.98px)').matches;
            host.style.setProperty('width', narrow ? '100%' : (mode === 'daily' ? '720px' : '760px'), 'important');
            host.style.setProperty('max-width', '100%', 'important');
        } else {
            host.style.removeProperty('width');
            host.style.removeProperty('max-width');
        }
    }
    const scheduleCard = pane.querySelector('.msm-tab-schedule');
    if (scheduleCard) scheduleCard.classList.toggle('msm-tab-schedule-compact', isCompact);
}

function effectiveDateMonthName() {
    const effective = document.getElementById('txtEffectiveDate');
    let date = effective && effective.value ? new Date(effective.value + 'T00:00:00') : new Date();
    if (isNaN(date.getTime())) date = new Date();
    return date.toLocaleString('en-US', { month: 'long' });
}

function renderOccurrenceRows(pane) {
    if (!pane) return;
    let host = pane.querySelector('.occurrence-generated');
    if (!host) {
        host = document.createElement('div');
        host.className = 'occurrence-generated';
        const fields = pane.querySelector('.occurrence-fields');
        const insertParent = (fields && fields.closest('.msm-schedule-entry-shell')) || (fields && fields.parentNode);
        if (fields && insertParent) insertParent.appendChild(host);
        else if (fields && fields.parentNode) fields.after(host);
        else pane.appendChild(host);
    }
    const previous = Array.from(host.querySelectorAll('.occurrence-generated-row')).map(function (row) {
        const dayInput = row.querySelector('.occurrence-day');
        const monthInput = row.querySelector('.occurrence-month');
        return {
            day: dayInput ? dayInput.value : '',
            month: monthInput ? monthInput.value : '',
            checklist: Array.from(row.querySelectorAll('.maintenance-checkbox:checked')).map(function (item) { return item.value; })
        };
    });
    const count = Math.max(0, Math.min(20, paneOccurrence(pane) || 0));
    applyOccurrencePaneLayout(pane);
    if (!count) {
        host.innerHTML = '';
        host.className = 'occurrence-generated';
        return;
    }
    const periodicityText = periodicityTextFromPane(pane);
    const scheduleMode = occurrenceScheduleMode(pane);
    const dailyMode = scheduleMode === 'daily';
    const monthlyMode = scheduleMode === 'monthly';
    const showMonth = !dailyMode && !monthlyMode;
    const showDay = !dailyMode;
    const rows = [];

    if (dailyMode) {
        for (let index = 0; index < count; index++) {
            const locked = pane._msmChecklistLocked && pane._msmChecklistRows ? pane._msmChecklistRows[index] : null;
            const saved = locked || previous[index] || {};
            const rowLabel = 'Maintenance Checklist <span class="text-danger">*</span>';
            rows.push('<div class="occurrence-generated-row occurrence-daily-row">' +
                '<div class="occurrence-daily-checklist-label maintenance-label" style="display:inline-block;margin:0 0 8px;padding:4px 10px;color:#fff !important;background:#4f46e5 !important;border-radius:6px;font-size:12px;font-weight:700;line-height:1.3;">' + rowLabel + '</div>' +
                '<div class="occurrence-checklist-cell occurrence-daily-checklist-cell">' +
                '<div class="maintenance-checklist-dropdown">' +
                '<button class="maintenance-checklist-button" type="button">Select checklist</button>' +
                '<div class="maintenance-checklist-menu show">' + getChecklistMarkup(saved.checklist || []) + '</div></div></div></div>');
        }
        host.className = 'occurrence-generated occurrence-schedule-host-mode-daily occurrence-schedule-compact';
        host.innerHTML = '<div class="occurrence-generated-daily-wrap occurrence-schedule-mode-daily occurrence-schedule-compact">' + rows.join('') + '</div>';
        applyOccurrencePaneLayout(pane);
        refreshChecklistButtons(host);
        lockGeneratedRows(pane);
        return;
    }

    for (let index = 0; index < count; index++) {
        const locked = pane._msmChecklistLocked && pane._msmChecklistRows ? pane._msmChecklistRows[index] : null;
        const saved = locked || previous[index] || {};
        const month = (saved.month && !/^\d+$/.test(String(saved.month)) ? saved.month : '') || monthLabelForIndex(index, periodicityText);
        const dayMonthRef = monthlyMode ? effectiveDateMonthName() : month;
        const maxDay = daysInMonthName(dayMonthRef);
        const monthCell = showMonth
            ? '<td class="occurrence-month-cell">' +
            '<select class="form-select form-select-sm occurrence-month">' + monthOptionMarkup(month) + '</select></td>'
            : '';
        const dayCell = showDay
            ? '<td class="occurrence-day-cell">' +
            '<input type="text" class="form-control form-control-sm occurrence-day numeric-only" inputmode="numeric" maxlength="2" autocomplete="off" data-max-day="' + maxDay + '" placeholder="1-' + maxDay + '" value="' + escapeHtml(saved.day || '') + '" /></td>'
            : '';
        rows.push('<tr class="occurrence-generated-row">' + monthCell + dayCell +
            '<td class="occurrence-checklist-cell">' +
            '<div class="maintenance-checklist-dropdown">' +
            '<button class="maintenance-checklist-button" type="button">Select checklist</button>' +
            '<div class="maintenance-checklist-menu show">' + getChecklistMarkup(saved.checklist || []) + '</div></div></td></tr>');
    }
    const headCols =
        (showMonth ? '<th class="occurrence-col-month">Month</th>' : '') +
        (showDay ? '<th class="occurrence-col-day">Day</th>' : '') +
        '<th class="occurrence-col-checklist">Maintenance Checklist <span class="text-danger">*</span></th>';
    const compactClass = (dailyMode || monthlyMode) ? ' occurrence-schedule-compact' : '';
    host.className = 'occurrence-generated occurrence-schedule-host-mode-' + scheduleMode + compactClass;
    host.innerHTML = '<div class="occurrence-generated-table-wrap occurrence-schedule-mode-' + scheduleMode + compactClass + '">' +
        '<table class="occurrence-generated-table occurrence-schedule-mode-' + scheduleMode + compactClass + '">' +
        '<thead><tr class="occurrence-generated-head">' + headCols +
        '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
    host.querySelectorAll('.occurrence-day').forEach(function (dayInput) { applyDayLimit(dayInput, false); });
    applyOccurrencePaneLayout(pane);
    refreshChecklistButtons(host);
    lockGeneratedRows(pane);
}

function applyTabPeriodicityLookups() {
    document.querySelectorAll('.tab-periodicity').forEach(function (select) {
        const pane = select.closest('.occurrence-tab-pane');
        const current = select.value || (pane && pane.dataset.periodicity) || '';
        const $select = $(select);
        if ($select.hasClass('select2-hidden-accessible')) $select.select2('destroy');
        select.innerHTML = periodicityOptionMarkup(current);
        select.value = current || '';
        $select.select2({
            width: '100%',
            minimumResultsForSearch: Infinity,
            placeholder: 'Select',
            allowClear: true,
            dropdownParent: msmSelect2DropdownParent()
        });
        if (!current) $select.val(null).trigger('change.select2');
        $select.off('select2:select.msmPeriodicity select2:clear.msmPeriodicity change.msmPeriodicity')
            .on('select2:select.msmPeriodicity select2:clear.msmPeriodicity change.msmPeriodicity', function () {
                const tabPane = this.closest('.occurrence-tab-pane');
                if (tabPane) renderOccurrenceRows(tabPane);
            });
    });
}

function generateTabsFromOccurrence() {
    const previousPane = document.querySelector('.occurrence-tab-pane.active');
    const previousName = previousPane ? previousPane.dataset.occurrenceTab : '';
    const savedTabs = locatedTabs || (document.querySelector('.occurrence-tab-pane') ? getMaintenanceTypes() : []);
    if (!locatedTabs && savedTabs.length) window.currentMaintenanceSchedules = getScheduleRows();
    locatedTabs = null;

    occurrenceTabNames = createOccurrenceTabNames();
    generateTabs(savedTabs);
    if (previousName && occurrenceTabNames.indexOf(previousName) !== -1) openOccurrenceTab(previousName);
}

function getChecklistMarkup(checklistItems) {
    const selected = (checklistItems || []).map(item => String(item));
    const allSelected = maintenanceChecklistOptions.length > 0 && maintenanceChecklistOptions.every(option =>
        selected.includes(String(option.value)) || selected.includes(String(option.text)));
    const options = maintenanceChecklistOptions.map(function (option) {
        const checked = selected.includes(String(option.value)) || selected.includes(String(option.text)) ? 'checked' : '';
        return `<label class="maintenance-checklist-option">
                <input type="checkbox" class="maintenance-checkbox" value="${escapeHtml(option.value)}" ${checked} />
                <span>${escapeHtml(option.text)}</span>
            </label>`;
    }).join('');
    return `<label class="maintenance-checklist-option maintenance-checklist-select-all">
                <input type="checkbox" class="maintenance-checklist-select-all-input" ${allSelected ? 'checked' : ''} />
                <span>Select All</span>
            </label>
            <div class="maintenance-checklist-options">${options}</div>`;
}

function applyMaintenanceLookups() {
    const headerType = document.getElementById('ddlMaintenanceType');
    if (headerType) {
        const $select = $(headerType);
        const current = $select.val() || [];
        if ($select.hasClass('select2-hidden-accessible')) $select.select2('destroy');
        headerType.innerHTML = maintenanceTabNames.map(function (type) {
            return `<option value="${escapeHtml(type.value)}">${escapeHtml(type.text)}</option>`;
        }).join('');
        suppressMaintenanceTypeChange = true;
        $select.val(Array.isArray(current) ? current.filter(Boolean) : (current ? [current] : []));
        $select.select2({
            width: '100%',
            placeholder: 'Select Type',
            closeOnSelect: true,
            allowClear: true,
            dropdownParent: msmSelect2DropdownParent(),
            minimumResultsForSearch: Infinity
        });
        $select.off('select2:select.msmClose select2:unselect.msmClose')
            .on('select2:select.msmClose select2:unselect.msmClose', function () {
                $(this).select2('close');
            });
        suppressMaintenanceTypeChange = false;
    }

    document.querySelectorAll('.occurrence-type').forEach(function (select) {
        const current = select.value;
        select.innerHTML = '<option value="">Select Type</option>' + maintenanceTabNames.map(function (type) {
            return `<option value="${escapeHtml(type.value)}">${escapeHtml(type.text)}</option>`;
        }).join('');
        if (current) select.value = current;
    });

    document.querySelectorAll('.maintenance-checklist-menu').forEach(function (menu) {
        const selected = Array.from(menu.querySelectorAll('.maintenance-checkbox:checked')).map(item => item.value);
        menu.innerHTML = getChecklistMarkup(selected);
    });
    refreshChecklistButtons(document.getElementById('maintenanceTabContent'));
    generateTabsFromOccurrence();
}

function getOccurrenceScheduleMarkup(tabName, schedule) {
    const value = schedule || {};
    const matchedType = maintenanceTabNames.find(function (type) { return type.text === tabName; });
    const selectedType = String(value.MaintenanceType || (matchedType && matchedType.value) || value.Type || '');

    return `
        <div class="msm-step-card msm-tab-schedule" style="--step-clr:#667eea;">
            <div class="msm-step-header">
                <div class="msm-step-num">1</div>
                <span class="msm-step-title">${escapeHtml(tabName)} &mdash; Schedule</span>
                <i class="fas fa-calendar-alt msm-step-icon ms-auto" aria-hidden="true"></i>
            </div>
            <div class="msm-step-body">
                <div class="msm-schedule-entry-shell">
                    <div class="occurrence-fields" data-tab-name="${tabName}" style="display:flex !important;flex-direction:row !important;flex-wrap:nowrap !important;justify-content:flex-start !important;align-items:flex-end !important;gap:12px !important;width:auto !important;max-width:100% !important;margin:0 0 12px !important;">
                        <select class="occurrence-type" hidden>
                            <option value="">Select Type</option>
                            ${maintenanceTabNames.map(type =>
                                `<option value="${escapeHtml(type.value)}" ${selectedType === String(type.value) || selectedType === String(type.text) ? 'selected' : ''}>${escapeHtml(type.text)}</option>`
                            ).join('')}
                        </select>
                        <div class="occurrence-periodicity-group" style="display:flex !important;flex-direction:column !important;justify-content:flex-end !important;align-items:stretch !important;width:160px !important;max-width:160px !important;flex:0 0 160px !important;margin:0 !important;padding:0 !important;">
                            <label class="msm-field-lbl">Periodicity <span class="msm-req">*</span></label>
                            <select class="form-control form-control-sm box_border tab-periodicity">${periodicityOptionMarkup(value.Periodicity || '')}</select>
                        </div>
                        <div class="occurrence-occurrence-group" style="display:flex !important;flex-direction:column !important;justify-content:flex-end !important;align-items:stretch !important;width:160px !important;max-width:160px !important;flex:0 0 160px !important;margin:0 !important;padding:0 !important;">
                            <label class="msm-field-lbl">Occurrence <span class="msm-req">*</span></label>
                            <input type="text" class="form-control form-control-sm box_border numeric-only tab-occurrence" inputmode="numeric mb-1" maxlength="2" autocomplete="off" value="${escapeHtml(value.Occurrence ? value.Occurrence : '')}" />
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function getTabEmailMarkup(schedule) {
    const value = schedule || {};
    return `
        <div class="msm-step-card msm-tab-email" style="--step-clr:#0ea5e9;">
            <div class="msm-step-header">
                <div class="msm-step-num" style="background:#0ea5e9;">3</div>
                <span class="msm-step-title">Email / Notifications</span>
                <i class="fas fa-envelope msm-step-icon ms-auto" style="color:#0ea5e9;" aria-hidden="true"></i>
            </div>
            <div class="msm-step-body">
            <div class="email-row">
                <div>
                    <label class="maintenance-label">Recipients <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm email-entry tab-recipients" placeholder="Enter recipient"
                           autocomplete="off" value="${escapeHtml(value.Recipients || '')}" />
                </div>
                <div>
                    <label class="maintenance-label">Estimated day for starting mail <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm numeric-only tab-estimated-days" inputmode="numeric" maxlength="3" autocomplete="off"
                           title="Enter days 1 to 366" value="${escapeHtml(value.EstimatedStartDate || '')}" />
                </div>
                <div>
                    <label class="maintenance-label">Escalation mail id <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm email-entry tab-escalation-mail" placeholder="Enter escalation id"
                           autocomplete="off" value="${escapeHtml(value.EscalationMail || '')}" />
                </div>
                <div>
                    <label class="maintenance-label">Escalation gap for mail (days) <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-sm numeric-only tab-escalation-gap" inputmode="numeric" maxlength="3" autocomplete="off"
                           title="Enter days 1 to 366" value="${escapeHtml(value.EscalationGap || '')}" />
                </div>
            </div>
            </div>
        </div>`;
}

function getItemsMarkup(tabName) {
    return `<div class="msm-step-card msm-tab-items" style="--step-clr:#10b981;">
            <div class="msm-step-header">
                <div class="msm-step-num" style="background:#10b981;">2</div>
                <span class="msm-step-title">Item Details</span>
                <button type="button" class="msm-add-item-btn ms-auto" onclick="addItemRow('${escapeJs(tabName)}')">
                    <i class="fas fa-plus me-1" aria-hidden="true"></i>Add Item
                </button>
            </div>
            <div class="msm-step-body" style="padding-top:10px;">
            <div class="table-responsive">
            <table class="maintenance-table msm-items-grid">
            <thead><tr><th class="col-sno">#</th><th>Item Code</th><th>Item Name <span class="msm-head-req">*</span></th><th class="col-qty">Qty</th><th class="col-action">Action</th><th class="col-delete"></th></tr></thead>
            <tbody id="items-${tabName}">${createItemRowMarkup(tabName, 0)}</tbody>
            </table>
        </div>
        </div>
        </div>`;
}

function addItemRow(tabName) {
    const tbody = document.getElementById(`items-${tabName}`);
    tbody.insertAdjacentHTML('beforeend', createItemRowMarkup(tabName, tbody.rows.length));
    updateDeleteButtons(tbody);
}

function createItemRowMarkup(tabName, index, item) {
    const value = item || {};
    const itemMasterCode = value.ItemMaster_Code || value.itemMaster_Code || value.Code || '';
    const itemCode = value.ItemCode || value.itemCode || '';
    const itemName = value.ItemName || value.itemName || value.Desp || '';
    const action = value.Action || value.action || '';
    return `<tr data-action="${escapeHtml(action)}" data-item-master-code="${escapeHtml(itemMasterCode)}" data-item-code="${escapeHtml(itemCode)}" data-item-name="${escapeHtml(itemName)}">
            <td>${index + 1}</td>
            <td><input type="text" class="form-control form-control-sm item-code item-lookup" placeholder="-- Select Item --" autocomplete="off" value="${escapeHtml(itemCode)}" /></td>
            <td><input type="text" class="form-control form-control-sm item-name item-lookup" placeholder="-- Select Item --" autocomplete="off" value="${escapeHtml(itemName)}" /></td>
            <td><input type="text" class="form-control form-control-sm item-quantity numeric-only" inputmode="numeric" autocomplete="off" value="${value.Quantity || value.qty || ''}" /></td>
            <td class="item-actions">
                <select class="item-action-select" onchange="setItemAction(this, this.value)">
                    ${actionOptionMarkup(action)}
                </select>
            </td>
            <td>
                <button type="button" class="item-delete-button" onclick="removeItemRow(this)" title="Delete item" aria-label="Delete item">
                    <i class="fas fa-trash-alt" aria-hidden="true"></i>
                </button>
            </td>
        </tr>`;
}

function generateTabs(tabData) {
    const tabs = document.getElementById('maintenanceTabs');
    const content = document.getElementById('maintenanceTabContent');
    if (!tabs || !content) return;

    const data = tabData || [];
    const schedules = window.currentMaintenanceSchedules || [];

    if (!occurrenceTabNames.length) {
        tabs.innerHTML = '';
        content.innerHTML = '<div class="msm-tab-empty">Select one or more maintenance types above to open a tab for each type.</div>';
        return;
    }

    const showCopy = occurrenceTabNames.length > 1;
    tabs.innerHTML = occurrenceTabNames.map((name, index) => `
            <button type="button" role="tab" class="maintenance-tab ${index === 0 ? 'active' : ''}" aria-selected="${index === 0 ? 'true' : 'false'}" onclick="openOccurrenceTab('${escapeJs(name)}')">${escapeHtml(name)}</button>`).join('')
        + (showCopy ? `<div class="msm-copy-wrap">
            <button type="button" class="msm-copy-tab-btn" onclick="toggleCopySchedulePanel(event)" title="Copy schedule data between maintenance types"><i class="fas fa-copy" aria-hidden="true"></i> Copy</button>
            <div id="msmCopyPanel" class="msm-copy-panel" hidden>
                <div class="msm-copy-panel-title">Copy schedule data</div>
                <label for="ddlCopyFrom">From</label>
                <select id="ddlCopyFrom" class="form-select form-select-sm" onchange="syncCopyTargetOptions()"></select>
                <label for="ddlCopyTo">To</label>
                <select id="ddlCopyTo" class="form-select form-select-sm"></select>
                <div class="msm-copy-panel-actions">
                    <button type="button" class="msm-copy-cancel" onclick="closeCopySchedulePanel()">Cancel</button>
                    <button type="button" class="msm-copy-apply" onclick="confirmCopySchedule()">Copy</button>
                </div>
            </div>
        </div>` : '');

    content.innerHTML = occurrenceTabNames.map((occurrenceName, occurrenceIndex) => {
        const sameType = function (item) {
            if (!item) return false;
            const typeName = String(item.Type || item.Tab || '');
            return typeName === occurrenceName || typeName === occurrenceName + '-Major';
        };
        const merged = Object.assign({}, schedules.find(sameType) || {}, data.find(sameType) || {});
        return `
            <section id="occurrence-pane-${occurrenceIndex + 1}" role="tabpanel" class="occurrence-tab-pane ${occurrenceIndex === 0 ? 'active' : ''}" data-occurrence-tab="${escapeHtml(occurrenceName)}">
                ${getOccurrenceScheduleMarkup(occurrenceName, merged)}
                ${getItemsMarkup(occurrenceName)}
                ${getTabEmailMarkup(merged)}
            </section>`;
    }).join('');

    content.querySelectorAll('tbody').forEach(updateDeleteButtons);

    const savedByType = {};
    data.forEach(saved => {
        if (!saved || !saved.Type) return;
        if (!savedByType[saved.Type]) savedByType[saved.Type] = [];
        savedByType[saved.Type].push(saved);
        const pane = content.querySelector(`.occurrence-tab-pane[data-occurrence-tab="${saved.Type}"]`)
            || content.querySelector(`.occurrence-tab-pane[data-occurrence-tab="${String(saved.Type).split('-')[0]}"]`);
        if (!pane) return;
        const items = saved.Items || [];
        const tbody = pane.querySelector('tbody');
        if (!tbody || tbody.dataset.itemsApplied === 'Y') return;
        tbody.dataset.itemsApplied = 'Y';
        tbody.innerHTML = items.length ? items.map((item, index) => createItemRowMarkup(saved.Type, index, item)).join('') : createItemRowMarkup(saved.Type, 0);
        updateDeleteButtons(tbody);
    });
    applyTabPeriodicityLookups();
    content.querySelectorAll('.occurrence-tab-pane').forEach(renderOccurrenceRows);
    Object.keys(savedByType).forEach(function (type) {
        const pane = content.querySelector(`.occurrence-tab-pane[data-occurrence-tab="${type}"]`)
            || content.querySelector(`.occurrence-tab-pane[data-occurrence-tab="${String(type).split('-')[0]}"]`);
        if (!pane) return;
        const generated = pane.querySelectorAll('.occurrence-generated-row');
        const entries = savedByType[type];
        const tabWithRows = entries.length === 1 && entries[0].Rows && entries[0].Rows.length ? entries[0] : null;
        const fromRows = tabWithRows ? placeSavedChecklistRows(tabWithRows.Rows, generated.length) : null;
        generated.forEach(function (row, index) {
            const saved = fromRows ? null : (entries[index] || null);
            const savedRow = fromRows ? fromRows[index] : null;
            const checklist = savedRow
                ? (savedRow.checklist || [])
                : (saved ? (saved.ChecklistItems || saved.checklist || []) : []);
            const dayValue = savedRow
                ? String(savedRow.day || '')
                : (saved ? String(saved.Day != null && saved.Day !== '' ? saved.Day : (saved.day || '')) : '');
            const monthValue = savedRow
                ? String(savedRow.month || '')
                : (saved ? String(saved.Month || saved.month || '') : '');
            const menu = row.querySelector('.maintenance-checklist-menu');
            if (menu && checklist.length) menu.innerHTML = getChecklistMarkup(checklist);
            const dayInput = row.querySelector('.occurrence-day');
            if (dayInput && dayValue && dayValue !== '0') {
                dayInput.value = dayValue;
                applyDayLimit(dayInput, false);
            }
            const monthSelect = row.querySelector('.occurrence-month');
            if (monthSelect && monthValue && !/^\d+$/.test(monthValue)) monthSelect.value = monthValue;
        });
        refreshChecklistButtons(pane);
    });
    syncHeaderMaintenanceType();
    if (itemList.length || itemNameList.length) applyItemLookups();
    if (actionList.length) applyActionLookups();
}

function findOccurrencePane(name) {
    const key = String(name || '').trim().toLowerCase();
    return Array.from(document.querySelectorAll('.occurrence-tab-pane')).find(function (pane) {
        return String(pane.dataset.occurrenceTab || '').trim().toLowerCase() === key;
    }) || null;
}

function readPaneScheduleSnapshot(pane) {
    return {
        periodicity: panePeriodicity(pane),
        occurrence: String((pane.querySelector('.tab-occurrence') || {}).value || ''),
        rows: Array.from(pane.querySelectorAll('.occurrence-generated-row')).map(function (row) {
            const dayInput = row.querySelector('.occurrence-day');
            const monthInput = row.querySelector('.occurrence-month');
            const monthOption = monthInput && monthInput.options && monthInput.selectedIndex >= 0 ? monthInput.options[monthInput.selectedIndex] : null;
            return {
                day: dayInput ? dayInput.value : '',
                month: monthInput ? monthInput.value : '',
                monthText: monthOption ? String(monthOption.text || '').trim() : '',
                checklist: Array.from(row.querySelectorAll('.maintenance-checkbox:checked')).map(function (item) { return item.value; })
            };
        }),
        items: Array.from(pane.querySelectorAll('.msm-tab-items tbody tr')).map(readItemRow).filter(function (item) {
            return item.ItemMaster_Code || item.ItemCode || item.ItemName || item.Quantity > 0 || item.Action;
        }),
        email: tabEmailValues(pane)
    };
}

function applyCopiedMonth(monthInput, saved) {
    if (!monthInput || !saved) return;
    if (saved.month) monthInput.value = saved.month;
    if (monthInput.value === saved.month) return;
    Array.from(monthInput.options || []).some(function (option) {
        if (String(option.text || '').trim() !== saved.monthText) return false;
        monthInput.value = option.value;
        return true;
    });
}

function copyTypeOptionMarkup(names) {
    return (names || []).map(function (name) {
        return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
    }).join('');
}

function closeCopySchedulePanel() {
    const panel = document.getElementById('msmCopyPanel');
    if (panel) panel.hidden = true;
}

function syncCopyTargetOptions() {
    const from = document.getElementById('ddlCopyFrom');
    const to = document.getElementById('ddlCopyTo');
    if (!from || !to) return;
    const current = to.value;
    const targets = occurrenceTabNames.filter(function (name) { return name !== from.value; });
    to.innerHTML = copyTypeOptionMarkup(targets);
    if (targets.indexOf(current) !== -1) to.value = current;
    else if (targets.length) to.value = targets[0];
}

function toggleCopySchedulePanel(event) {
    if (event) event.stopPropagation();
    const form = document.getElementById('dvFromNEW');
    if (form && form.classList.contains('msm-view-mode')) return;
    const panel = document.getElementById('msmCopyPanel');
    if (!panel) return;
    if (!panel.hidden) {
        panel.hidden = true;
        return;
    }
    const from = document.getElementById('ddlCopyFrom');
    if (!from) return;
    from.innerHTML = copyTypeOptionMarkup(occurrenceTabNames);
    const activePane = document.querySelector('.occurrence-tab-pane.active');
    const activeName = activePane ? activePane.dataset.occurrenceTab : '';
    if (activeName && occurrenceTabNames.indexOf(activeName) !== -1) from.value = activeName;
    syncCopyTargetOptions();
    panel.hidden = false;
}

function paneHasScheduleData(pane) {
    const data = readPaneScheduleSnapshot(pane);
    const email = data.email || {};
    if (data.periodicity && data.periodicity !== '0') return true;
    if (data.occurrence && data.occurrence !== '0') return true;
    if (data.items.length) return true;
    if (email.Recipients || email.EstimatedStartDate || email.EscalationMail || email.EscalationGap) return true;
    return data.rows.some(function (row) {
        return (row.day && row.day !== '0') || (row.month && row.month !== '0') || (row.checklist && row.checklist.length);
    });
}

function confirmCopySchedule() {
    const fromEl = document.getElementById('ddlCopyFrom');
    const toEl = document.getElementById('ddlCopyTo');
    const from = fromEl ? fromEl.value : '';
    const to = toEl ? toEl.value : '';
    if (!from || !to) {
        toastr.warning('Select the maintenance types to copy from and to.');
        return;
    }
    if (from === to) {
        toastr.warning('Choose a different maintenance type to copy into.');
        return;
    }
    const target = findOccurrencePane(to);
    if (target && paneHasScheduleData(target)) {
        if (!window.confirm('Copy ' + from + ' data to ' + to + '? Existing ' + to + ' data will be replaced.')) return;
    }
    if (copyOccurrenceSchedule(from, to)) closeCopySchedulePanel();
}

function copyMajorScheduleToMinor() {
    copyOccurrenceSchedule('Major', 'Minor');
}

function copyOccurrenceSchedule(sourceName, targetName) {
    if (document.getElementById('dvFromNEW') && document.getElementById('dvFromNEW').classList.contains('msm-view-mode')) return false;
    const source = findOccurrencePane(sourceName);
    const target = findOccurrencePane(targetName);
    if (!source || !target) {
        toastr.warning('Select both maintenance types before copying.');
        return false;
    }
    const data = readPaneScheduleSnapshot(source);
    const periodicity = target.querySelector('.tab-periodicity');
    const occurrence = target.querySelector('.tab-occurrence');
    if (periodicity) {
        periodicity.value = data.periodicity || '';
        const $periodicity = $(periodicity);
        if ($periodicity.hasClass('select2-hidden-accessible')) $periodicity.val(periodicity.value).trigger('change.select2');
    }
    if (occurrence) occurrence.value = data.occurrence || '';
    renderOccurrenceRows(target);
    const generated = target.querySelectorAll('.occurrence-generated-row');
    data.rows.forEach(function (saved, index) {
        const row = generated[index];
        if (!row) return;
        applyCopiedMonth(row.querySelector('.occurrence-month'), saved);
        const dayInput = row.querySelector('.occurrence-day');
        if (dayInput) {
            dayInput.value = saved.day && saved.day !== '0' ? saved.day : '';
            applyDayLimit(dayInput, false);
        }
        const menu = row.querySelector('.maintenance-checklist-menu');
        if (menu) menu.innerHTML = getChecklistMarkup(saved.checklist || []);
    });
    refreshChecklistButtons(target);

    const tabName = target.dataset.occurrenceTab || targetName;
    const tbody = document.getElementById('items-' + tabName) || target.querySelector('.msm-tab-items tbody');
    if (tbody) {
        tbody.innerHTML = data.items.length
            ? data.items.map(function (item, index) { return createItemRowMarkup(tabName, index, item); }).join('')
            : createItemRowMarkup(tabName, 0);
        updateDeleteButtons(tbody);
        applyItemLookups();
        applyActionLookups();
    }

    const email = data.email || {};
    const setValue = function (selector, value) {
        const input = target.querySelector(selector);
        if (input) input.value = value || '';
    };
    setValue('.tab-recipients', email.Recipients);
    setValue('.tab-estimated-days', email.EstimatedStartDate);
    setValue('.tab-escalation-mail', email.EscalationMail);
    setValue('.tab-escalation-gap', email.EscalationGap);

    openOccurrenceTab(tabName);
    toastr.success(sourceName + ' data copied to ' + targetName + '.');
    return true;
}

function openOccurrenceTab(name) {
    document.querySelectorAll('.maintenance-tab').forEach(function (button) {
        const active = button.textContent.trim() === name;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.occurrence-tab-pane').forEach(function (pane) {
        pane.classList.toggle('active', pane.dataset.occurrenceTab === name);
    });
    syncHeaderMaintenanceType();
}

function syncHeaderMaintenanceType() {
    document.querySelectorAll('.occurrence-tab-pane').forEach(function (pane) {
        const matched = maintenanceTabNames.find(function (type) {
            return type.text === pane.dataset.occurrenceTab;
        });
        const paneType = pane.querySelector('.occurrence-type');
        if (matched && paneType) paneType.value = matched.value;
    });
}

function clearItemRow(button) {
    const row = button.closest('tr');
    row.querySelectorAll('input').forEach(input => input.value = '');
    row.dataset.action = '';
    const select = row.querySelector('.item-action-select');
    if (select) select.value = '';
}

function setItemAction(button, action) {
    const row = button.closest('tr');
    row.dataset.action = action;
    const select = row.querySelector('.item-action-select');
    if (select) select.value = action;

    if (action === 'Clear') {
        row.querySelectorAll('input').forEach(input => input.value = '');
        row.dataset.action = '';
        if (select) select.value = '';
    }
}

function removeItemRow(button) {
    const row = button.closest('tr');
    const tbody = row.closest('tbody');
    if (tbody.rows.length <= 1) return;

    row.remove();
    Array.from(tbody.rows).forEach((itemRow, index) => {
        itemRow.cells[0].textContent = index + 1;
    });
    updateDeleteButtons(tbody);
}

function updateDeleteButtons(tbody) {
    const disabled = tbody.rows.length <= 1;
    tbody.querySelectorAll('.item-delete-button').forEach(button => {
        button.disabled = disabled;
        button.title = disabled ? 'At least one item row is required' : 'Delete item';
    });
}

Object.assign(window, {
    CreateNew,
    View,
    BackMaster,
    SaveMachineMaintenance,
    LocateMaintenanceSchedule,
    Edit,
    Delete,
    SaveModalDelete,
    CloseModalDelete,
    addItemRow,
    openOccurrenceTab,
    toggleCopySchedulePanel,
    closeCopySchedulePanel,
    syncCopyTargetOptions,
    confirmCopySchedule,
    copyOccurrenceSchedule,
    copyMajorScheduleToMinor,
    setItemAction,
    removeItemRow
});
