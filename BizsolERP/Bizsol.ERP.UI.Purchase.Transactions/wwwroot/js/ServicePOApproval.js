import { ServicePOApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/ServicePOApprovalService.js';

$(document).ready(function () {
    ServicePOApprovalService.GetUnApprovedServicePO().then(function (value) {
        const StringFilterColumn = ["Party Name","Payment Terms"];
        const NumericFilterColumn = ["Code", "PO No","PO Amount"];
        const DateFilterColumn = ["PO Date"];
        const Button = true;
        const StringdoubleFilterColumn = ["Product"];
        CreateDataTable(value, Button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn)
    });

});