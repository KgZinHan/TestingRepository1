using Hotel_Core_MVC_V1.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using POSWebApplication.Data;
using POSWebApplication.Models;

namespace POSWebApplication.Controllers.AdminControllers.SaleControllers
{
    [Authorize]
    public class TableDefinitionController : Controller
    {
        private readonly POSWebAppDbContext _dbContext;

        public TableDefinitionController(POSWebAppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        #region // Main methods //

        public async Task<IActionResult> Index()
        {
            SetLayOutData();

            if (TempData["info message"] != null)
            {
                ViewBag.InfoMessage = TempData["info message"];
            }

            if (TempData["warning message"] != null)
            {
                ViewBag.WarningMessage = TempData["warning message"];
            }

            var tables = await _dbContext.tabledefinition.ToListAsync();

            return View(tables);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(TableDefinition table)
        {
            if (ModelState.IsValid)
            {
                _dbContext.tabledefinition.Add(table);
                await _dbContext.SaveChangesAsync();
                TempData["info message"] = "Table Definition is successfully created.";
            }
            else
            {
                TempData["warning message"] = "Required fields must be filled";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(TableDefinition table)
        {
            if (ModelState.IsValid)
            {
                _dbContext.tabledefinition.Update(table);
                await _dbContext.SaveChangesAsync();
                TempData["info message"] = "Table is successfully updated!";
            }
            else
            {
                TempData["warning message"] = "Required fields must be filled.";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(short tableId)
        {
            var dbTableDefinition = await _dbContext.tabledefinition.FindAsync(tableId);
            if (dbTableDefinition != null)
            {
                _dbContext.tabledefinition.Remove(dbTableDefinition);
            }

            await _dbContext.SaveChangesAsync();
            TempData["info message"] = "Table is successfully deleted.";
            return RedirectToAction(nameof(Index));
        }

        #endregion


        #region // Partial view methods //

        public IActionResult AddTableDefinitionPartial()
        {
            ViewData["Outlets"] = new SelectList(_dbContext.ms_location.Where(loc => loc.IsOutlet == true), "LocCde", "LocCde");
            return PartialView("_AddTableDefinitionPartial");
        }

        public async Task<IActionResult> EditTableDefinitionPartial(short tableId)
        {
            var table = await _dbContext.tabledefinition.FindAsync(tableId);
            ViewData["Outlets"] = new SelectList(_dbContext.ms_location.Where(loc => loc.IsOutlet == true), "LocCde", "LocCde");
            return PartialView("_EditTableDefinitionPartial", table);
        }

        public async Task<IActionResult> DeleteTableDefinitionPartial(short tableId)
        {
            var table = await _dbContext.tabledefinition.FindAsync(tableId);
            ViewData["Outlets"] = new SelectList(_dbContext.ms_location.Where(loc => loc.IsOutlet == true), "LocCde", "LocCde");
            return PartialView("_DeleteTableDefinitionPartial", table);
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
