using Hotel_Core_MVC_V1.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using POSWebApplication.Data;
using POSWebApplication.Models;

namespace POSWebApplication.Controllers.AdminControllers.InventoryControllers
{
    [Authorize]
    public class CustomerController : Controller
    {
        private readonly POSWebAppDbContext _dbContext;

        public CustomerController(POSWebAppDbContext dbContext)
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

            var customers = await _dbContext.ms_arcust.ToListAsync();

            return View(customers);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Customer customer)
        {
            customer.Addr ??= "";
            customer.Phone ??= "";
            customer.Email ??= "";
            customer.PTerm ??= "";
            customer.PTermDay ??= 0;
            customer.CreditLimit ??= 0;
            customer.DiscPerc ??= 0;

            if (ModelState.IsValid)
            {
                var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
                var userId = await _dbContext.pos_user
                    .Where(u => u.UserCde == userCde)
                    .Select(u => u.UserId)
                    .FirstOrDefaultAsync();
                customer.UserId = userId;
                customer.RevDteTime = DateTime.Now;
                _dbContext.Add(customer);
                await _dbContext.SaveChangesAsync();
                TempData["info message"] = "Customer is successfully created.";
            }
            else
            {
                TempData["warning message"] = "Required fields must be filled";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(Customer customer)
        {
            customer.Addr ??= "";
            customer.Phone ??= "";
            customer.Email ??= "";
            customer.PTerm ??= "";
            customer.PTermDay ??= 0;
            customer.CreditLimit ??= 0;
            customer.DiscPerc ??= 0;

            if (ModelState.IsValid)
            {
                var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
                var userId = await _dbContext.pos_user
                    .Where(u => u.UserCde == userCde)
                    .Select(u => u.UserId)
                    .FirstOrDefaultAsync();
                customer.UserId = userId;
                customer.RevDteTime = DateTime.Now;
                _dbContext.ms_arcust.Update(customer);
                await _dbContext.SaveChangesAsync();
                TempData["info message"] = "Customer is successfully updated!";
            }
            else
            {
                TempData["warning message"] = "Required fields must be filled.";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int arId)
        {
            var dbCustomer = await _dbContext.ms_arcust.FindAsync(arId);
            if (dbCustomer != null)
            {
                _dbContext.ms_arcust.Remove(dbCustomer);
            }

            await _dbContext.SaveChangesAsync();
            TempData["info message"] = "Customer is successfully deleted.";
            return RedirectToAction(nameof(Index));
        }

        #endregion


        #region // Partial view methods //

        public IActionResult AddCustomerPartial()
        {
            return PartialView("_AddCustomerPartial");
        }

        public async Task<IActionResult> EditCustomerPartial(int arId)
        {
            var Customer = await _dbContext.ms_arcust.FindAsync(arId);

            return PartialView("_EditCustomerPartial", Customer);
        }

        public async Task<IActionResult> DeleteCustomerPartial(int arId)
        {
            var Customer = await _dbContext.ms_arcust.FindAsync(arId);

            return PartialView("_DeleteCustomerPartial", Customer);
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
