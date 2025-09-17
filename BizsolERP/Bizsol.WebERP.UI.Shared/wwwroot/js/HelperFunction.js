const BizSolHelperFunction = {
    ToWithSpace: function ToWithSpace(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1 $2');
    }
    ,
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
        if (userDetails.length>0 && userDetails[0].IsBizSolUser == 'Y') {
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
    }
}
export { BizSolHelperFunction }