using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using POSWebApplication.Models;

using POSWebApplication.Data;
using Hotel_Core_MVC_V1.Common;

namespace POSWebApplication.Controllers.AdminControllers.ManagerControllers
{
    [Authorize]
    public class SalesAnalysisController : Controller
    {
        private readonly POSWebAppDbContext _dbContext;

        public SalesAnalysisController(POSWebAppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        #region // Main methods //

        public IActionResult Index()
        {
            SetLayOutData();

            ViewData["BranchNames"] = new SelectList(_dbContext.ms_hotelinfo.ToList(), "Cmpyid", "Hotelnme");

            return View(new SalesAnalysisSearch());
        }

        [HttpPost]
        public IActionResult Search(short cmpyId, DateTime fromDate, int days, string mode, int topBottom)
        {
            var saleAnalysisAction = 0;

            if (cmpyId == 0 && mode == "Top")
            {
                saleAnalysisAction = 0;
            }
            if (cmpyId != 0 && mode == "Top")
            {
                saleAnalysisAction = 1;
            }
            if (cmpyId == 0 && mode == "Bottom")
            {
                saleAnalysisAction = 2;
            }
            if (cmpyId != 0 && mode == "Bottom")
            {
                saleAnalysisAction = 3;
            }

            var saleAnalysisList = _dbContext.spSalesAnalysisDbSet
                    .FromSqlRaw("EXEC sp_saleAnalysis @action={0},@bizdte = {1},@days = {2},@cmpyId = {3} ", saleAnalysisAction, fromDate.Date, days, cmpyId)
                    .AsEnumerable()
                    .Take(topBottom)
                    .ToList();

            foreach (var item in saleAnalysisList)
            {
                item.No = saleAnalysisList.IndexOf(item) + 1;
            }
            return PartialView("_SaleAnalysisSearchPartial", saleAnalysisList);
        }


        #endregion


        #region // Global methods (Important!) //
        protected void SetLayOutData()
        {
            var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
            var user = _dbContext.pos_user.FirstOrDefault(u => u.UserCde == userCde);

            if (user != null)
            {
                ViewData["Username"] = user.UserNme;

                var accLevel = _dbContext.ms_usermenuaccess.FirstOrDefault(u => u.MnuGrpId == user.MnuGrpId)?.AccLevel;
                ViewData["User Role"] = accLevel.HasValue ? $"accessLvl{accLevel}" : null;

                var POS = _dbContext.ms_userpos.FirstOrDefault(pos => pos.UserId == user.UserId);

                var bizDte = _dbContext.ms_hotelinfo
                    .Where(info => info.Cmpyid == CommonItems.DefaultValues.CmpyId)
                    .Select(info => info.Hoteldte)
                    .FirstOrDefault() ?? new DateTime(1990, 01, 01);

                ViewData["Business Date"] = bizDte.ToString("dd MMM yyyy");
            }
        }

        #endregion
    }
}
