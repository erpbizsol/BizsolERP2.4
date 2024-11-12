const BizSolInputControl = {
    OnChangeNumericTextBox: function OnChangeNumericTextBox(element) {
        element.value = element.value.replace(/[^0-9]/g, "");
        if (Number.isInteger(parseInt(element.value)) == true) {
            element.setCustomValidity("");
            
        } else {
            element.setCustomValidity("Only allowed Numbers");
        }
        element.reportValidity();
    },
    OnChangeFloatTextBox: function OnChangeFloatTextBox(element) {
        element.value = element.value.replace(/[^0-9.]/g, "");
        if (parseFloat(element.value) === parseFloat(element.value) && Number.isInteger(parseFloat(element.value)) == false) {
            element.setCustomValidity("");

        } else {
            element.setCustomValidity("Only allowed Float Numbers");
        }
        element.reportValidity();
    },
    OnChangeStringTextBox: function OnChangeStringTextBox(element, characterNotAllowed,splitChar) {
        let NotAllowedCharArry = characterNotAllowed.toLowerCase().split(splitChar);
        
        for (let item of NotAllowedCharArry) {
            element.value = element.value.toLowerCase().replace(new RegExp(item, 'g'), '');
        }
        if (parseFloat(element.value) === parseFloat(element.value) && Number.isInteger(parseFloat(element.value)) == false) {
            element.setCustomValidity("");

        } else {
            element.setCustomValidity("'"+characterNotAllowed+ "' Character not allowed! ");
        }
        element.reportValidity();
    }, OnChangeEmailTextBox: function OnChangeEmailTextBox(element) {
       
        const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

        if (regex.test(element.value) == true) {

            element.setCustomValidity("");
        } else {
            element.setCustomValidity("Email not valid! Ex. some@uk.in");
        }

        element.reportValidity();
    }, OnChangeURLTextBox: function OnChangeURLTextBox(element) {
        const regex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6})(\/[\w.-]*)*\/?$/;

        if (regex.test(element.value) == true) {
           
            element.setCustomValidity("");
        } else {
            element.setCustomValidity("URL not valid! Ex. https:// or http://");
        }
        
        element.reportValidity();
    },
    OnKeyDownPressNumericTextBox: function OnKeyDownPressNumericTextBox(event, element) {
        if (event.charCode == 13 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57))
        {
            element.setCustomValidity("");
            element.reportValidity();
            BizSolhandleEnterKey(event);
            return true;
        }
        else {
            element.setCustomValidity("Only allowed Numbers");
            element.reportValidity();
            return false;
        }

        
    },
    OnKeyDownPressFloatTextBox: function OnKeyDownPressFloatTextBox(event, element) {
        if (event.charCode == 13 || event.charCode ==46 || event.charCode == 8 || (event.charCode >= 48 && event.charCode <= 57))
        {
            element.setCustomValidity("");
            element.reportValidity();
            BizSolhandleEnterKey(event);
            return true;
        }
        else {
            element.setCustomValidity("Only allowed Float Numbers");
            element.reportValidity();
            return false;
        }

        
    }

}
function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        //const inputs = document.getElementsByTagName('input')
        const inputs = $('.form-control')
        const index = [...inputs].indexOf(event.target);
        if ((index + 1) == inputs.length) {
            inputs[0].focus();
        } else {
            inputs[index + 1].focus();
        }
        
        event.preventDefault();
    }
}

window.BizSolhandleEnterKey = BizSolhandleEnterKey;
window.BizSolInputControl = BizSolInputControl;