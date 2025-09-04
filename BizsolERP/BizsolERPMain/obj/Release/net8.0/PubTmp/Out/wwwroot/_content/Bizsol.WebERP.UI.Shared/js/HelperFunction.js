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
    }
}
export { BizSolHelperFunction }