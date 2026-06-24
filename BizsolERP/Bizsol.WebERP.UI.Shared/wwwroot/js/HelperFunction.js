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
        if (userDetails.length > 0 && userDetails[0].IsBizSolUser == 'Y') {
            $('#' + Id).show();
        }
        else {
            $('#' + Id).hide();
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

        var baseUrl = sessionStorage.getItem('AppBaseURL') || '';
        var checkinUrl = baseUrl + '/' + CHECKIN_FORM;

        $('#btnGoToCheckIn').off('click.attendance').on('click.attendance', function () {
            window.location.href = checkinUrl;
        });

        var modalEl = document.getElementById('dvAttendanceRequiredModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            var attendanceModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
            attendanceModal.show();
        }
    }
}

export { BizSolHelperFunction }