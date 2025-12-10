using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Bizsol.WebERP.UI.CRM.Transactions.Areas.CRMTransactions.Controllers
{
    [Area("CRMTransactions")]
    public class CRMSalesReturnController : Controller
    {
        // Static list to store sales returns (replace with database in production)
        private static List<SalesReturnModel> _salesReturns = new List<SalesReturnModel>();
        private static int _nextId = 1;

        // GET: CRMTransactions/CRMSalesReturn/SalesReturn
        public IActionResult SalesReturn()
        {
            // View-only action that will render the SalesReturn view.
            return View();
        }

        // GET: Get list of Sales Returns with date filter
        [HttpGet]
        public IActionResult GetSalesReturnList(string fromDate, string toDate)
        {
            try
            {
                DateTime from = DateTime.Parse(fromDate);
                DateTime to = DateTime.Parse(toDate);

                // Filter by date range
                var filteredReturns = _salesReturns
                    .Where(r => DateTime.Parse(r.Date) >= from && DateTime.Parse(r.Date) <= to)
                    .Select(r => new
                    {
                        r.Id,
                        r.EntryNo,
                        r.Date,
                        r.DealerName,
                        r.DistributorName,
                        r.InvoiceNo,
                        r.TotalQty
                    })
                    .ToList();

                return Json(filteredReturns);
            }
            catch (Exception ex)
            {
                return Json(new List<object>());
            }
        }

        // GET: Get single Sales Return by Id
        [HttpGet]
        public IActionResult GetSalesReturnById(int id)
        {
            try
            {
                var salesReturn = _salesReturns.FirstOrDefault(r => r.Id == id);
                
                if (salesReturn == null)
                {
                    return Json(new { success = false, message = "Sales Return not found" });
                }

                return Json(salesReturn);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // POST: Save Sales Return (Create or Update)
        [HttpPost]
        public IActionResult SaveSalesReturn([FromBody] SalesReturnModel model)
        {
            try
            {
                // Validate the model
                if (model == null || model.Items == null || model.Items.Count == 0)
                {
                    return Json(new { success = false, message = "Invalid data" });
                }

                if (model.Id > 0)
                {
                    // Update existing
                    var existing = _salesReturns.FirstOrDefault(r => r.Id == model.Id);
                    if (existing != null)
                    {
                        existing.Date = model.Date;
                        existing.DealerCode = model.DealerCode;
                        existing.DealerName = model.DealerName;
                        existing.DistributorCode = model.DistributorCode;
                        existing.DistributorName = model.DistributorName;
                        existing.InvoiceNo = model.InvoiceNo;
                        existing.Items = model.Items;
                        existing.TotalQty = model.TotalQty;
                    }
                }
                else
                {
                    // Create new
                    model.Id = _nextId++;
                    _salesReturns.Add(model);
                }

                return Json(new 
                { 
                    success = true, 
                    message = "Sales Return saved successfully",
                    id = model.Id,
                    entryNo = model.EntryNo 
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // POST: Delete Sales Return
        [HttpPost]
        public IActionResult DeleteSalesReturn(int id)
        {
            try
            {
                var salesReturn = _salesReturns.FirstOrDefault(r => r.Id == id);
                
                if (salesReturn == null)
                {
                    return Json(new { success = false, message = "Sales Return not found" });
                }

                _salesReturns.Remove(salesReturn);

                return Json(new { success = true, message = "Sales Return deleted successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // Example JSON endpoint (legacy - can be removed)
        [HttpGet]
        public IActionResult GetReturnsForCustomer(int customerId)
        {
            var data = new[]
            {
                new { ReturnNo = "SR-1001", Date = "01-Jan-2025", OrderNo = "ORD-5001", Item = "Item A", Qty = 10, Reason = "Damaged" },
                new { ReturnNo = "SR-1002", Date = "05-Jan-2025", OrderNo = "ORD-5003", Item = "Item B", Qty = 2, Reason = "Wrong Item" }
            };

            return Json(data);
        }
    }

    // Model classes for Sales Return
    public class SalesReturnModel
    {
        public int Id { get; set; }
        public string EntryNo { get; set; }
        public string Date { get; set; }
        public string DealerCode { get; set; }
        public string DealerName { get; set; }
        public string DistributorCode { get; set; }
        public string DistributorName { get; set; }
        public string InvoiceNo { get; set; }
        public List<SalesReturnItemModel> Items { get; set; }
        public decimal TotalQty { get; set; }
    }

    public class SalesReturnItemModel
    {
        public string ItemCode { get; set; }
        public string ItemName { get; set; }
        public decimal Qty { get; set; }
        public string Remarks { get; set; }
    }
}
