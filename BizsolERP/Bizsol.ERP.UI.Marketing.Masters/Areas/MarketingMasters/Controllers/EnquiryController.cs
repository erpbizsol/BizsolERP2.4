using Microsoft.AspNetCore.Mvc;

namespace Bizsol.WebERP.UI.Marketing.Masters.Areas.MarketingMasters.Controllers
{
	[Area("MarketingMasters")]
	public class EnquiryController : Controller
	{
		public IActionResult EnquiryMaster()
		{
			return View();
		}
	}
}

