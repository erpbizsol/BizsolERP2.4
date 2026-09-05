import { UserDashboardMenuService } from '../../Bizsol.WebERP.UI.Shared/js/JSServices/UserDashboardMenuService.js';
import { BizSolHelperFunction } from '../../Bizsol.WebERP.UI.Shared/js/HelperFunction.js';

function firstArray(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.$values && Array.isArray(payload.$values)) return payload.$values;
    if (payload.data && Array.isArray(payload.data)) return payload.data;
    if (payload.Data && Array.isArray(payload.Data)) return payload.Data;
    if (payload.value && Array.isArray(payload.value)) return payload.value;
    if (payload.Value && Array.isArray(payload.Value)) return payload.Value;
    if (payload.result && Array.isArray(payload.result)) return payload.result;
    if (payload.Result && Array.isArray(payload.Result)) return payload.Result;
    if (payload.Table && Array.isArray(payload.Table)) return payload.Table;
    if (payload.table && Array.isArray(payload.table)) return payload.table;
    if (payload.data && payload.data.$values && Array.isArray(payload.data.$values)) return payload.data.$values;
    if (payload.Data && payload.Data.$values && Array.isArray(payload.Data.$values)) return payload.Data.$values;
    return [];
}

function pickCode(item) {
    if (!item) return '';
    var code = item.WebApiDashboardMaster_Code != null ? item.WebApiDashboardMaster_Code
        : (item.webApiDashboardMaster_Code != null ? item.webApiDashboardMaster_Code
            : (item.DashboardMaster_Code != null ? item.DashboardMaster_Code
                : (item.dashboardMaster_Code != null ? item.dashboardMaster_Code
                    : (item.Code != null ? item.Code : item.code))));
    return code != null ? String(code).trim() : '';
}

function pickDesp(item) {
    if (!item) return '';
    var text = item.Desp != null ? item.Desp
        : (item.desp != null ? item.desp
            : (item.DashboardName != null ? item.DashboardName
                : (item.dashboardName != null ? item.dashboardName
                    : (item.Name != null ? item.Name : item.name))));
    return (text || '').toString().trim();
}

function pickUrl(item) {
    if (!item) return '';
    var url = item.URL != null ? item.URL
        : (item.Url != null ? item.Url
            : (item.url != null ? item.url
                : (item.FormToOpen != null ? item.FormToOpen
                    : (item.formToOpen != null ? item.formToOpen : ''))));
    return (url || '').toString().trim();
}

function pickCompanyCode(item) {
    if (!item) return '';
    var code = item.FixedParameter_Code != null ? item.FixedParameter_Code
        : (item.fixedParameter_Code != null ? item.fixedParameter_Code
            : (item.CompanyCode != null ? item.CompanyCode : item.companyCode));
    return code != null ? String(code).trim() : '';
}

function pickIsDefault(item) {
    if (!item) return false;
    var flag = item.IsDefault != null ? item.IsDefault
        : (item.isDefault != null ? item.isDefault
            : (item.Default != null ? item.Default
                : (item.IsPrimary != null ? item.IsPrimary : null)));
    if (flag == null) return false;
    if (typeof flag === 'boolean') return flag;
    var s = String(flag).trim().toUpperCase();
    return s === 'Y' || s === 'TRUE' || s === '1' || s === 'YES';
}

function storedDefaultDashboardCode(userCode) {
    try {
        var map = JSON.parse(sessionStorage.getItem('dcUserDefaultDashboards') || '{}');
        var key = userCode != null ? String(userCode) : '';
        return key && map[key] ? String(map[key]) : '';
    } catch (e) {
        return '';
    }
}

function pickUserMasterCode(item) {
    if (!item) return '';
    var code = item.UserMaster_Code != null ? item.UserMaster_Code
        : (item.userMaster_Code != null ? item.userMaster_Code
            : (item.UserMasterCode != null ? item.UserMasterCode : ''));
    return code != null ? String(code).trim() : '';
}

function loggedInCompanyCode() {
    try {
        var auth = JSON.parse(sessionStorage.getItem('authKey') || '{}');
        return auth.CompanyCode != null ? String(auth.CompanyCode).trim() : '';
    } catch (e) {
        return '';
    }
}

function fallbackDashboardUrl(desp, code) {
    var t = (desp || '').toString().trim().toLowerCase();
    var q = code ? ('?DashboardMaster_Code=' + encodeURIComponent(code)) : '';
    if (t.indexOf('project') !== -1) return 'CRMTransactions/ProjectDetail/ProjectDetailDashboard' + q;
    if (t.indexOf('sales person') !== -1 || t.indexOf('salesperson') !== -1) {
        return 'CRMTransactions/SalesPersonDashboard/SalesPersonDashboard' + q;
    }
    if (t.indexOf('expense') !== -1) return 'CRMTransactions/ExpenseDashboard/ExpenseDashboard' + q;
    if (t.indexOf('crm') !== -1) return 'CRMTransactions/CRMDashboard/CRMDashboard' + q;
    return '';
}

function getDashboardIcon(label) {
    var t = (label || '').toString().trim().toLowerCase();
    if (t.indexOf('sales person') !== -1 || t.indexOf('salesperson') !== -1) return 'fa-user-tie';
    if (t.indexOf('crm') !== -1) return 'fa-handshake';
    if (t.indexOf('expense') !== -1) return 'fa-wallet';
    if (t.indexOf('project') !== -1) return 'fa-diagram-project';
    if (t.indexOf('customer') !== -1) return 'fa-users';
    return 'fa-gauge-high';
}

function getAppBaseUrl() {
    return (window.location.origin || '').replace(/\/+$/, '');
}

function buildDashboardHref(url, desp) {
    var path = (url || '').trim();
    if (!path) return '';

    if (/^https?:\/\//i.test(path)) {
        var absSep = path.indexOf('?') !== -1 ? '&' : '?';
        return path + (desp ? absSep + 'ModuleDesp=' + encodeURIComponent(desp) : '');
    }

    path = path.replace(/^\/+/, '');
    var sep = path.indexOf('?') !== -1 ? '&' : '?';
    var href = getAppBaseUrl() + '/' + path;
    if (desp) href += sep + 'ModuleDesp=' + encodeURIComponent(desp);
    return href;
}

function mergeAssignedDashboards(assignedRows, masterRows, userCode) {
    var masterByCode = {};
    (masterRows || []).forEach(function (row) {
        var code = pickCode(row);
        if (code && code !== '0') masterByCode[code] = row;
    });

    var loggedUser = (userCode || UserDashboardMenuService.GetLoggedInUserMasterCode() || '').toString().trim();
    var companyCode = loggedInCompanyCode();
    var seen = {};
    var out = [];

    (assignedRows || []).forEach(function (row) {
        var rowUser = pickUserMasterCode(row);
        if (loggedUser && rowUser && rowUser !== '0' && rowUser !== loggedUser) return;

        var rowCompany = pickCompanyCode(row);
        if (companyCode && rowCompany && rowCompany !== '0' && rowCompany !== companyCode) return;

        var code = pickCode(row);
        if (!code || code === '0' || seen[code]) return;
        seen[code] = true;

        var master = masterByCode[code] || {};
        var desp = pickDesp(row) || pickDesp(master);
        var url = pickUrl(row) || pickUrl(master) || fallbackDashboardUrl(desp, code);
        if (!desp && !url) return;

        out.push({
            code: code,
            desp: desp || ('Dashboard ' + code),
            url: url,
            isDefault: pickIsDefault(row) || pickIsDefault(master),
        });
    });

    var storedDefault = storedDefaultDashboardCode(loggedUser);
    if (storedDefault) {
        out.forEach(function (item) {
            item.isDefault = item.code === storedDefault;
        });
    }

    var defaultCount = out.filter(function (item) { return item.isDefault; }).length;
    if (defaultCount > 1) {
        var kept = false;
        out.forEach(function (item) {
            if (!item.isDefault) return;
            if (kept) item.isDefault = false;
            else kept = true;
        });
    }

    out.sort(function (a, b) {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return (a.desp || '').localeCompare(b.desp || '', undefined, { sensitivity: 'base' });
    });

    return out;
}

function setLoading(isLoading) {
    $('#udm-loading').toggle(!!isLoading);
    if (isLoading) {
        $('#udm-empty').hide();
        $('#udm-grid').hide();
    }
}

function showEmpty(message) {
    $('#udm-loading').hide();
    $('#udm-grid').hide().empty();
    $('#udm-empty').show();
    $('#udm-empty-text').text(message || 'No dashboard is assigned to your user.');
}

function bindDashboardCards(items) {
    var $grid = $('#udm-grid').empty();
    $('#udm-count').text(String((items || []).length));

    if (!items || !items.length) {
        showEmpty('No dashboard is assigned to your user.');
        return;
    }

    $('#udm-empty').hide();
    $grid.show();

    items.forEach(function (item, index) {
        var href = buildDashboardHref(item.url, item.desp);
        var icon = getDashboardIcon(item.desp);
        var accent = index % 6;
        var disabled = !href;
        var $card = $('<a>', {
            class: 'udm-card udm-accent-' + accent + (item.isDefault ? ' is-default' : '') + (disabled ? ' is-disabled' : ''),
            href: disabled ? 'javascript:void(0);' : href,
            'data-url': item.url || '',
            'data-desp': item.desp || '',
            'data-code': item.code || '',
        });
        if (!disabled) {
            $card.attr('target', '_self');
        }
        if (disabled) {
            $card.attr('title', 'Dashboard URL is not configured.');
        }

        $card.append(
            $('<span>', { class: 'udm-card-icon', 'aria-hidden': 'true' })
                .append($('<i class="fas ' + icon + '"></i>'))
        );
        var $title = $('<span>', { class: 'udm-card-title' }).text(item.desp);
        if (item.isDefault) {
            $title.append($('<em>', { class: 'udm-default-badge' }).text('Default'));
        }
        $card.append(
            $('<span>', { class: 'udm-card-body' })
                .append($title)
        );
        $card.append(
            $('<span>', { class: 'udm-card-go', 'aria-hidden': 'true' })
                .append($('<i class="fas fa-arrow-right"></i>'))
        );
        $grid.append($card);
    });
}

function rememberDashboardChoice(items) {
    var count = (items || []).length;
    sessionStorage.setItem('udmDashboardCount', String(count));
    sessionStorage.setItem('udmHasMultipleDashboards', count > 1 ? '1' : '0');
    sessionStorage.setItem(
        'udmMenuUrl',
        getAppBaseUrl() + '/CommonMasters/UserDashboardMenu/UserDashboardMenu?ModuleDesp=' + encodeURIComponent('User Dashboard Menu')
    );
}

function openDashboard(href, replaceHistory) {
    sessionStorage.setItem('udmMenuUrl', window.location.href);
    if (replaceHistory) {
        window.location.replace(href);
        return;
    }
    sessionStorage.setItem('udmFromDashboard', '1');
    window.location.assign(href);
}

function maybeOpenDefaultDashboard(items) {
    rememberDashboardChoice(items);
    if (!items || !items.length) return;

    var onlyOne = items.length === 1;
    var def = items.filter(function (item) { return item.isDefault; })[0] || (onlyOne ? items[0] : null);
    if (!def) {
        if (sessionStorage.getItem('udmFromDashboard') === '1') {
            sessionStorage.removeItem('udmFromDashboard');
        }
        return;
    }

    var href = buildDashboardHref(def.url, def.desp);
    if (!href) return;

    if (onlyOne) {
        openDashboard(href, true);
        return;
    }

    if (sessionStorage.getItem('udmFromDashboard') === '1') {
        sessionStorage.removeItem('udmFromDashboard');
        return;
    }

    openDashboard(href, false);
}

function loadUserDashboards() {
    var userCode = UserDashboardMenuService.GetLoggedInUserMasterCode();
    $('#udm-user-code').text(userCode || '—');

    if (!userCode) {
        showEmpty('Logged-in user code was not found. Please login again.');
        return;
    }

    setLoading(true);

    UserDashboardMenuService.GetUserDashboardDetails(userCode)
        .then(function (res) {
            var assigned = firstArray(res);
            var items = mergeAssignedDashboards(assigned, assigned, userCode);
            bindDashboardCards(items);
            maybeOpenDefaultDashboard(items);
        })
        .catch(function (err) {
            console.error('UserDashboardMenu load failed', err);
            showEmpty('Failed to load your dashboards. Please try again.');
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to load dashboards for the logged-in user.');
            }
        })
        .finally(function () {
            setLoading(false);
        });
}

$(function () {
    BizSolHelperFunction.setHeadingFromQueryParam('#ERPHeading', 'ModuleDesp');
    $('#udm-grid').on('click', '.udm-card.is-disabled', function (e) {
        e.preventDefault();
        if (typeof toastr !== 'undefined') {
            toastr.warning('Dashboard URL is not configured.');
        }
    });
    $('#udm-grid').on('click', '.udm-card:not(.is-disabled)', function (e) {
        var href = $(this).attr('href');
        if (!href || href === 'javascript:void(0);') {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        sessionStorage.setItem('udmFromDashboard', '1');
        sessionStorage.setItem('udmMenuUrl', window.location.href);
        window.location.assign(href);
    });
    loadUserDashboards();
});

window.addEventListener('pageshow', function () {
    setLoading(false);
});

export { loadUserDashboards, bindDashboardCards, mergeAssignedDashboards };
