using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using POSWebApplication.Data;
using POSWebApplication.Models;

namespace POSWebApplication.Controllers.AdminControllers.StockControllers
{
    [Authorize]
    public class SpecialInstructionController : Controller
    {
        private readonly POSWebAppDbContext _context;

        public SpecialInstructionController(POSWebAppDbContext context)
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

            var list = await _context.specialInstruction.ToListAsync();
            return View(list);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(SpecialInstruction specialInstruction)
        {
            if (ModelState.IsValid)
            {
                _context.Add(specialInstruction);
                await _context.SaveChangesAsync();
                TempData["info message"] = "Special Instruction is successfully created.";
            }
            else
            {
                TempData["warning message"] = "Required fields must be filled";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(SpecialInstruction specialInstruction)
        {
            if (ModelState.IsValid)
            {
                _context.specialInstruction.Update(specialInstruction);
                await _context.SaveChangesAsync();
                TempData["info message"] = "Special Instruction is successfully updated!";
            }
            else
            {
                TempData["warning message"] = "Required fields must be filled.";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(SpecialInstruction specialInstruction)
        {
            var dbSpecInstr = await _context.specialInstruction.FindAsync(specialInstruction.SpecInstrId);
            if (dbSpecInstr != null)
            {
                _context.specialInstruction.Remove(dbSpecInstr);
            }

            await _context.SaveChangesAsync();
            TempData["info message"] = "Special Instruction is successfully deleted.";
            return RedirectToAction(nameof(Index));
        }

        #endregion


        #region // Partial View methods //

        public IActionResult AddSpecInstrPartial()
        {
            ViewData["itemIds"] = new SelectList(_context.ms_stock, "ItemId", "ItemDesc");
            return PartialView("_AddSpecInstrPartial");
        }

        public async Task<IActionResult> EditSpecInstrPartial(int specInstrId)
        {
            var specInstr = await _context.specialInstruction.FindAsync(specInstrId);
            ViewData["itemIds"] = new SelectList(_context.ms_stock, "ItemId", "ItemDesc");
            return PartialView("_EditSpecInstrPartial", specInstr);
        }


        public async Task<IActionResult> DeleteSpecInstrPartial(int specInstrId)
        {
            var specInstr = await _context.specialInstruction.FindAsync(specInstrId);
            return PartialView("_DeleteSpecInstrPartial", specInstr);
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
