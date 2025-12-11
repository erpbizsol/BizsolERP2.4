# Task Prompt: Create CRM Sales Return UI (Controller + View + JS) — Reusable AI Prompt

Goal
- Add a CRM sales-return UI similar to `PendingOrder`.
- Create controller action and JSON endpoint, a Razor view that follows `PendingOrder` patterns and styling, and a client JS module (ES module) that wires select2 + `BizsolCustomFilterGrid`.
- Remove any placeholder service interface/implementation and DI registration if present.

Assumptions
- Project uses .NET 8 and Razor Views under areas (not Razor Pages per se), area name: `CRMTransactions`.
- Shared client libs available at `~/_content/Bizsol.WebERP.UI.Shared/` (includes `filter.css`, `filter.js`, `BizsolCustomFilterGrid`, `select2`).
- `PendingOrder` view and `PendingOrder.js` exist and are the canonical pattern to follow.

Required output (files to create/modify)
- `Areas/CRMTransactions/Controllers/CRMSalesReturnController.cs` (modify/create)
  - Namespace: `Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers`
  - Action `SalesReturn()` returns view.
  - `GetReturnsForCustomer(int customerId)` returns JSON (static placeholder objects acceptable).

- `Areas/CRMTransactions/Views/CRMSalesReturn/SalesReturn.cshtml` (create)
  - Copy `PendingOrder` layout/style: include `filter.css` and `filter.js`, table wrapper, paginator container.
  - Include `<script type="module" src="~/_content/Bizsol.WebERP.UI.CRM.Transactions/js/SalesReturn.js"></script>`.

- `wwwroot/js/SalesReturn.js` (create)
  - ES module or normal script that:
    - Uses an existing service client (e.g., `PendingOrderService`) as a placeholder to populate the select2 customer list OR calls a dedicated endpoint if available.
    - Binds `#btnShow` click to call `/CRMTransactions/CRMSalesReturn/GetReturnsForCustomer?customerId=...` and on success maps data into `BizsolCustomFilterGrid.CreateDataTable(headerId, bodyId, gridData, ...)`.
    - Exposes `GetSalesReturnList` on `window` for debugging.

- Remove any placeholder service files created previously:
  - `Areas/CRMTransactions/Services/ICRMSalesReturnService.cs`
  - `Areas/CRMTransactions/Services/CRMSalesReturnService.cs`

- Update DI registration in `Program.cs` if you previously added `CRMSalesReturnService`.

Behavior / Example JSON response
- Example return object:
  { ReturnNo: "SR-1001", Date: "01-Jan-2025", OrderNo: "ORD-5001", Item: "Item A", Qty: 10, Reason: "Damaged" }

Coding guidelines
- Keep changes minimal and follow repository conventions.
- Use `Area("CRMTransactions")` on controller.
- Razor view should use `Layout = "~/Views/Shared/_Layout.cshtml";` and `filter.css` as in `PendingOrder`.
- Use `select2` for dropdown and `BizsolCustomFilterGrid.CreateDataTable` for grid.
- Avoid introducing new NuGet packages; reuse existing JS helpers.
- Run a build locally after changes to verify compile.

Step-by-step instructions for the AI/Implementer
1. Create or edit `CRMSalesReturnController.cs` with `SalesReturn()` and `GetReturnsForCustomer(int)` returning a static JSON array.
2. Create `Views/CRMSalesReturn/SalesReturn.cshtml`, copying `PendingOrder` view structure (card, inputs, table wrapper, paginator). Include `filter.css`, `filter.js` and module script tag for `SalesReturn.js`.
3. Create `wwwroot/js/SalesReturn.js` that populates customer select2 and uses `$.getJSON` to call `GetReturnsForCustomer`. Map results to grid objects and call `BizsolCustomFilterGrid.CreateDataTable`.
4. If service/interface files were created earlier, delete them and remove DI registration from `Program.cs`.
5. Build the solution to ensure no compile errors.

Notes for future automation
- If a DB or API exists for returns/customers, replace static JSON in controller with repository call.
- If multiple views must follow same pattern, parametrize the prompt and pass names (controller, area, view, js path).

Usage
- Copy-paste this prompt into the workspace `Prompts` folder or pass it to an AI assistant to repeat the operation in other areas.
