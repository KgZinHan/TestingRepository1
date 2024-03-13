using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using POSWebApplication.Data;
using POSWebApplication.Models;

namespace POSWebApplication.Controllers.AdminControllers.StockControllers
{
    [Authorize]
    public class StockCategoryPrinterController : Controller
    {
        private readonly POSWebAppDbContext _context;

        public StockCategoryPrinterController(POSWebAppDbContext context)
        {
            _context = context;
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

            var list = await _context.ms_stockcategoryprinter.ToListAsync();

            return View(list);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CategoryPrinter catgPrinter)
        {
            if (ModelState.IsValid)
            {
                _context.Add(catgPrinter);
                await _context.SaveChangesAsync();
                TempData["info message"] = "Category Printer is successfully created.";
            }
            else
            {
                TempData["warning message"] = "Required fields must be filled";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(CategoryPrinter catgPrinter)
        {
            if (ModelState.IsValid)
            {
                _context.ms_stockcategoryprinter.Update(catgPrinter);
                await _context.SaveChangesAsync();
                TempData["info message"] = "Category Printer is successfully updated!";
            }
            else
            {
                TempData["warning message"] = "Required fields must be filled.";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(CategoryPrinter catgPrinter)
        {
            var dbCatgPrinter = await _context.ms_stockcategoryprinter.FindAsync(catgPrinter.CatgPrinterId);
            if (dbCatgPrinter != null)
            {
                _context.ms_stockcategoryprinter.Remove(dbCatgPrinter);
            }

            await _context.SaveChangesAsync();
            TempData["info message"] = "Category Printer is successfully deleted.";
            return RedirectToAction(nameof(Index));
        }

        #endregion


        #region // Partial View methods //

        public IActionResult AddCatgPrinterPartial()
        {
            ViewData["catgList"] = new SelectList(_context.ms_stockcategory, "CategoryId", "CategoryId");
            return PartialView("_AddCatgPrinterPartial");
        }

        public async Task<IActionResult> EditCatgPrinterPartial(short catgPrinterId)
        {
            var catgPrinter = await _context.ms_stockcategoryprinter.FindAsync(catgPrinterId);
            ViewData["catgList"] = new SelectList(_context.ms_stockcategory, "CategoryId", "CategoryId");
            return PartialView("_EditCatgPrinterPartial", catgPrinter);
        }


        public async Task<IActionResult> DeleteCatgPrinterPartial(short catgPrinterId)
        {
            var catgPrinter = await _context.ms_stockcategoryprinter.FindAsync(catgPrinterId);

            return PartialView("_DeleteCatgPrinterPartial", catgPrinter);
        }

        #endregion


        #region // Global methods (Important!) //

        private int GetCmpyId()
        {
            var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
            var cmpyId = _context.pos_user.Where(user => user.UserCde == userCde).Select(user => user.CmpyId).FirstOrDefault();
            return cmpyId;
        }

        protected void SetLayOutData()
        {
            var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
            var user = _context.pos_user.FirstOrDefault(u => u.UserCde == userCde);

            if (user != null)
            {
                ViewData["Username"] = user.UserNme;

                var accLevel = _context.ms_usermenuaccess.FirstOrDefault(u => u.MnuGrpId == user.MnuGrpId)?.AccLevel;
                ViewData["User Role"] = accLevel.HasValue ? $"accessLvl{accLevel}" : null;

                var POS = _context.ms_userpos.FirstOrDefault(pos => pos.UserId == user.UserId);

                var bizDte = _context.ms_hotelinfo
                    .Where(info => info.Cmpyid == GetCmpyId())
                    .Select(info => info.Hoteldte)
                    .FirstOrDefault() ?? new DateTime(1990, 01, 01);

                ViewData["Business Date"] = bizDte.ToString("dd MMM yyyy");
            }
        }

        #endregion

    }
}
