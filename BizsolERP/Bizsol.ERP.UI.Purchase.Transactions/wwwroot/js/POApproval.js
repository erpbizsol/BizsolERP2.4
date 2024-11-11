import { POApprovalService } from '/_content/Bizsol.WebERP.UI.Shared/js/JSServices/POApprovalService.js';

$(document).ready(function () {
    POApprovalService.GetUnApprovedPO().then(function (value) {
        const StringFilterColumn = ["Party Name", "Product","Payment Terms"];
        const NumericFilterColumn = ["Code", "PO No","PO Amount"];
        const DateFilterColumn = ["PO Date"];
        const Button = true;
        const StringdoubleFilterColumn = ["Product"];
        CreateDataTable(value, Button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn)
    });

});

POApprovalService.GetPODetail().then(function (value) {
    const StringFilterColumn = ["Party Name", "Product", "Payment Terms"];
    const NumericFilterColumn = ["Code", "PO No", "PO Amount"];
    const DateFilterColumn = ["PO Date"];
    const Button = true;
    const StringdoubleFilterColumn = ["Product"];
    CreateDataTable(value, Button, StringFilterColumn, NumericFilterColumn, DateFilterColumn, StringdoubleFilterColumn)
});