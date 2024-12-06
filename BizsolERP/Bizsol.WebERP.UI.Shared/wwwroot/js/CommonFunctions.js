 
/// Validate List : List - Json List, ColNo - Column in the List, strValue - Value needs to be validated
function ListValidation(List,ColNo, strValue) {

        var Valid = false;
        var array =List;
    var arr ;
        for (var i = 0; i < array.length; i++) {
            arr = array[i];
            var b_col = arr.map(x => x.Value);

            if (b_col[ColNo].trim().toUpperCase().replace("\u0026", "&") == strValue.trim().toUpperCase().replace("&amp;", "&")) {
                Valid = true;
                break;
            }
        }
        return Valid;
    }

    function ListValidationIntType(List, ColNo, intValue) {

        var Valid = false;
        var array = List;

        for (var i = 0; i < array.length; i++) {
            arr = array[i];
            var b_col = arr.map(x => x.Value);

            if (b_col[ColNo] == intValue) {
                Valid = true;
                break;
            }
        }
        return Valid;
    }