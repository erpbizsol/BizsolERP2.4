import { UserDashboardMenuService } from './JSServices/UserDashboardMenuService.js';

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
    return [];
}

const BizSolHelperFunction = {
    ToWithSpace: function ToWithSpace(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1 $2');
    },
    SelectOptionByText: function SelectOptionByText(Id, FindText) {
        var dd = document.getElementById(Id);
        for (var i = 0; i < dd.options.length; i++) {
            if (dd.options[i].text.trim() === FindText.trim()) {
                dd.selectedIndex = i;
                break;
            }
        }
        var $element = $('#' + Id);
        $element.select2({
            width: '-webkit-fill-available'
        });
        this.attachSelect2ScrollPrevention($element);
    },
    /**
     * Prevents horizontal scrolling when select2 dropdown is opened (keeps vertical scroll enabled)
     * @param {jQuery} $element - jQuery element with select2 initialized
     */
    attachSelect2ScrollPrevention: function attachSelect2ScrollPrevention($element) {
        if (!$element || !$element.length) {
            return;
        }
        
        $element.on('select2:opening', function(e) {
            $('select').not($element).each(function() {
                if ($(this).data('select2') && $(this).data('select2').isOpen()) {
                    $(this).select2('close');
                }
            });
        });
        
        $element.on('select2:open', function() {
            // Hide only horizontal scroll, keep vertical scroll
            $('body').css('overflow-x', 'hidden');
            
            // Set z-index for Select2 dropdown container
            $('.select2-container--open').css('z-index', '0009');
            $('.select2-dropdown').css('z-index', '0009');
        });
        
        $element.on('select2:close', function() {
            // Restore horizontal scroll
            $('body').css('overflow-x', '');
            
            // Reset z-index
            $('.select2-container--open').css('z-index', '0009');
            $('.select2-dropdown').css('z-index', '0009');
        });
    },
    HideOrShowConfigurationSettingBtn: function HideOrShowConfigurationSettingBtn(Id) {
        let userDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
        const el = document.getElementById(Id);
        if (!el) {
            return;
        }
        if (userDetails?.length > 0 && userDetails[0].IsBizSolUser == 'Y') {
            el.style.removeProperty('display');
        }
        else {
            el.style.setProperty('display', 'none', 'important');
        }
    },
    getFinancialYear: function getFinancialYear() {
        let currentDate = new Date();
        let currentMonth = currentDate.getMonth();

        let startYear = currentDate.getFullYear();
        if (currentMonth < 3) {
            startYear = startYear - 1;
        }

        return startYear + "-" + (startYear + 1);
    },
    /**
     * Parses the query string parameters from the current window URL and returns an object.
     * Handles decoding and missing query string gracefully.
     * Usage: const params = BizSolHelperFunction.getUrlVars();
     */
    getUrlVars: function getUrlVars() {
        const vars = {};
        const queryStart = window.location.href.indexOf('?');
        if (queryStart === -1) return vars; // No query string present

        const hashes = window.location.href.slice(queryStart + 1).split('&');
        for (let i = 0; i < hashes.length; i++) {
            const hash = hashes[i].split('=');
            if (hash.length === 2) {
                vars[decodeURIComponent(hash[0])] = decodeURIComponent(hash[1]);
            }
        }
        return vars;
    },
    /**
     * Sets the heading text from a query string parameter.
     * @param {string} headingSelector - jQuery selector for the heading element.
     * @param {string} paramName - Query string parameter name.
     */
    setHeadingFromQueryParam: function (headingSelector, paramName) {
        let urlParams = this.getUrlVars();
        let value = decodeURI(urlParams[paramName] || '');
        if (value && value !== "undefined" && value !== "") {
            $(headingSelector).text(this.ToWithSpace(value));
        }
    },
    getCurrentDate: function getCurrentDate() {
        let UserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
        let ServerDate = UserDetails[0].ServerDate;
        return ServerDate;
    },
    checkAttendanceAndShowModal: function checkAttendanceAndShowModal(menuItems, isUserMarkDayAttendance) {
        var CHECKIN_FORM = 'CRMTransactions/DailyCheckinOrCheckout/CheckinOrCheckout';

        // Skip if the user is already on the check-in page
        if (window.location.pathname.toLowerCase().indexOf('checkinorcheckout') !== -1) {
            return;
        }

        // Condition 3: the check-in menu must be accessible to this user
        var hasCheckinMenu = false;
        if (menuItems && menuItems.length) {
            for (var i = 0; i < menuItems.length; i++) {
                if (menuItems[i].FormToOpen === CHECKIN_FORM) {
                    hasCheckinMenu = true;
                    break;
                }
            }
        }
        if (!hasCheckinMenu) return;

        // Condition 1: AttendanceMandatoryInCRM must be 'Y' (stored in UserDetails)
        var userDetails = JSON.parse(sessionStorage.getItem('UserDetails') || '[]');
        if (!userDetails || !userDetails.length || userDetails[0].AttendanceMandatoryInCRM !== 'Y') return;

        // Condition 2: IsUserMarkDayAttendance value passed in from the caller
        if (isUserMarkDayAttendance !== 'N') return;

        var checkinUrl = this.buildAppUrl(CHECKIN_FORM);

        $('#btnGoToCheckIn').off('click.attendance').on('click.attendance', function () {
            window.location.href = checkinUrl;
        });

        var modalEl = document.getElementById('dvAttendanceRequiredModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            var attendanceModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
            attendanceModal.show();
        }
    },
    inferAppPathBase: function inferAppPathBase() {
        var path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
        var lower = path.toLowerCase();

        if (lower === '/' || lower === '') return '';
        if (lower.endsWith('/home/index')) {
            return path.slice(0, -('/home/index'.length)).replace(/\/+$/, '');
        }
        if (lower.endsWith('/home')) {
            return path.slice(0, -('/home'.length)).replace(/\/+$/, '');
        }

        var segments = path.split('/').filter(Boolean);
        if (segments.length === 0) return '';
        if (segments.length === 1) return '/' + segments[0];

        var knownAreas = {
            commonmasters: 1, crmtransactions: 1, crmreports: 1, uitools: 1,
            salestransactions: 1, salesreports: 1, salestest: 1,
            productiontransactions: 1, productionreports: 1, productionmasters: 1,
            marketingmasters: 1, marketingtransactions: 1, marketingreports: 1,
            purchasetransactions: 1, purchasemasters: 1, purchasereports: 1,
            commonreports: 1, misreports: 1, financemasters: 1, financetransactions: 1,
            customcontrol: 1, home: 1, account: 1
        };
        var first = segments[0].toLowerCase();
        if (!knownAreas[first]) {
            return '/' + segments[0];
        }
        return '';
    },
    getAppBaseUrl: function getAppBaseUrl() {
        var appBase = (sessionStorage.getItem('AppBaseURL') || '').trim();
        if (!appBase) {
            appBase = window.location.origin || '';
        }
        try {
            var parsed = new URL(appBase, window.location.href);
            appBase = parsed.origin + parsed.pathname.replace(/\/+$/, '');
        } catch (e) {
            appBase = appBase.replace(/\/+$/, '');
        }

        var basePath = '';
        try {
            basePath = new URL(appBase, window.location.href).pathname.replace(/\/+$/, '');
        } catch (e) { }

        if (!basePath) {
            var inferred = this.inferAppPathBase();
            if (inferred) {
                appBase = window.location.origin + inferred;
            }
        }

        return appBase.replace(/\/+$/, '');
    },
    buildAppUrl: function buildAppUrl(relativeOrAbsoluteUrl) {
        var url = (relativeOrAbsoluteUrl || '').trim();
        var appBase = this.getAppBaseUrl();
        if (!url) {
            return appBase + '/';
        }

        var pathBase = '';
        try {
            pathBase = new URL(appBase, window.location.href).pathname.replace(/\/+$/, '');
        } catch (e) { }

        if (/^https?:\/\//i.test(url)) {
            try {
                var abs = new URL(url);
                var app = new URL(appBase, window.location.href);
                if (abs.origin === app.origin && pathBase
                    && abs.pathname.toLowerCase().indexOf(pathBase.toLowerCase()) !== 0) {
                    url = abs.pathname.replace(/^\/+/, '') + abs.search + abs.hash;
                } else {
                    return url;
                }
            } catch (e) {
                return url;
            }
        }

        url = url.replace(/^\/+/, '');
        if (pathBase) {
            var virtualPrefix = pathBase.replace(/^\/+/, '') + '/';
            if (url.toLowerCase().indexOf(virtualPrefix) === 0) {
                url = url.substring(virtualPrefix.length);
            }
        }

        try {
            return new URL(url, appBase + '/').href;
        } catch (e) {
            return appBase + '/' + url;
        }
    },
    getUserDashboardMenuUrl: function getUserDashboardMenuUrl() {
        var url = this.buildAppUrl('CommonMasters/UserDashboardMenu/UserDashboardMenu');
        url += (url.indexOf('?') !== -1 ? '&' : '?') + 'ModuleDesp=' + encodeURIComponent('User Dashboard Menu');
        sessionStorage.setItem('udmMenuUrl', url);
        return url;
    },
    rememberUserDashboardCount: function rememberUserDashboardCount(count) {
        var n = parseInt(count, 10) || 0;
        sessionStorage.setItem('udmDashboardCount', String(n));
        sessionStorage.setItem('udmHasMultipleDashboards', n > 1 ? '1' : '0');
        this.getUserDashboardMenuUrl();
        return n;
    },
    hasMultipleUserDashboards: function hasMultipleUserDashboards() {
        return sessionStorage.getItem('udmHasMultipleDashboards') === '1';
    },
    applyUserDashboardMenuBackButton: function applyUserDashboardMenuBackButton(selector) {
        var $btn = $(selector || '#btnBackToUserDashboardMenu');
        if (!$btn.length) return;

        if (this.hasMultipleUserDashboards()) {
            $btn.show();
        } else {
            $btn.hide();
        }

        var self = this;
        UserDashboardMenuService.GetUserDashboardDetails()
            .then(function (res) {
                var count = self.rememberUserDashboardCount(firstArray(res).length);
                if (count > 1) {
                    $btn.show();
                } else {
                    $btn.hide();
                }
            })
            .catch(function () { /* keep current visibility */ });
    },
    goToUserDashboardMenu: function goToUserDashboardMenu() {
        sessionStorage.setItem('udmFromDashboard', '1');
        window.location.assign(this.getUserDashboardMenuUrl());
    },
    /**
     * Applies alphanumeric-only + uppercase enforcement to one or more inputs.
     * Blocks non-alphanumeric keypresses and auto-uppercases on input/paste.
     * @param {string|HTMLElement|jQuery} selector - CSS selector, DOM element, or jQuery object.
     */
    applyAlphaNumUppercase: function applyAlphaNumUppercase(selector) {
        var elements;
        if (typeof selector === 'string') {
            elements = document.querySelectorAll(selector);
        } else if (selector instanceof HTMLElement) {
            elements = [selector];
        } else if (selector && selector.jquery) {
            elements = selector.toArray();
        } else {
            return;
        }
        elements.forEach(function (input) {
            input.addEventListener('keypress', function (e) {
                var char = String.fromCharCode(e.which);
                if (!/[a-zA-Z0-9]/.test(char)) {
                    e.preventDefault();
                }
            });
            input.addEventListener('input', function () {
                this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            });
        });
    }
}

export { BizSolHelperFunction }