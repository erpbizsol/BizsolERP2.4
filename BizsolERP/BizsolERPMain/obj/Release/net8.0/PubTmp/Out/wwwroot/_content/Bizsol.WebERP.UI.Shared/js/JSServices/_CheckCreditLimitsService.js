import { UrlService } from '../URL.js';
import { promiseAjaxCallApi } from '../PromiseAjaxCallApi.js';

const CheckCreditLimitsService = {

    CheckCreditLimits: function CheckCreditLimits(AccountMaster_Code
                                                  , Amount
                                                  , PreviousAmount
                                                  , Source
                                                  , PasswordsCodeRs
                                                  , PasswordsCodeDays
                                                  , ShowFormDialog
                                                  , LedgerClosing
                                                  , OverDueAmount
                                                  , ShowOnlyOutstandingInfo
                                                  , Log_OnLineVerification_Code
                                                  , OnlyCheckCreditLimit
                                                  , CheckBillingWithoutAdvance
                                                  , AdvancePayPercentage
                                                  , EntryDesp
                                                  , MasterTableCode
                                                  , BuyerPOMaster_Code) {
        let url = UrlService.API_ENDPOINT_ValidateCreditLimits + `/CheckCreditLimits?AccountMaster_Code=${AccountMaster_Code}&Amount=${Amount}
                                                    &PreviousAmount=${PreviousAmount}&Source=${Source}&PasswordsCodeRs=${PasswordsCodeRs}&PasswordsCodeDays=${PasswordsCodeDays}&ShowFormDialog=${ShowFormDialog}&LedgerClosing=${LedgerClosing}
                                                    &OverDueAmount=${OverDueAmount}&ShowOnlyOutstandingInfo=${ShowOnlyOutstandingInfo}&Log_OnLineVerification_Code=${Log_OnLineVerification_Code}&OnlyCheckCreditLimit=${OnlyCheckCreditLimit}&CheckBillingWithoutAdvance=${CheckBillingWithoutAdvance}
                                                    &AdvancePayPercentage=${AdvancePayPercentage}&EntryDesp=${EntryDesp}&MasterTableCode=${MasterTableCode}&BuyerPOMaster_Code=${BuyerPOMaster_Code}`;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },

    ValidateOTP: function ValidateOTP(Password) {
        let userCode = JSON.parse(sessionStorage.getItem('authKey')).UserMaster_Code;
        let encodePassword = encodeURIComponent(Password);
        let url = UrlService.API_ENDPOINT_ValidateCreditLimits + "/ValidateOTP?UserMaster_Code=" + userCode + "&Password=" + encodePassword ;
        return promiseAjaxCallApi.CallAPI('GET', url, "").then(
            function (value) {
                return value;
            }
        );
    },
}

export { CheckCreditLimitsService }
