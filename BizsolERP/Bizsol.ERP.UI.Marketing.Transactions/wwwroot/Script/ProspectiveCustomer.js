import { ProspectiveCustomerService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ProspectiveCustomerService.js';
import { ExpenseEntryService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/ExpenseEntryService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

// Preserve native URL constructor before it gets shadowed by service file
var OriginalURLConstructor = null;
if (typeof window !== 'undefined' && typeof window.URL === 'function') {
    OriginalURLConstructor = window.URL;
}

// Helper function to restore URL constructor
function restoreURLConstructor() {
    if (OriginalURLConstructor && typeof OriginalURLConstructor === 'function') {
        try {
            window.URL = OriginalURLConstructor;
        } catch (e) {
            // If window.URL is read-only, try to restore via delete
            try {
                delete window.URL;
                window.URL = OriginalURLConstructor;
            } catch (e2) {
                // If still fails, define it
                Object.defineProperty(window, 'URL', {
                    value: OriginalURLConstructor,
                    writable: true,
                    configurable: true
                });
            }
        }
    }
}

// Restore immediately after imports
restoreURLConstructor();

// Periodically restore URL constructor to prevent it from being shadowed
setInterval(function() {
    restoreURLConstructor();
}, 100);

var G_MarketingManList = [];
var G_ProspectiveCustomerRows = [];
var G_SuppressSave = false;

$(document).ready(function () {
    // Ensure URL constructor is available
    restoreURLConstructor();
    BizSolHelperFunction.setHeadingFromQueryParam("#ERPHeading", "ModuleDesp");

    hookProspectiveCustomerGridRender();
    GetNestedMarketingManList();
    GetClosedByMarketingManList();
    GetThichnessList();
    GetSizeList();
    GetGradeList();
    GetISCodeList();
    $("#btnShow").click(function () {
        GetProspectiveCustomerList();
    });
});
function GetNestedMarketingManList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetNestedMarketingManList().then(function (response) {
        if (response && response.length > 0) {
            let matchedPersonName = null;
            let marketingList = [];

            try {
                var authKeyStr = sessionStorage.getItem('authKey');
                var userMaster_Code = null;
                if (authKeyStr) {
                    var authKey = JSON.parse(authKeyStr);
                    userMaster_Code = authKey ? authKey.UserMaster_Code : null;
                }
            } catch (e) {
                console.error('Error parsing authKey:', e);
                userMaster_Code = null;
            }

            G_MarketingManList = [];
            for (let i = 0; i < response.length; i++) {
                const person = response[i];

                if (person && person.PersonName) {
                    if (userMaster_Code && person.Usermaster_Code == userMaster_Code) {
                        matchedPersonName = person.PersonName;
                    }

                    marketingList.push({
                        Code: person.PersonName,
                        Desp: person.PersonName
                    });

                    var mmCode = person.Code != null ? person.Code : (person.MarketingManMaster_Code != null ? person.MarketingManMaster_Code : 0);
                    G_MarketingManList.push({
                        Code: mmCode,
                        Desp: person.PersonName
                    });
                }
            }

            BindSelectList1($('#ddlMarketingMan')[0], marketingList);
            $('#ddlMarketingMan option[value="0"]').val("ALL");
            $('#ddlMarketingMan').select2({
                width: '-webkit-fill-available'
            });

            // Set default marketing man value
            try {
                var urlMarketingMan = '';
                if (typeof getUrlVars === 'function') {
                    var urlParams = getUrlVars();
                    urlMarketingMan = decodeURIComponent(urlParams['MarketingMan_Name'] || "");
                }
                if (!urlMarketingMan || urlMarketingMan === '') {
                    if (matchedPersonName) {
                        $('#ddlMarketingMan').val(matchedPersonName);
                    } else {
                        $('#ddlMarketingMan').val("ALL");
                    }
                } else {
                    $('#ddlMarketingMan').val(urlMarketingMan);
                }
            } catch (_) { $('#ddlMarketingMan').val("ALL"); }

        } else {
            toastr.error('No Data Found');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        console.error('Error loading marketing person list:', error);
        toastr.error('Error loading sales person list');
        restoreURLConstructor();
    });
}
function GetClosedByMarketingManList() {
    restoreURLConstructor();
    return ExpenseEntryService.GetNestedMarketingManList().then(function (response) {
        var rows = [];
        if (Array.isArray(response)) {
            rows = response;
        } else if (response && Array.isArray(response.Data)) {
            rows = response.Data;
        } else if (response && Array.isArray(response.data)) {
            rows = response.data;
        }
        G_MarketingManList = [];
        for (var i = 0; i < rows.length; i++) {
            var person = rows[i];
            if (!person) continue;
            var personName = person.PersonName || person.personName || person.Desp || '';
            if (!personName) continue;
            var mmCode = person.Code != null ? person.Code : (person.MarketingManMaster_Code != null ? person.MarketingManMaster_Code : 0);
            G_MarketingManList.push({
                Code: mmCode,
                Desp: String(personName).trim()
            });
        }
        if ($('#table-body-ProspectiveCustomer tr').length) {
            injectClosedRowControls();
        }
        restoreURLConstructor();
        return G_MarketingManList;
    }).catch(function (error) {
        console.error('Error loading Closed By marketing man list:', error);
        restoreURLConstructor();
        return [];
    });
}
function GetThichnessList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetThichnessList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlThikness')[0], response.map((item) => ({ Code: item.Code, Desp: item.desp })));

            $('#ddlThikness').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
        restoreURLConstructor();
    });
}
function GetSizeList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetSizeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlSize')[0], response.map((item) => ({ Code: item.Code, Desp: item.desp })));

            $('#ddlSize').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
        restoreURLConstructor();
    });
}
function GetGradeList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetGradeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlGrade')[0], response.map((item) => ({ Code: item.Code, Desp: item.desp })));

            $('#ddlGrade').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
        restoreURLConstructor();
    });
}
function GetISCodeList() {
    restoreURLConstructor();
    ProspectiveCustomerService.GetISCodeList().then(function (response) {
        if (response && response.length > 0) {
            BindSelectList1($('#ddlISCode')[0], response.map((item) => ({ Code: item.Code, Desp: item.desp })));

            $('#ddlISCode').select2({
                width: '-webkit-fill-available'
            });
        } else {
            toastr.error('No data received or empty response');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        toastr.error('Error fetching user list:', error);
        restoreURLConstructor();
    });
}
function GetProspectiveCustomerList() {
    restoreURLConstructor();
    hookProspectiveCustomerGridRender();
    var MarketingPersonName = $("#ddlMarketingMan").val() || 'ALL';
    var Thikness = $("#ddlThikness").val();
    var Size = $("#ddlSize").val();
    var Grade = $("#ddlGrade").val();
    var ISCode = $("#ddlISCode").val();
    var Status = $("#txtStatus").val();
    Showloader();
    var listReady = G_MarketingManList.length ? Promise.resolve(G_MarketingManList) : GetClosedByMarketingManList();
    listReady.then(function () {
    ProspectiveCustomerService.GetProspectiveCustomerList(MarketingPersonName, Thikness, Size, Grade, ISCode, Status).then(function (response) {
        HideLoader();
        if (response.length > 0) {
            $('#ProspectiveCustomer').show();
            G_ProspectiveCustomerRows = response.map(function (item, index) {
                return Object.assign({}, item, { __RowIndex: index });
            });
            const StringFilterColumn = ["Marketing Person", "Customer Name", "Contact Person", "Contact No", "Email", "Sagment", "Nation", "City", "State", "Payment Term", "Volume", "Created By", "Updated By"];
            const NumericFilterColumn = [];
            const DateFilterColumn = [];
            const Button = false;
            const showButtons = [];
            const StringdoubleFilterColumn = [];
            const hiddenColumns = ["Code", "ClosedBy", "__RowIndex"];
            const ColumnAlignment = {};

            G_SuppressSave = true;
            BizsolCustomFilterGrid.CreateDataTable("table-header-ProspectiveCustomer", "table-body-ProspectiveCustomer", G_ProspectiveCustomerRows, Button, showButtons, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn, hiddenColumns, ColumnAlignment, false);
            injectClosedRowControls();
            setTimeout(function () { G_SuppressSave = false; }, 0);
        } else {
            HideLoader();
            G_ProspectiveCustomerRows = [];
            $('#ProspectiveCustomer').hide();
            toastr.error('No Data Found');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        HideLoader();
        $('#ProspectiveCustomer').hide();
        toastr.error('Error loading prospective customer data');
        console.error('Error:', error);
        restoreURLConstructor();
    });
    }).catch(function (error) {
        HideLoader();
        toastr.error('Error loading Closed By list');
        console.error('Error:', error);
        restoreURLConstructor();
    });
}
function BindSelectList1(element, list) {
    let option = '<option value="0">ALL</option>';
    $.each(list, function (key, val) {
        option += '<option value="' + val.Code + '">' + val.Desp + '</option>';
    });
    element.innerHTML = option;
}

function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatYmd(dateObj) {
    var y = dateObj.getFullYear();
    var m = String(dateObj.getMonth() + 1).padStart(2, '0');
    var d = String(dateObj.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

function toDateInputValue(value) {
    if (value === null || value === undefined || value === '') return '';
    if (value instanceof Date && !isNaN(value.getTime())) {
        return formatYmd(value);
    }
    if (typeof value === 'string') {
        var msMatch = value.match(/\/Date\((-?\d+)\)\//);
        if (msMatch) {
            var fromTicks = new Date(parseInt(msMatch[1], 10));
            return isNaN(fromTicks.getTime()) ? '' : formatYmd(fromTicks);
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return value.substring(0, 10);
        }
        var monMatch = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
        if (monMatch) {
            var months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
            var monthNum = months[monMatch[2]];
            if (monthNum) {
                return monMatch[3] + '-' + monthNum + '-' + String(monMatch[1]).padStart(2, '0');
            }
        }
        var parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            return formatYmd(parsed);
        }
    }
    return '';
}

function getClosedByOptionsHtml(selectedCode, selectedName) {
    var option = '<option value="0">Select</option>';
    for (var i = 0; i < G_MarketingManList.length; i++) {
        var item = G_MarketingManList[i];
        var optionValue = item.Code && parseInt(item.Code, 10) > 0 ? item.Code : item.Desp;
        var isSelected = false;
        if (selectedCode && parseInt(selectedCode, 10) > 0 && String(item.Code) === String(selectedCode)) {
            isSelected = true;
        } else if (selectedName && String(item.Desp).trim() === String(selectedName).trim()) {
            isSelected = true;
        }
        option += '<option value="' + escapeHtml(optionValue) + '"' + (isSelected ? ' selected' : '') + '>' + escapeHtml(item.Desp) + '</option>';
    }
    return option;
}

function buildClosedBySelectHtml(rowIndex, rowCode, selectedCode, selectedName) {
    return '<select class="form-control form-control-sm box_border ddl-closed-by" id="ddlClosedBy_' + rowIndex + '" onchange="SaveClosedDetails(' + rowIndex + ',' + rowCode + ')">' +
        getClosedByOptionsHtml(selectedCode, selectedName) +
        '</select>';
}

function buildClosedDateInputHtml(rowIndex, rowCode, closedDate) {
    return '<input type="date" class="form-control form-control-sm box_border txt-closed-date" id="txtClosedDate_' + rowIndex + '" value="' + escapeHtml(closedDate) + '" onchange="SaveClosedDetails(' + rowIndex + ',' + rowCode + ')" />';
}

function getHeaderLabel($th) {
    var heading = $th.find('.filter-table-heading').first().text();
    return String(heading || $th.text() || '').replace(/\s+/g, ' ').trim();
}

function findColumnIndex(labels) {
    var idx = -1;
    var wanted = (labels || []).map(function (l) {
        return String(l).replace(/\s+/g, ' ').trim().toLowerCase();
    });
    $('#table-header-ProspectiveCustomer th').each(function (i) {
        var label = getHeaderLabel($(this)).toLowerCase();
        if (wanted.indexOf(label) >= 0) {
            idx = i;
            return false;
        }
    });
    return idx;
}

function hideColumnsByExactHeader(labels) {
    var wanted = (labels || []).map(function (l) {
        return String(l).replace(/\s+/g, ' ').trim().toLowerCase();
    });
    $('#table-header-ProspectiveCustomer th').each(function (i) {
        var label = getHeaderLabel($(this)).toLowerCase();
        if (wanted.indexOf(label) >= 0) {
            $(this).hide();
            $('#table-body-ProspectiveCustomer tr').each(function () {
                $(this).children('td').eq(i).hide();
            });
        }
    });
}

function pickRowField(row, keys, fallback) {
    if (!row) return fallback;
    for (var i = 0; i < keys.length; i++) {
        if (row[keys[i]] !== undefined && row[keys[i]] !== null && row[keys[i]] !== '') {
            return row[keys[i]];
        }
    }
    return fallback;
}

function injectClosedRowControls() {
    var closedByIdx = findColumnIndex(['Closed By']);
    var closedDateIdx = findColumnIndex(['Closed Date']);
    hideColumnsByExactHeader(['ClosedBy', 'Code', '__RowIndex']);

    if (closedByIdx < 0 && closedDateIdx < 0) {
        return;
    }

    G_SuppressSave = true;
    try {
        $('#table-body-ProspectiveCustomer tr').each(function () {
            var $tr = $(this);
            var dataIndex = parseInt($tr.attr('data-index'), 10);
            if (isNaN(dataIndex)) {
                dataIndex = $tr.index();
            }
            var row = (G_ProspectiveCustomerRows && G_ProspectiveCustomerRows[dataIndex]) ? G_ProspectiveCustomerRows[dataIndex] : {};
            var rowCode = parseInt(pickRowField(row, ['Code'], 0), 10) || 0;
            var closedByCode = pickRowField(row, ['ClosedBy'], 0);
            var closedByName = pickRowField(row, ['Closed By'], '');
            var closedDate = toDateInputValue(pickRowField(row, ['Closed Date', 'ClosedDate'], ''));

            if (closedByIdx >= 0) {
                $tr.children('td').eq(closedByIdx).html(buildClosedBySelectHtml(dataIndex, rowCode, closedByCode, closedByName));
            }
            if (closedDateIdx >= 0) {
                $tr.children('td').eq(closedDateIdx).html(buildClosedDateInputHtml(dataIndex, rowCode, closedDate));
            }
        });
    } finally {
        setTimeout(function () { G_SuppressSave = false; }, 0);
    }
}

function hookProspectiveCustomerGridRender() {
    if (window.__pcRenderTableHooked || typeof window.renderTable !== 'function') {
        return;
    }
    var originalRenderTable = window.renderTable;
    window.renderTable = function (items, bodyId, skipTotalRow) {
        originalRenderTable(items, bodyId, skipTotalRow);
        if (bodyId === 'table-body-ProspectiveCustomer') {
            injectClosedRowControls();
        }
    };
    window.__pcRenderTableHooked = true;
}

function SaveClosedDetails(index, code) {
    restoreURLConstructor();
    if (G_SuppressSave) {
        return;
    }
    var closedByVal = ($('#ddlClosedBy_' + index).val() || '').toString().trim();
    var closedDate = ($('#txtClosedDate_' + index).val() || '').toString().trim();
    if (!closedByVal || closedByVal === '0' || !closedDate) {
        return;
    }

    var closedByCode = parseInt(closedByVal, 10);
    var closedByName = $('#ddlClosedBy_' + index + ' option:selected').text();
    if (isNaN(closedByCode) || closedByCode <= 0) {
        var matched = G_MarketingManList.filter(function (item) {
            return String(item.Desp).trim() === closedByVal || String(item.Desp).trim() === String(closedByName).trim();
        })[0];
        closedByCode = matched && matched.Code ? parseInt(matched.Code, 10) : 0;
        if (!closedByName || closedByName === 'Select') {
            closedByName = closedByVal;
        }
    }
    if ((!closedByCode || closedByCode <= 0) && (!closedByName || closedByName === 'Select')) {
        toastr.error('Please select Closed By');
        return;
    }

    Showloader();
    ProspectiveCustomerService.SaveClosedDetails(code, closedByCode || 0, closedDate, closedByName).then(function (response) {
        HideLoader();
        if (response) {
            if (Array.isArray(response) && response.length > 0) {
                response = response[0];
            }
            var msg = response.Message || response.Msg || '';
            if (response.Status === 'Y') {
                if (G_ProspectiveCustomerRows && G_ProspectiveCustomerRows[index]) {
                    G_ProspectiveCustomerRows[index].ClosedBy = closedByCode;
                    G_ProspectiveCustomerRows[index]['Closed Date'] = closedDate;
                    var selectedText = $('#ddlClosedBy_' + index + ' option:selected').text();
                    G_ProspectiveCustomerRows[index]['Closed By'] = selectedText;
                }
                toastr.success(msg || 'Closed details updated successfully');
            } else {
                toastr.error(msg || 'Save failed');
            }
        } else {
            toastr.error('No response received');
        }
        restoreURLConstructor();
    }).catch(function (error) {
        HideLoader();
        toastr.error('Error saving closed details');
        console.error('Error:', error);
        restoreURLConstructor();
    });
}

$(document).on('click', '[onclick*="applyStringFilters"], [onclick*="applyNumericFilter"], [onclick*="applyfilterdate"], [onclick*="ClearFilter"]', function () {
    setTimeout(function () {
        injectClosedRowControls();
    }, 300);
});

window.GetProspectiveCustomerList = GetProspectiveCustomerList;
window.GetNestedMarketingManList = GetNestedMarketingManList;
window.SaveClosedDetails = SaveClosedDetails;
