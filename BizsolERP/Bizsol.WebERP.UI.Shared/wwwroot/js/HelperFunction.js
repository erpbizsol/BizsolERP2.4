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
        $('#' + Id).select2({
            width: '-webkit-fill-available'
        })
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
            $(headingSelector).text(value);
        }
    },
    getCurrentDate: function getCurrentDate() {
        let UserDetails = JSON.parse(sessionStorage.getItem('UserDetails'));
        let ServerDate = UserDetails[0].ServerDate;
        return ServerDate;
    }
}
export { BizSolHelperFunction }