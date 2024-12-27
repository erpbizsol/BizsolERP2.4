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
    OnChangeFloatTextBox: function OnChangeFloatTextBox(element, allowedNoDecimal=0) {
        element.value = element.value.replace(/[^0-9.]/g, "");
        element.setCustomValidity("");
        if (element.value.split('.').length > 2) {
            element.setCustomValidity("Only allowed Float Numbers");


        } else if (Number.isInteger(parseFloat(element.value)) == true && parseFloat(element.value)>0) {
            element.setCustomValidity("Only allowed Float Numbers");

        } else if (parseInt(allowedNoDecimal) > 0) {
            var txt = element.value.split('.')
            if (txt[1].length > parseInt(allowedNoDecimal))
                element.setCustomValidity("Only allowed "+ allowedNoDecimal + " decimal float numbers");
        }
       
        element.reportValidity();
    },
    OnChangeStringTextBox: function OnChangeStringTextBox(element, characterNotAllowed,splitChar) {
        let NotAllowedCharArry = characterNotAllowed.toLowerCase().split(splitChar);
        let Valid = true;
        for (let item of NotAllowedCharArry) {
            if (element.value.toLowerCase().includes(item)==true) {
                element.value = element.value.toLowerCase().replace(new RegExp(item, 'g'), '');
                Valid = false;
            }
        }
        if (Valid == true) {
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

        
    },
    OnChangeOnlyAlphaNumericTextBox: function OnChangeOnlyAlphaNumericTextBox(element) {

        const regex = /^[a-zA-Z0-9_]*$/

        if (regex.test(element.value) == true) {

            element.setCustomValidity("");
            BizSolhandleEnterKey(event);
        } else {
            element.setCustomValidity("Only Alpha Numeric allowed");
        }

        element.reportValidity();
    },
    IsMobileNumber: function IsMobileNumber(txtMobId) {
        var mob = /^[6-9]{1}[0-9]{9}$/;
        if (mob.test(txtMobId) == false) {
            //alert("Please enter valid mobile number.");
            //M.toast({ html: 'Please enter valid mobile number.', classes: 'rounded' });
            //txtMobId.value = '';
            return false;
        }
        return true;
    }

}
function BizSolhandleEnterKey(event) {
    if (event.key === "Enter") {
        //const inputs = document.getElementsByTagName('input')
        const inputs = $('.BizSolFormControl')
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