using Microsoft.AspNetCore.Mvc;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Bizsol.WebERP.UI.Sales.Transactions.Areas.SalesTransactions.Controllers
{
    [Area("SalesTransactions")]
    public class SalesTransactionsController : Controller
    {
        private const string WhatsappUploadApiUrl = "http://web.bizsol.in/ERP/BizSolBlog/UploadWhatsappFile";

        private static readonly HttpClient _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromMinutes(2)
        };

        public IActionResult VerifyDispatchPlan()
        {
            return View();
        }
        public IActionResult FreightInvoice()
        {
            return View();
        }
        public IActionResult SalesPersonTargetAchievement()
        {
            return View();
        }

        [HttpPost]
        [Consumes("application/json")]
        public async Task<IActionResult> UploadWhatsappFile([FromBody] WhatsappFileUploadRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.FileDataBase64string))
            {
                return BadRequest("File data is required.");
            }

            var payload = JsonSerializer.Serialize(new
            {
                FileName = string.IsNullOrWhiteSpace(request.FileName)
                    ? "SalesPersonTargetAchievement"
                    : request.FileName.Trim(),
                FileExtension = string.IsNullOrWhiteSpace(request.FileExtension)
                    ? ".pdf"
                    : request.FileExtension.Trim(),
                FileDataBase64string = request.FileDataBase64string.Trim()
            });

            try
            {
                using var content = new StringContent(payload, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(WhatsappUploadApiUrl, content);
                var responseBody = response.Content == null
                    ? string.Empty
                    : await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, responseBody);
                }

                return Content(responseBody, "text/plain");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }

    public class WhatsappFileUploadRequest
    {
        public string? FileName { get; set; }
        public string? FileExtension { get; set; }
        public string? FileDataBase64string { get; set; }
    }
}
