import { CompanyInformationService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/CompanyInformationService.js';

var G_CI_Mode = 'list';
var G_CI_Rows = [];

function firstPayloadArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.Data)) return payload.Data;
    return [];
}

function firstCompanyRecord(payload) {
    if (!payload) return null;
    if (payload.Code != null || payload.code != null) return payload;
    if (payload.Data && (payload.Data.Code != null || payload.Data.code != null)) return payload.Data;
    if (payload.data && (payload.data.Code != null || payload.data.code != null)) return payload.data;
    return null;
}

function showModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            window.bootstrap.Modal.getOrCreateInstance(el).show();
        } else {
            $('#' + id).modal('show');
        }
    } catch (e) {
        $('#' + id).modal('show');
    }
}

function hideModal(id) {
    try {
        const el = document.getElementById(id);
        if (window.bootstrap && window.bootstrap.Modal) {
            const m = window.bootstrap.Modal.getInstance(el);
            if (m) m.hide();
        } else {
            $('#' + id).modal('hide');
        }
    } catch (e) {
        $('#' + id).modal('hide');
    }
}

function showCompanyListView() {
    $('#dvCompanyEntry').hide();
    $('#dvCompanyList').show();
    G_CI_Mode = 'list';
    window.scrollTo(0, 0);
}

function showCompanyEntryView() {
    $('#dvCompanyList').hide();
    $('#dvCompanyEntry').show();
    window.scrollTo(0, 0);
}

function clearCompanyFieldInvalid() {
    $('#dvCompanyEntry input.form-control').removeClass('ci-field-invalid');
}

function getCompanyCodeFromListItem(item) {
    if (!item) return '';
    if (item.CompanyCode != null && item.CompanyCode !== '') return item.CompanyCode;
    if (item.companyCode != null && item.companyCode !== '') return item.companyCode;
    if (item.UnitCode != null && item.UnitCode !== '') return item.UnitCode;
    if (item.unitCode != null && item.unitCode !== '') return item.unitCode;
    return '';
}

function getSerialNoFromListItem(item, index) {
    if (!item) return index + 1;
    if (item['S.No.'] != null) return item['S.No.'];
    if (item.SNo != null) return item.SNo;
    if (item.sNo != null) return item.sNo;
    return index + 1;
}

function buildCompanyListGridRow(item, index) {
    const c = item.Code != null ? item.Code : item.code;
    const btns =
        '<span class="pm-actions">' +
        '<button type="button" class="pm-icon-btn view" title="View" onclick="window.CompanyInformation_View(' +
        c +
        ')"><i class="fa fa-eye"></i></button>' +
        '<button type="button" class="pm-icon-btn edit" title="Edit" onclick="window.CompanyInformation_Edit(' +
        c +
        ')"><i class="fa fa-pen"></i></button>' +
        '<button type="button" class="pm-icon-btn del" title="Delete" onclick="window.CompanyInformation_Delete(' +
        c +
        ')"><i class="fa fa-trash-can"></i></button>' +
        '</span>';
    /* Display keys (friendly labels); Code last + hidden for filters/actions — matches list SP aliases */
    return {
        'S.No.': getSerialNoFromListItem(item, index),
        'Company Code': getCompanyCodeFromListItem(item),
        'Company Name': item.CompanyName || item.companyName || '',
        'Alias Name': item.CompanyAliasName || item.companyAliasName || '',
        'Company Address': item.OfficeAddress1 || item.officeAddress1 || '',
        'GST No.': item.GSTNo || item.gstNo || '',
        'Phone No.': item.OfficePhones1 || item.officePhones1 || '',
        Email: item.EMail || item.eMail || item.Email || item.email || '',
        Website: item.WebSite || item.webSite || '',
        Action: btns,
        Code: c,
    };
}

var CI_COLUMN_MAX = {
    UnitCode: 15,
    CompanyName: 100,
    CompanyAliasName: 100,
    OfficeAddress1: 200,
    GSTNo: 20,
    OfficePhones1: 100,
    EMail: 100,
    WebSite: 50,
};

function isValidIndianGSTIN(value) {
    const s = String(value || '')
        .trim()
        .toUpperCase();
    if (s.length !== 15) return false;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(s);
}

function countDigits(str) {
    return ((str || '').match(/\d/g) || []).length;
}

function validateOfficePhones1(value) {
    const t = String(value || '').trim();
    if (!t) return { ok: false, msg: 'Phone No. is required.' };
    if (t.length > CI_COLUMN_MAX.OfficePhones1) {
        return { ok: false, msg: 'Phone No. cannot exceed ' + CI_COLUMN_MAX.OfficePhones1 + ' characters (OfficePhones1).' };
    }
    if (!/^[\d+\-().,\s/]+$/.test(t)) {
        return {
            ok: false,
            msg: 'Phone No.: use digits and common separators only (+ - ( ) space comma /).',
        };
    }
    const d = countDigits(t);
    if (d < 10) {
        return { ok: false, msg: 'Phone No. must contain at least 10 digits.' };
    }
    if (d > 15) {
        return { ok: false, msg: 'Phone No.: maximum 15 digits allowed in one number.' };
    }
    return { ok: true };
}

function validateEMail(value) {
    const t = String(value || '').trim();
    if (!t) return { ok: false, msg: 'Email is required.' };
    if (t.length > CI_COLUMN_MAX.EMail) {
        return { ok: false, msg: 'Email cannot exceed ' + CI_COLUMN_MAX.EMail + ' characters (EMail).' };
    }
    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ||
        t.indexOf('..') >= 0
    ) {
        return { ok: false, msg: 'Enter a valid email address (EMail).' };
    }
    return { ok: true };
}

function validateWebSite(value) {
    const t = String(value || '').trim();
    if (!t) return { ok: false, msg: 'Website is required.' };
    if (t.length > CI_COLUMN_MAX.WebSite) {
        return { ok: false, msg: 'Website cannot exceed ' + CI_COLUMN_MAX.WebSite + ' characters (WebSite).' };
    }
    var probe = t;
    if (!/^https?:\/\//i.test(probe)) {
        probe = 'https://' + probe;
    }
    try {
        var u = new URL(probe);
        if (!u.hostname || u.hostname.indexOf('.') < 0) {
            return { ok: false, msg: 'Enter a valid website domain (WebSite).' };
        }
        return { ok: true };
    } catch (e) {
        return {
            ok: false,
            msg: 'Enter a valid website (e.g. www.company.com) (WebSite).',
        };
    }
}

function validateUnitCode(value) {
    const t = String(value || '').trim();
    if (!t) return { ok: false, msg: 'Unit Code is required.' };
    if (t.length > CI_COLUMN_MAX.UnitCode) {
        return { ok: false, msg: 'Unit Code cannot exceed ' + CI_COLUMN_MAX.UnitCode + ' characters (UnitCode).' };
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9\-_.\s]{0,14}$/.test(t)) {
        return {
            ok: false,
            msg: 'Unit Code: letters, numbers, hyphen, dot, underscore or space only (UnitCode).',
        };
    }
    return { ok: true };
}

function validateCompanyInfoForm() {
    clearCompanyFieldInvalid();

    const requiredEmpty = [
        { sel: '#txtCompanyName', col: 'CompanyName', label: 'Company Name' },
        { sel: '#txtCompanyAliasName', col: 'CompanyAliasName', label: 'Alias Name' },
        { sel: '#txtOfficeAddress1', col: 'OfficeAddress1', label: 'Company Address' },
        { sel: '#txtGSTNo', col: 'GSTNo', label: 'GST No.' },
    ];

    for (let i = 0; i < requiredEmpty.length; i++) {
        const r = requiredEmpty[i];
        const v = ($(r.sel).val() || '').trim();
        if (!v) {
            $(r.sel).addClass('ci-field-invalid');
            toastr.warning(r.label + ' is required (' + r.col + ').');
            $(r.sel).trigger('focus');
            return false;
        }
    }

    var u = validateUnitCode($('#txtUnitCode').val());
    if (!u.ok) {
        $('#txtUnitCode').addClass('ci-field-invalid');
        toastr.warning(u.msg);
        $('#txtUnitCode').trigger('focus');
        return false;
    }

    var cn = ($('#txtCompanyName').val() || '').trim();
    if (cn.length > CI_COLUMN_MAX.CompanyName) {
        $('#txtCompanyName').addClass('ci-field-invalid');
        toastr.warning('Company Name cannot exceed ' + CI_COLUMN_MAX.CompanyName + ' characters (CompanyName).');
        $('#txtCompanyName').trigger('focus');
        return false;
    }

    var ca = ($('#txtCompanyAliasName').val() || '').trim();
    if (ca.length > CI_COLUMN_MAX.CompanyAliasName) {
        $('#txtCompanyAliasName').addClass('ci-field-invalid');
        toastr.warning('Alias Name cannot exceed ' + CI_COLUMN_MAX.CompanyAliasName + ' characters (CompanyAliasName).');
        $('#txtCompanyAliasName').trigger('focus');
        return false;
    }

    var oa = ($('#txtOfficeAddress1').val() || '').trim();
    if (oa.length > CI_COLUMN_MAX.OfficeAddress1) {
        $('#txtOfficeAddress1').addClass('ci-field-invalid');
        toastr.warning('Company Address cannot exceed ' + CI_COLUMN_MAX.OfficeAddress1 + ' characters (OfficeAddress1).');
        $('#txtOfficeAddress1').trigger('focus');
        return false;
    }

    var gst = ($('#txtGSTNo').val() || '').trim().toUpperCase();
    $('#txtGSTNo').val(gst);
    if (gst.length > CI_COLUMN_MAX.GSTNo) {
        $('#txtGSTNo').addClass('ci-field-invalid');
        toastr.warning('GST No. cannot exceed ' + CI_COLUMN_MAX.GSTNo + ' characters (GSTNo).');
        $('#txtGSTNo').trigger('focus');
        return false;
    }
    if (!isValidIndianGSTIN(gst)) {
        $('#txtGSTNo').addClass('ci-field-invalid');
        toastr.warning('GST No. must be a valid 15-character GSTIN (GSTNo).');
        $('#txtGSTNo').trigger('focus');
        return false;
    }

    var ph = validateOfficePhones1($('#txtOfficePhones1').val());
    if (!ph.ok) {
        $('#txtOfficePhones1').addClass('ci-field-invalid');
        toastr.warning(ph.msg);
        $('#txtOfficePhones1').trigger('focus');
        return false;
    }

    var em = validateEMail($('#txtEMail').val());
    if (!em.ok) {
        $('#txtEMail').addClass('ci-field-invalid');
        toastr.warning(em.msg);
        $('#txtEMail').trigger('focus');
        return false;
    }

    var ws = validateWebSite($('#txtWebSite').val());
    if (!ws.ok) {
        $('#txtWebSite').addClass('ci-field-invalid');
        toastr.warning(ws.msg);
        $('#txtWebSite').trigger('focus');
        return false;
    }

    return true;
}

function bindCompanyInfoForm(item, readOnly) {
    const code = item && (item.Code != null ? item.Code : item.code);
    $('#hfCompanyInfoCode').val(code != null ? code : 0);
    $('#txtCompanyName').val(item.CompanyName || item.companyName || '');
    $('#txtCompanyAliasName').val(item.CompanyAliasName || item.companyAliasName || '');
    $('#txtOfficeAddress1').val(item.OfficeAddress1 || item.officeAddress1 || '');
    $('#txtGSTNo').val(item.GSTNo || item.gstNo || '');
    $('#txtOfficePhones1').val(item.OfficePhones1 || item.officePhones1 || '');
    $('#txtEMail').val(item.EMail || item.eMail || item.Email || '');
    $('#txtWebSite').val(item.WebSite || item.webSite || '');
    $('#txtUnitCode').val(item.UnitCode != null ? item.UnitCode : item.CompanyCode || '');

    const ro = !!readOnly;
    $('#txtCompanyName, #txtCompanyAliasName, #txtOfficeAddress1, #txtGSTNo, #txtOfficePhones1, #txtEMail, #txtWebSite, #txtUnitCode').prop(
        'readonly',
        ro
    );
    $('#btnCompanyInfoSave').toggle(!ro);
    clearCompanyFieldInvalid();
}

function openCompanyInfoNew() {
    G_CI_Mode = 'add';
    $('#ciEntryTitle').text('Add Company');
    $('#ciEntrySub').text('All fields are required to save.');
    bindCompanyInfoForm({}, false);
    $('#txtUnitCode').val('');
    $('#hfCompanyInfoCode').val('0');
    showCompanyEntryView();
}

function openCompanyInfoView(code) {
    G_CI_Mode = 'view';
    $('#ciEntryTitle').text('View Company');
    $('#ciEntrySub').text('Read-only — Back returns to the list.');
    Showloader();
    CompanyInformationService.GetCompanyParameterByCode(code)
        .then(function (res) {
            HideLoader();
            let item = firstCompanyRecord(res);
            if (!item) item = (G_CI_Rows || []).find(function (x) { return String(x.Code) === String(code); });
            if (!item) {
                toastr.error('Record not found.');
                return;
            }
            bindCompanyInfoForm(item, true);
            showCompanyEntryView();
        })
        .catch(function (err) {
            HideLoader();
            toastr.error((err && err.message) || (err && err.Msg) || 'Failed to load company.');
        });
}

function openCompanyInfoEdit(code) {
    G_CI_Mode = 'edit';
    $('#ciEntryTitle').text('Edit Company');
    $('#ciEntrySub').text('All fields are required to save.');
    Showloader();
    CompanyInformationService.GetCompanyParameterByCode(code)
        .then(function (res) {
            HideLoader();
            let item = firstCompanyRecord(res);
            if (!item) item = (G_CI_Rows || []).find(function (x) { return String(x.Code) === String(code); });
            if (!item) {
                toastr.error('Record not found.');
                return;
            }
            bindCompanyInfoForm(item, false);
            showCompanyEntryView();
        })
        .catch(function (err) {
            HideLoader();
            toastr.error((err && err.message) || (err && err.Msg) || 'Failed to load company.');
        });
}

function saveCompanyInfo() {
    if (G_CI_Mode === 'view') return;

    if (!validateCompanyInfoForm()) return;

    const authKeyData = JSON.parse(sessionStorage.getItem('authKey') || '{}');
    const userCode = authKeyData.UserMaster_Code || 0;

    const payload = {
        Code: parseInt($('#hfCompanyInfoCode').val() || '0', 10) || 0,
        CompanyName: ($('#txtCompanyName').val() || '').trim(),
        CompanyAliasName: ($('#txtCompanyAliasName').val() || '').trim(),
        OfficeAddress1: ($('#txtOfficeAddress1').val() || '').trim(),
        GSTNo: ($('#txtGSTNo').val() || '').trim().toUpperCase(),
        OfficePhones1: ($('#txtOfficePhones1').val() || '').trim(),
        EMail: ($('#txtEMail').val() || '').trim(),
        WebSite: ($('#txtWebSite').val() || '').trim(),
        UnitCode: ($('#txtUnitCode').val() || '').trim(),
        UserMaster_Code: userCode,
    };

    Showloader();
    CompanyInformationService.SaveCompanyParameter(payload)
        .then(function (res) {
            HideLoader();
            const okMsg =
                (res && (res.Message || res.Msg || res.message)) || 'Saved successfully.';
            toastr.success(okMsg);
            if (res && (res.Code != null || res.code != null)) {
                const newCode = res.Code != null ? res.Code : res.code;
                $('#hfCompanyInfoCode').val(newCode);
            }
            showCompanyListView();
            refreshCompanyInformationGrid();
        })
        .catch(function (err) {
            HideLoader();
            toastr.error((err && err.message) || (err && err.Msg) || 'Save failed.');
        });
}

function openCompanyInfoDelete(code) {
    $('#hfCompanyInfoDeleteCode').val(code);
    $('#txtCompanyInfoDeleteReason').val('').removeClass('ci-reason-invalid');
    showModal('modalCompanyInformationDelete');
    setTimeout(function () {
        $('#txtCompanyInfoDeleteReason').trigger('focus');
    }, 400);
}

function confirmCompanyInfoDelete() {
    const code = parseInt($('#hfCompanyInfoDeleteCode').val() || '0', 10);
    const reason = ($('#txtCompanyInfoDeleteReason').val() || '').trim();
    const $reason = $('#txtCompanyInfoDeleteReason');
    if (!code) {
        toastr.error('Invalid code.');
        return;
    }
    if (!reason) {
        $reason.addClass('ci-reason-invalid');
        toastr.warning('Reason for delete is required.');
        $reason.trigger('focus');
        return;
    }
    $reason.removeClass('ci-reason-invalid');
    Showloader();
    CompanyInformationService.DeleteCompanyParameter(code, reason)
        .then(function (res) {
            HideLoader();
            const okMsg = (res && (res.Message || res.Msg || res.message)) || 'Deleted successfully.';
            toastr.success(okMsg);
            hideModal('modalCompanyInformationDelete');
            if (G_CI_Mode !== 'list') {
                showCompanyListView();
            }
            refreshCompanyInformationGrid();
        })
        .catch(function (err) {
            HideLoader();
            toastr.error((err && err.message) || (err && err.Msg) || 'Delete failed.');
        });
}

function refreshCompanyInformationGrid() {
    Showloader();
    CompanyInformationService.GetCompanyParameterList()
        .then(function (response) {
            HideLoader();
            const rows = firstPayloadArray(response);
            rows.sort(function (a, b) {
                const ca = a.Code != null ? a.Code : a.code;
                const cb = b.Code != null ? b.Code : b.code;
                return (parseInt(ca, 10) || 0) - (parseInt(cb, 10) || 0);
            });
            G_CI_Rows = rows;

            if (!rows.length) {
                const emptyColspan = Object.keys(buildCompanyListGridRow({ Code: 0 }, 0)).length;
                $('#table-header-CompanyInformation').empty();
                $('#table-body-CompanyInformation').html(
                    "<tr><td colspan='" +
                        emptyColspan +
                        "' class='text-center py-4'>No records found. Click <strong>Create New</strong> to add.</td></tr>"
                );
                $('#paginator-CompanyInformation').empty();
                return;
            }

            /* Column keys must match buildCompanyListGridRow — string filters for text SQL fields */
            const stringFilterColumn = [
                'Company Code',
                'Company Name',
                'Alias Name',
                'Company Address',
                'GST No.',
                'Phone No.',
                'Email',
                'Website',
            ];
            const numericFilterColumn = ['S.No.'];
            const dateFilterColumn = [];
            const button = false;
            const showButtons = [];
            const stringDoubleFilterColumn = [];
            const hiddenColumns = ['Code'];
            const columnAlignment = { Action: 'center;min-width:120px;white-space:nowrap;' };

            const mapped = rows.map(function (item, index) {
                return buildCompanyListGridRow(item, index);
            });

            BizsolCustomFilterGrid.CreateDataTable(
                'table-header-CompanyInformation',
                'table-body-CompanyInformation',
                mapped,
                button,
                showButtons,
                stringFilterColumn,
                numericFilterColumn,
                dateFilterColumn,
                stringDoubleFilterColumn,
                hiddenColumns,
                columnAlignment
            );
        })
        .catch(function (err) {
            HideLoader();
            toastr.error((err && err.message) || (err && err.Msg) || 'Failed to load list.');
        });
}

$(document).ready(function () {
    $('#ERPHeading').text('Company Information');
    $('#btnCompanyInfoNew').on('click', openCompanyInfoNew);
    $('#btnBackToCompanyList').on('click', function () {
        showCompanyListView();
        refreshCompanyInformationGrid();
    });
    $('#btnCompanyInfoSave').on('click', saveCompanyInfo);
    $('#btnCompanyInfoDeleteConfirm').on('click', confirmCompanyInfoDelete);
    $('#txtCompanyInfoDeleteReason').on('input', function () {
        $(this).removeClass('ci-reason-invalid');
    });

    $('#dvCompanyEntry').on('input', 'input.form-control', function () {
        $(this).removeClass('ci-field-invalid');
    });

    $('#dvCompanyEntry').on('input', '#txtCompanyName', function () {
        if ($(this).prop('readonly')) return;
        $('#txtCompanyAliasName').val($(this).val());
    });

    window.CompanyInformation_View = openCompanyInfoView;
    window.CompanyInformation_Edit = openCompanyInfoEdit;
    window.CompanyInformation_Delete = openCompanyInfoDelete;

    refreshCompanyInformationGrid();
});
