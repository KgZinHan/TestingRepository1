using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using POSWebApplication.Data;
using POSWebApplication.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Reporting.NETCore;
using Microsoft.IdentityModel.Tokens;
using Hotel_Core_MVC_V1.Common;
using System.Drawing.Imaging;
using System.Drawing.Printing;
using System.Drawing;
using System.Text;
using Rectangle = System.Drawing.Rectangle;

namespace POSWebApplication.Controllers
{
    [Authorize]
    public class SaleController : Controller
    {
        private readonly POSWebAppDbContext _dbContext;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private static List<Stream> m_streams;
        private static int m_currentPageIndex = 0;

        public SaleController(POSWebAppDbContext dbContext, IWebHostEnvironment webHostEnvironment)
        {
            _dbContext = dbContext;
            _webHostEnvironment = webHostEnvironment;
        }


        #region // Main methods //

        public async Task<IActionResult> Index()
        {
            SetLayOutData();

            var stockCategories = await _dbContext.ms_stockcategory.ToListAsync();

            var billNo = GenerateAutoBillNo();

            var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
            var UPOS = _dbContext.pos_user
                .Join(_dbContext.ms_userpos,
                    user => user.UserId,
                    userPOS => userPOS.UserId,
                    (user, userPOS) => new
                    {
                        user.UserCde,
                        POSId = userPOS.POSid
                    })
                .FirstOrDefault(u => u.UserCde == userCde);

            var stocks = await _dbContext.ms_stock.ToListAsync();

            var pkgs = await _dbContext.ms_stockpkgh.ToListAsync();

            if (pkgs != null)
            {
                foreach (var pkg in pkgs)
                {
                    var stockPkg = new Stock()
                    {
                        ItemId = pkg.PkgNme,
                        ItemDesc = pkg.PkgNme,
                        SellingPrice = pkg.SellingPrice,
                        PkgHId = pkg.PkgHId,
                        Image = pkg.Image
                    };
                    stocks.Add(stockPkg);
                }
            }

            foreach (var stock in stocks)
            {
                stock.Base64Image = stock.Image != null ? Convert.ToBase64String(stock.Image) : "";
            }

            var autoNumber = _dbContext.ms_autonumber.FirstOrDefault(pos => pos.PosId == UPOS.POSId);

            if (autoNumber != null)
            {
                autoNumber.BizDteString = ChangeDateFormat(GetBizDate());
            }

            var currencyList = await _dbContext.ms_currency.ToListAsync();

            var saleList = new SaleModelList()
            {
                Stocks = stocks,
                StockCategories = stockCategories,
                BillNo = billNo,
                AutoNumber = autoNumber,
                CurrencyList = currencyList
            };

            return View(saleList);
        }

        #endregion


        #region // Sale methods //

        public string GenerateAutoBillNo()
        {
            var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
            if (string.IsNullOrEmpty(userCde))
                return "";

            var UPOS = _dbContext.pos_user
                .Join(_dbContext.ms_userpos,
                    user => user.UserId,
                    userPOS => userPOS.UserId,
                    (user, userPOS) => new
                    {
                        user.UserCde,
                        POSId = userPOS.POSid
                    })
                .FirstOrDefault(u => u.UserCde == userCde);

            if (UPOS == null)
                return "";

            var autoNumber = _dbContext.ms_autonumber.FirstOrDefault(pos => pos.PosId == UPOS.POSId);
            if (autoNumber == null)
                return "";

            // Main method of this function which generates number
            var generateNo = (autoNumber.LastUsedNo + 1).ToString();
            if (autoNumber.ZeroLeading)
            {
                var totalWidth = autoNumber.RunningNo - autoNumber.BillPrefix.Length - generateNo.Length;
                string paddedString = new string('0', totalWidth) + generateNo;
                return autoNumber.BillPrefix + paddedString;
            }
            else
            {
                return autoNumber.BillPrefix + generateNo;
            }
        }

        public async Task<List<StockUOM>> UOMList(string itemId)
        {
            return await _dbContext.ms_stockuom
                .Where(uom => uom.ItemId == itemId)
                .ToListAsync();
        }

        public async Task<List<SpecialInstruction>> GetSpecialInstructions(string itemId)
        {
            var list = await _dbContext.specialInstruction.Where(instr => instr.ItemId == itemId).ToListAsync();
            return list;
        }

        public async Task<List<TableDefinition>> TableNoList()
        {
            var tableList = await _dbContext.tabledefinition.Where(td => td.TableStatus == "vacant").ToListAsync();
            return tableList;
        }

        #endregion


        #region // Stock methods //

        public string GetItemIdByBarcode(string barcode) // Add with barcode
        {
            var itemId = _dbContext.ms_stock
                .Where(stk => stk.Barcode == barcode)
                .Select(stk => stk.ItemId)
                .FirstOrDefault();

            return itemId ?? "";
        }

        public int GetPkgHIdByBarcode(string barcode)
        {
            var pkgItem = _dbContext.ms_stockpkgh
                .Where(stk => stk.Barcode == barcode)
                .Select(stk => stk.PkgHId)
                .FirstOrDefault();

            return pkgItem;
        }

        public async Task<IActionResult> SearchItems(string keyword)
        {
            var stocks = await _dbContext.ms_stock.Where(stock => stock.ItemDesc.Contains(keyword)).ToListAsync();

            var pkgs = await _dbContext.ms_stockpkgh.Where(pkg => pkg.PkgNme.Contains(keyword)).ToListAsync();

            if (pkgs != null)
            {
                foreach (var pkg in pkgs)
                {
                    var stockPkg = new Stock()
                    {
                        ItemId = pkg.PkgNme,
                        ItemDesc = pkg.PkgNme,
                        SellingPrice = pkg.SellingPrice,
                        PkgHId = pkg.PkgHId,
                        Image = pkg.Image
                    };
                    stocks.Add(stockPkg);
                }
            }

            if (keyword == "" || keyword == string.Empty || keyword == null)
            {
                await AllStockItems();
            }

            foreach (var stock in stocks)
            {
                stock.Base64Image = stock.Image != null ? Convert.ToBase64String(stock.Image) : "";
            }
            return PartialView("_StockItems", stocks);
        }

        public async Task<IActionResult> AllStockItems()
        {
            var stocks = await _dbContext.ms_stock.ToListAsync();

            var pkgs = await _dbContext.ms_stockpkgh.ToListAsync();

            if (pkgs != null)
            {
                foreach (var pkg in pkgs)
                {
                    var stockPkg = new Stock()
                    {
                        ItemId = pkg.PkgNme,
                        ItemDesc = pkg.PkgNme,
                        SellingPrice = pkg.SellingPrice,
                        PkgHId = pkg.PkgHId,
                        Image = pkg.Image
                    };
                    stocks.Add(stockPkg);
                }
            }

            foreach (var stock in stocks)
            {
                stock.Base64Image = stock.Image != null ? Convert.ToBase64String(stock.Image) : "";
            }
            return PartialView("_StockItems", stocks);
        }

        public async Task<IActionResult> PackageStockItems()
        {
            var stockPackages = await _dbContext.ms_stockpkgh.ToListAsync();
            foreach (var stock in stockPackages)
            {
                stock.Base64Image = stock.Image != null ? Convert.ToBase64String(stock.Image) : "";
            }
            return PartialView("_StockPackageItems", stockPackages);
        }

        public async Task<IActionResult> AssemblyStockItems()
        {
            var stocks = await _dbContext.ms_stock
                .Where(stk => stk.FinishGoodFlg == true)
                .ToListAsync();
            foreach (var stock in stocks)
            {
                stock.Base64Image = stock.Image != null ? Convert.ToBase64String(stock.Image) : "";
            }
            return PartialView("_StockItems", stocks);
        }

        public async Task<IActionResult> StockItems(string catgId)
        {
            var stocks = await _dbContext.ms_stock.Where(stock => stock.CatgCde == catgId).ToListAsync();
            foreach (var stock in stocks)
            {
                stock.Base64Image = stock.Image != null ? Convert.ToBase64String(stock.Image) : "";
            }
            return PartialView("_StockItems", stocks);
        }

        public List<StockPkgD> GetItemsList(int pkgHId)
        {
            var list = _dbContext.ms_stockpkgd.Where(d => d.PkgHId == pkgHId).ToList();

            return list;
        }

        public Stock AddStock(string itemId)
        {
            var stock = _dbContext.ms_stock.FirstOrDefault(u => u.ItemId == itemId);
            if (stock != null)
            {
                stock.Quantity = 1;
                return stock;
            }
            return new Stock();
        } // Main add method


        #endregion


        #region // Bill to Room methods //

        public async Task<IEnumerable<RoomModel>> GetInHouseRoomList()
        {
            var hotelInfo = await _dbContext.ms_hotelinfo.FirstOrDefaultAsync(h => h.Cmpyid == 1);

            var roomList = await _dbContext.pms_checkin
               .Join(
                   _dbContext.pms_roomledger,
                   chkin => chkin.Checkinid,
                   ledg => ledg.Checkinid,
                   (chkin, ledg) => new { Checkin = chkin, Ledger = ledg }
               )
               .Where(joinResult => joinResult.Checkin.Checkoutflg != true)
               .GroupBy(joinResult => new { joinResult.Ledger.Roomno })
               .Select(group => new RoomModel
               {
                   CheckInId = group.Max(joinResult => joinResult.Checkin.Checkinid) ?? "",
                   RoomNo = group.Key.Roomno ?? ""
               })
               .OrderBy(result => result.RoomNo)
               .ToListAsync();

            foreach (var room in roomList)
            {
                room.GuestName = GetGuestName(room.CheckInId);
            }

            return roomList;
        }

        public async Task<IEnumerable<RoomFolio>> GetFolios(string checkInId)
        {
            var folios = await _dbContext.pms_roomfolioh.Where(folio => folio.Checkinid == checkInId).ToListAsync();

            return folios;
        }

        public async Task<string> BillToRoom(string billNo, string roomNo, decimal discAmt, string folioCde, string[][] saleTableData)
        {
            try
            {
                var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
                var UPOS = await _dbContext.pos_user
                    .Join(_dbContext.ms_userpos,
                        user => user.UserId,
                        userPOS => userPOS.UserId,
                        (user, userPOS) => new
                        {
                            user.UserId,
                            user.UserCde,
                            POSId = userPOS.POSid
                        })
                    .FirstOrDefaultAsync(u => u.UserCde == userCde);

                if (UPOS != null)
                {
                    var pos = await _dbContext.ms_autonumber.FirstOrDefaultAsync(pos => pos.PosId == UPOS.POSId);

                    var ledger = await _dbContext.pms_roomledger.FirstOrDefaultAsync(ledg => ledg.Roomno == roomNo);

                    var custFullName = await _dbContext.pms_checkinroomguest
                        .Where(crg => crg.Checkinid == ledger.Checkinid)
                        .Join(_dbContext.ms_guestdata,
                        crg => crg.Guestid,
                        gd => gd.Guestid,
                        (crg, gd) => gd.Guestfullnme)
                        .FirstOrDefaultAsync();

                    var homeCurrency = _dbContext.ms_currency.Where(curr => curr.HomeFlg == true).FirstOrDefault();

                    if (pos != null && ledger != null)
                    {
                        decimal total = 0;

                        foreach (var item in saleTableData)
                        {
                            total += decimal.Parse(item[3]) * decimal.Parse(item[4]);
                        }

                        var guestBilling = new PmsGuestbilling()
                        {
                            Refno2 = billNo,
                            Billdesp = pos.PosDefLoc,
                            Bizdte = GetBizDate(),
                            Itemid = pos.PosDefLoc,
                            Itemdesc = "POS Sale",
                            Uomcde = "POS Sale",
                            Uomrate = 1,
                            Qty = 1,
                            Pricebill = total,
                            Billdiscamt = discAmt,
                            Posid = pos.PosId,
                            Foliocde = folioCde,
                            Checkinid = ledger.Checkinid ?? "",
                            Custfullnme = custFullName ?? "",
                            Roomno = roomNo,
                            Billno = GenerateRefNo("BILL"),
                            Cmpyid = 1,
                            Userid = UPOS.UserId,
                            Shiftno = pos.CurShift,
                            Currcde = homeCurrency != null ? homeCurrency.CurrCde : "MMK",
                            Currrate = homeCurrency != null ? homeCurrency.CurrRate : 1,
                            Revdtetime = DateTime.Now
                        };
                        _dbContext.pms_guestbilling.Add(guestBilling);

                        pos.LastUsedNo++;
                        _dbContext.ms_autonumber.Update(pos);

                        await _dbContext.SaveChangesAsync();

                    }
                }
            }
            catch (Exception ex)
            {
                var message = ex.Message;
                return "Error";
            }

            var newBillNo = GenerateAutoBillNo();
            return newBillNo;
        }

        public List<Currency> GetBillToRoomCurrencies()
        {
            var currencies = _dbContext.ms_currency.Where(curr => curr.CurrTyp != "SRTN" && curr.HomeFlg == true).ToList();

            return currencies;
        }

        protected string GenerateRefNo(string posId)
        {
            var autoNumber = _dbContext.ms_autonumber.FirstOrDefault(no => no.PosId == posId);
            if (autoNumber == null)
                return "";

            var generateNo = (autoNumber.LastUsedNo + 1).ToString();
            if (autoNumber.ZeroLeading)
            {
                var totalWidth = autoNumber.RunningNo - autoNumber.BillPrefix.Length - generateNo.Length;
                string paddedString = new string('0', (int)totalWidth) + generateNo;
                return autoNumber.BillPrefix + paddedString;
            }
            else
            {
                return autoNumber.BillPrefix + generateNo;
            }
        }

        protected string GetGuestName(string checkInId)
        {
            var crg = _dbContext.pms_checkinroomguest.FirstOrDefault(crg => crg.Checkinid == checkInId && crg.Principleflg == true);
            if (crg != null)
            {
                var guestName = _dbContext.ms_guestdata.Where(gd => gd.Guestid == crg.Guestid).Select(gd => gd.Guestfullnme).FirstOrDefault();
                return guestName ?? "";
            }

            return "";

        }


        #endregion


        #region // Bill Save Btn methods //

        public async Task<int> SaveBillToBillH(string billNo, decimal discAmt, int custId, string custNme, string tableNo, string[][] tableData)
        {
            try
            {
                var dbBillH = await _dbContext.billh.FirstOrDefaultAsync(bill => bill.BillNo == billNo); // Check bill No is new or already there

                if (dbBillH != null) //  Update billH
                {
                    CheckTableStatus(dbBillH.BillhId, tableNo);

                    dbBillH.RevDteTime = DateTime.Now;
                    dbBillH.BillDiscount = discAmt;
                    dbBillH.GuestId = custId;
                    dbBillH.GuestNme = custId == 0 ? "" : custNme;
                    dbBillH.ChrgAccCde = GetCustomerAccCde(custId);
                    dbBillH.TableNo = tableNo;
                    _dbContext.Update(dbBillH);

                    UpdateBillToBillD(dbBillH.BillhId, tableData);

                    await _dbContext.SaveChangesAsync();

                    return dbBillH.BillhId;
                }
                else // Add new billH
                {
                    var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
                    var UPOS = await _dbContext.pos_user
                        .Join(_dbContext.ms_userpos,
                            user => user.UserId,
                            userPOS => userPOS.UserId,
                            (user, userPOS) => new
                            {
                                user.UserId,
                                user.UserCde,
                                POSId = userPOS.POSid
                            })
                        .FirstOrDefaultAsync(u => u.UserCde == userCde);

                    if (UPOS != null)
                    {
                        var pos = await _dbContext.ms_autonumber
                            .FirstOrDefaultAsync(pos => pos.PosId == UPOS.POSId);

                        if (pos != null)
                        {
                            // Check last BillHId
                            var billHId = await _dbContext.billh
                                .OrderByDescending(bill => bill.BillhId)
                                .Select(bill => bill.BillhId)
                                .FirstOrDefaultAsync();

                            billHId = (billHId <= 0) ? 1 : (billHId + 1); // New BillHId or add value 1 to BillHId

                            CheckTableStatus(billHId, tableNo);

                            var billh = new Billh()
                            {
                                BillhId = billHId,
                                BizDte = GetBizDate(),
                                BillNo = billNo,
                                BillTypCde = pos.BillTypCde,
                                LocCde = pos.PosDefLoc,
                                ShiftNo = pos.CurShift,
                                POSId = pos.PosId,
                                CmpyId = pos.CmpyId,
                                BillDiscount = discAmt,
                                GuestId = custId,
                                GuestNme = custId == 0 ? "" : custNme,
                                ChrgAccCde = GetCustomerAccCde(custId),
                                Status = 'S',
                                TableNo = tableNo,
                                BillOpenDteTime = DateTime.Now,
                                UserId = UPOS.UserId,
                                RevDteTime = DateTime.Now
                            };

                            _dbContext.billh.Add(billh);

                            pos.LastUsedNo++;
                            _dbContext.ms_autonumber.Update(pos);

                            SaveBillToBillD(billHId, tableData);

                            await _dbContext.SaveChangesAsync();



                            return billHId;
                        }
                        return 0;
                    }
                    return 0;
                }
            }
            catch (Exception ex)
            {
                var message = ex.Message;
                return 0;
            }
        }

        public void SaveBillToBillD(int billH, string[][] tableData)
        {
            foreach (var rowData in tableData)
            {
                var billd = new Billd()
                {
                    BillhId = billH,
                    OrdNo = short.Parse(rowData[0]),
                    ItemID = rowData[1],
                    UOMCde = rowData[2],
                    Qty = decimal.Parse(rowData[3]),
                    Price = decimal.Parse(rowData[4]),
                    DiscAmt = decimal.Parse(rowData[5]),
                    SpecInstr = rowData[7],
                    UOMRate = 1,
                    ServedById = 1,
                    PrintedCount = 0,
                    VoidFlg = false
                };

                _dbContext.billd.Add(billd);
            }

            _dbContext.SaveChanges();

        }

        public void UpdateBillToBillD(int billHId, string[][] tableData)
        {
            try
            {
                var dbBillD = _dbContext.billd
                    .Where(bill => bill.BillhId == billHId)
                    .FirstOrDefault(); // Check is there billD with given billHId

                if (dbBillD != null) // Delete them first if there is one or more
                {
                    _dbContext.billd
                        .Where(bill => bill.BillhId == billHId)
                        .ExecuteDelete();
                    _dbContext.SaveChanges();
                }

                foreach (var rowData in tableData) // iterate and add them in billD
                {
                    var billd = new Billd()
                    {
                        BillhId = billHId,
                        OrdNo = short.Parse(rowData[0]),
                        ItemID = rowData[1],
                        UOMCde = rowData[2],
                        Qty = decimal.Parse(rowData[3]),
                        Price = decimal.Parse(rowData[4]),
                        DiscAmt = decimal.Parse(rowData[5]),
                        SpecInstr = rowData[7],
                        PrintedCount = 0,
                        UOMRate = 1,
                        ServedById = 1,
                        VoidFlg = false
                    };

                    _dbContext.billd.Add(billd);
                }

                _dbContext.SaveChanges();
            }
            catch (Exception e)
            {
                var test = e.Message;
            }

        }

        public void CheckTableStatus(int billHId, string tableNo)
        {
            var previousTableNo = _dbContext.billh.Where(h => h.BillhId == billHId).Select(h => h.TableNo).FirstOrDefault();

            if (previousTableNo != null && !previousTableNo.Equals(tableNo)) // When table changing happen or table remove before bill paid.
            {
                UpdateTableStatus(previousTableNo, "Vacant");
            }

            UpdateTableStatus(tableNo, "Occupied");
        }

        public async Task<List<Billd>> GetPrintToKitchenList(int billHId)
        {
            var list = await _dbContext.billd.Where(d => d.BillhId == billHId && d.PrintedCount == 0).OrderByDescending(d => d.BilldId).ToListAsync();

            foreach (var data in list)
            {
                data.No = list.IndexOf(data) + 1;
                var stock = _dbContext.ms_stock.Where(stk => stk.ItemId == data.ItemID).FirstOrDefault();
                if (stock != null)
                {
                    data.ItemDesc = stock.ItemDesc ?? "";
                    var catgCde = stock.CatgCde;
                    data.Printer = _dbContext.ms_stockcategoryprinter.Where(p => p.CatgCde == stock.CatgCde).Select(p => p.PrinterNme).FirstOrDefault();
                    data.PrinterStatus = CheckPrinterAvailable(data.Printer);
                }
            }

            return list;
        }

        #endregion


        #region // Bill Lookup Btn methods //

        public List<Billh> SavedBillHList()
        {
            var posId = GetPOSId();
            var currDte = GetBizDate();

            var billHList = _dbContext.billh
                .Where(bill => bill.Status == 'S' && bill.POSId == posId && bill.BizDte == currDte)
                .OrderByDescending(bill => bill.BillOpenDteTime)
                .ToList();

            foreach (var billH in billHList)
            {
                billH.TotalAmount = GetTotalAmount(billH.BillhId);
            }

            return billHList;
        }

        public List<Billd> FindBill(int billhId)
        {
            var billDList = _dbContext.billd.Where(bill => bill.BillhId == billhId).ToList();

            foreach (var bill in billDList)
            {
                bill.ItemDesc = GetItemDescByItemId(bill.ItemID);
            }

            return billDList;
        }

        public string ChangeBillNo(int billhId)
        {
            var billNo = _dbContext.billh
                .Where(bill => bill.BillhId == billhId)
                .Select(bill => bill.BillNo)
                .FirstOrDefault();

            return billNo ?? "Error";
        }

        public string ChangeBillDiscount(int billhId)
        {
            var billDiscount = _dbContext.billh
                .Where(bill => bill.BillhId == billhId)
                .Select(bill => bill.BillDiscount)
                .FirstOrDefault();

            return billDiscount.ToString();
        }

        public Billh ChangeCustomer(int billhId)
        {
            var billH = _dbContext.billh
                .Where(bill => bill.BillhId == billhId)
                .FirstOrDefault();

            if (billH != null && billH.GuestNme.IsNullOrEmpty())
            {
                billH.GuestNme = "Customer";
            }

            return billH ?? new Billh();
        }

        #endregion


        #region // Bill Reprint Btn methods //

        public List<Billh> PaidBillHList()
        {
            var posId = GetPOSId();
            var currDte = GetBizDate();

            var paidBillHList = _dbContext.billh
                .Where(bill => bill.Status == 'P' && bill.POSId == posId && bill.BizDte == currDte)
                .OrderByDescending(bill => bill.BillOpenDteTime)
                .ToList();

            foreach (var paidBillH in paidBillHList)
            {
                paidBillH.TotalAmount = GetTotalAmount(paidBillH.BillhId);
            }

            return paidBillHList;
        }

        #endregion


        #region // Bill Void Btn methods //

        public List<Billh> BillHList()
        {
            var posId = GetPOSId();
            var currDte = GetBizDate();

            var billHList = _dbContext.billh
                .Where(bill => bill.Status == 'P' && bill.POSId == posId && bill.BizDte == currDte)
                .OrderByDescending(bill => bill.BillOpenDteTime)
                .ToList();

            foreach (var billH in billHList)
            {
                billH.TotalAmount = GetTotalAmount(billH.BillhId);
            }

            return billHList;
        }

        public async Task VoidBill(int billHId)
        {
            var dbBillH = await _dbContext.billh.FirstOrDefaultAsync(bill => bill.BillhId == billHId);

            if (dbBillH != null) // void billH
            {
                dbBillH.Status = 'V';
                dbBillH.RevDteTime = DateTime.Now;
                _dbContext.billh.Update(dbBillH);
            }

            var dbBillDList = await _dbContext.billd.Where(bill => bill.BillhId == billHId).ToListAsync(); // void billD
            foreach (var dbBillD in dbBillDList)
            {
                /*dbBillD.VoidFlg = true;*/
                dbBillD.VoidDteTime = DateTime.Now;
                _dbContext.billd.Update(dbBillD);
            }
            await _dbContext.SaveChangesAsync();
        }

        #endregion


        #region // Customer Btn methods //

        public List<Customer> CustomerList()
        {
            var customers = _dbContext.ms_arcust.ToList();

            return customers;
        }

        #endregion


        #region // Payment Btn methods //

        public List<Currency> GetCurrencies()
        {
            var currencies = _dbContext.ms_currency.Where(curr => curr.CurrTyp != "SRTN").ToList();

            return currencies;
        }

        public async Task<Currency> FindCurrency(string currType)
        {
            var currency = await _dbContext.ms_currency
                .FirstOrDefaultAsync(currency => currency.CurrTyp == currType);

            return currency ?? new Currency();
        }

        public async Task<Currency> FindCurrencyById(int currId)
        {
            var currency = await _dbContext.ms_currency.FirstOrDefaultAsync(curr => curr.CurrId == currId);

            return currency ?? new Currency();
        }

        public async Task<string> PaidBillToBillH(string billNo, decimal discAmt, decimal changeAmt, int custId, string custNme, string tableNo, string[][] saleTableData, string[][] paymentTableData)
        {
            try
            {
                var dbBillH = await _dbContext.billh.FirstOrDefaultAsync(bill => bill.BillNo == billNo);// Check bill is new bill or saved bill

                if (dbBillH != null)
                {
                    // this is saved bill    
                    dbBillH.GuestId = custId;
                    dbBillH.GuestNme = custId == 0 ? "" : custNme;
                    dbBillH.ChrgAccCde = GetCustomerAccCde(custId);
                    dbBillH.Status = 'P';
                    dbBillH.RevDteTime = DateTime.Now;
                    dbBillH.CollectFlg = true;
                    dbBillH.CollectDteTime = DateTime.Now;
                    dbBillH.BillDiscount = discAmt;

                    _dbContext.Update(dbBillH);
                    await _dbContext.SaveChangesAsync();

                    UpdateBillToBillD(dbBillH.BillhId, saleTableData);
                    SaveBillToBillP(dbBillH.BillhId, changeAmt, paymentTableData);
                    CheckUsedTableStatus(dbBillH.BillhId, tableNo);
                }

                else
                {
                    // this is new bill
                    var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;

                    var UPOS = await _dbContext.pos_user
                        .Join(_dbContext.ms_userpos,
                            user => user.UserId,
                            userPOS => userPOS.UserId,
                            (user, userPOS) => new
                            {
                                user.UserId,
                                user.UserCde,
                                POSId = userPOS.POSid
                            })
                        .FirstOrDefaultAsync(u => u.UserCde == userCde);

                    if (UPOS != null)
                    {
                        var pos = await _dbContext.ms_autonumber
                            .FirstOrDefaultAsync(pos => pos.PosId == UPOS.POSId);

                        if (pos != null)
                        {
                            // Check last BillHId
                            var billHId = await _dbContext.billh
                                .OrderByDescending(bill => bill.BillhId)
                                .Select(bill => bill.BillhId)
                                .FirstOrDefaultAsync();

                            billHId = (billHId <= 0) ? 1 : (billHId + 1); // New BillHId or add value 1 to BillHId

                            var billh = new Billh()
                            {
                                BillhId = billHId,
                                BizDte = GetBizDate(),
                                BillNo = billNo,
                                BillTypCde = pos.BillTypCde,
                                LocCde = pos.PosDefLoc,
                                ShiftNo = pos.CurShift,
                                POSId = pos.PosId,
                                CmpyId = pos.CmpyId,
                                BillDiscount = discAmt,
                                GuestId = custId,
                                GuestNme = custId == 0 ? "" : custNme,
                                ChrgAccCde = GetCustomerAccCde(custId),
                                Status = 'P',
                                BillOpenDteTime = DateTime.Now,
                                UserId = UPOS.UserId,
                                RevDteTime = DateTime.Now,
                                CollectFlg = true,
                                CollectDteTime = DateTime.Now
                            };

                            _dbContext.billh.Add(billh);

                            pos.LastUsedNo++;
                            _dbContext.ms_autonumber.Update(pos);

                            await _dbContext.SaveChangesAsync();

                            SaveBillToBillD(billHId, saleTableData);
                            SaveBillToBillP(billHId, changeAmt, paymentTableData);
                            CheckUsedTableStatus(billHId, tableNo);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                var message = ex.Message;
                return "Error";
            }
            var newBillNo = GenerateAutoBillNo();
            return newBillNo;
        }

        public void SaveBillToBillP(int billH, decimal changeAmt, string[][] paymentTableData)
        {
            try
            {
                foreach (var rowData in paymentTableData)
                {
                    var currency = _dbContext.ms_currency.FirstOrDefault(currency => currency.CurrTyp == rowData[0]); // find currency with currency type

                    var billP = new Billp()
                    {
                        BillhID = billH,
                        CurrTyp = rowData[0],
                        CurrCde = currency.CurrCde,
                        CurrRate = currency.CurrRate,
                        PaidAmt = decimal.Parse(rowData[1]),
                        LocalAmt = decimal.Parse(rowData[1]) * currency.CurrRate, // calculate pay amt in local amt
                        ChangeAmt = changeAmt,
                        PayDteTime = DateTime.Now
                    };

                    _dbContext.billp.Add(billP);
                }

                _dbContext.SaveChanges();
            }
            catch (Exception e)
            {
                var test = e.Message;
            }
        }

        public void CheckUsedTableStatus(int billHId, string tableNo)
        {
            var previousTableNo = _dbContext.billh.Where(h => h.BillhId == billHId).Select(h => h.TableNo).FirstOrDefault();

            if (previousTableNo != null && !previousTableNo.Equals(tableNo)) // When table changing happen or table remove before bill paid.
            {
                UpdateTableStatus(previousTableNo, "Vacant");
            }

            UpdateTableStatus(tableNo, "Vacant");
        }


        #endregion


        #region // Return Btn methods //

        public async Task<String> ReturnBillToBillH(string billNo, int custId, string custNme, decimal discAmt, string remark, string[][] saleTableData, string[][] returnTableData)
        {
            try
            {
                var changeAmt = 0; // assign zero for changeAmt

                var dbBillH = await _dbContext.billh.FirstOrDefaultAsync(bill => bill.BillNo == billNo);// Check bill is new bill or saved bill

                if (dbBillH != null)
                {
                    // this is saved bill    
                    dbBillH.GuestId = custId;
                    dbBillH.GuestNme = custId == 0 ? "" : custNme;
                    dbBillH.Status = 'R';
                    dbBillH.RevDteTime = DateTime.Now;
                    dbBillH.CollectFlg = true;
                    dbBillH.CollectDteTime = DateTime.Now;
                    dbBillH.BillDiscount = discAmt;
                    dbBillH.Remark = remark;
                    _dbContext.Update(dbBillH);
                    await _dbContext.SaveChangesAsync();

                    UpdateBillToBillD(dbBillH.BillhId, saleTableData);

                    SaveBillToBillP(dbBillH.BillhId, changeAmt, returnTableData);
                }

                else
                {
                    // this is new bill
                    var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;

                    var UPOS = await _dbContext.pos_user
                        .Join(_dbContext.ms_userpos,
                            user => user.UserId,
                            userPOS => userPOS.UserId,
                            (user, userPOS) => new
                            {
                                user.UserId,
                                user.UserCde,
                                POSId = userPOS.POSid
                            })
                        .FirstOrDefaultAsync(u => u.UserCde == userCde);

                    if (UPOS != null)
                    {
                        var pos = await _dbContext.ms_autonumber
                            .FirstOrDefaultAsync(pos => pos.PosId == UPOS.POSId);

                        if (pos != null)
                        {
                            // Check last BillHId
                            var billHId = await _dbContext.billh
                                .OrderByDescending(bill => bill.BillhId)
                                .Select(bill => bill.BillhId)
                                .FirstOrDefaultAsync();

                            billHId = (billHId <= 0) ? 1 : (billHId + 1); // New BillHId or add value 1 to BillHId

                            var billh = new Billh()
                            {
                                BillhId = billHId,
                                BizDte = GetBizDate(),
                                BillNo = billNo,
                                BillTypCde = pos.BillTypCde,
                                LocCde = pos.PosDefLoc,
                                ShiftNo = pos.CurShift,
                                POSId = pos.PosId,
                                CmpyId = pos.CmpyId,
                                BillDiscount = discAmt,
                                GuestId = custId,
                                GuestNme = custId == 0 ? "" : custNme,
                                Status = 'R',
                                BillOpenDteTime = DateTime.Now,
                                UserId = UPOS.UserId,
                                Remark = remark,
                                RevDteTime = DateTime.Now,
                                CollectFlg = true,
                                CollectDteTime = DateTime.Now
                            };

                            _dbContext.billh.Add(billh);

                            pos.LastUsedNo++;
                            _dbContext.ms_autonumber.Update(pos);

                            await _dbContext.SaveChangesAsync();

                            ReturnBillToBillD(billHId, saleTableData);

                            /*foreach (var rowData in returnTableData) //convert paidamount to minus for return
                            {
                                rowData[1] = (-decimal.Parse(rowData[1])).ToString();
                            }*/

                            SaveBillToBillP(billHId, changeAmt, returnTableData);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                var message = ex.Message;
                return "Error";
            }
            var newBillNo = GenerateAutoBillNo();
            return newBillNo;
        }

        public void ReturnBillToBillD(int billH, string[][] tableData)
        {

            foreach (var rowData in tableData)
            {
                var billd = new Billd()
                {
                    BillhId = billH,
                    OrdNo = short.Parse(rowData[0]),
                    ItemID = rowData[1],
                    UOMCde = rowData[2],
                    Qty = -decimal.Parse(rowData[3]),
                    Price = decimal.Parse(rowData[4]),
                    DiscAmt = decimal.Parse(rowData[5]),
                    UOMRate = 1,
                    ServedById = 1,
                    VoidFlg = false
                };

                _dbContext.billd.Add(billd);
            }

            _dbContext.SaveChanges();

        }

        #endregion


        #region // Print methods //

        public async Task<string> BillPrint(string billNo)
        {
            var billH = await _dbContext.billh.Where(b => b.BillNo == billNo).FirstOrDefaultAsync();

            if (billH == null)
            {
                return "Error";
            }

            var userNme = await _dbContext.pos_user.Where(u => u.UserId == billH.UserId).Select(u => u.UserNme).FirstOrDefaultAsync();
            var currTyp = await _dbContext.billp.Where(b => b.BillhID == billH.BillhId).Select(b => b.CurrTyp).FirstOrDefaultAsync();

            var billHList = await _dbContext.billh
                .Where(bill => bill.BillNo == billNo)
                .Select(billD => new BillReport
                {
                    posid = billD.POSId,
                    billno = billD.BillNo,
                    userid = userNme,
                    bizdte = billD.BizDte.ToString("dd-MM-yyyy"),
                    shiftno = billD.ShiftNo,
                    billtypcde = currTyp,
                    billdiscount = billD.BillDiscount,
                    remark = billD.Remark
                })
                .ToListAsync();


            // change to match with rdlc dataset
            var detailsList = await _dbContext.billd
                .Where(bill => bill.BillhId == billH.BillhId)
                .Select(billD => new BillReport
                {
                    itemid = billD.ItemID,
                    qty = billD.Qty,
                    discamt = billD.DiscAmt,
                    price = billD.Price
                })
                .ToListAsync();

            foreach (var detail in detailsList)
            {
                detail.itemid = GetItemDescByItemId(detail.itemid);
            }

            try
            {
                var report = new Microsoft.Reporting.NETCore.LocalReport();
                var path = $"{this._webHostEnvironment.WebRootPath}\\Report\\BillPrint.rdlc";

                report.ReportPath = path;
                report.DataSources.Add(new ReportDataSource("BillDetails", detailsList));
                report.DataSources.Add(new ReportDataSource("BillH", billHList));

                PrintToPrinter(report, "slipprintername");
                return "Success";
                //byte[] htmlBytes = report.Render("HTML4.0");
                //return File(htmlBytes, "text/html");
            }
            catch
            {
                return "Error";
            }
        }

        public async Task OrderPrint(int ptkBillHId)
        {
            var billH = await _dbContext.billh.Where(b => b.BillhId == ptkBillHId).FirstOrDefaultAsync();
            var userNme = await _dbContext.pos_user.Where(u => u.UserId == billH.UserId).Select(u => u.UserNme).FirstOrDefaultAsync();

            var billHList = await _dbContext.billh
                .Where(bill => bill.BillhId == ptkBillHId)
                .Select(billD => new BillReport
                {
                    billno = billD.BillNo,
                    bizdte = billD.BizDte.ToString("dd-MM-yyyy"),
                    shiftno = billD.ShiftNo,
                    tableno = billD.TableNo ?? "",
                    userid = userNme ?? "",
                    billopendtetime = billD.BillOpenDteTime.ToString("dd-MM-yyyy hh:mm:ss tt")
                })
                .ToListAsync();

            var detailsList = await _dbContext.billd
                .Where(bill => bill.BillhId == ptkBillHId && bill.PrintedCount == 0)
                .Select(billD => new BillReport
                {
                    itemid = billD.ItemID,
                    qty = billD.Qty,
                    remark = billD.SpecInstr ?? ""
                })
                .ToListAsync();

            foreach (var detail in detailsList)
            {
                var stock = await _dbContext.ms_stock
                    .Where(stk => stk.ItemId == detail.itemid)
                    .FirstOrDefaultAsync();

                if (stock != null)
                {
                    detail.itemid = stock.ItemDesc ?? "";

                    if (!detail.remark.IsNullOrEmpty())
                    {
                        detail.itemid = detail.itemid + "(" + detail.remark + ")";
                    }

                    detail.printer = await _dbContext.ms_stockcategoryprinter
                        .Where(p => p.CatgCde == stock.CatgCde)
                        .Select(p => p.PrinterNme)
                        .FirstOrDefaultAsync() ?? "";
                }
            }

            var list = detailsList.Where(detail => detail.printer.IsNullOrEmpty()).ToList();
            if (list.Any())
            {
                PrintOrderToPrinter(billHList, list, "");
            }

            var printerList = await _dbContext.ms_stockcategoryprinter.Select(p => p.PrinterNme).ToListAsync();
            foreach (var printer in printerList)
            {
                list = detailsList.Where(detail => detail.printer == printer).ToList();

                if (list.Any())
                {
                    PrintOrderToPrinter(billHList, list, printer);
                }
            }

            // Update Printed Count
            var updateList = await GetPrintToKitchenList(ptkBillHId);
            var newList = updateList.Where(model => model.PrintedCount == 0 && model.PrinterStatus);

            newList.ToList().ForEach(model =>
            {
                model.PrintedCount++;
                _dbContext.billd.Update(model);
            });

            await _dbContext.SaveChangesAsync();

        }

        private void PrintOrderToPrinter(List<BillReport> billHList, List<BillReport> detailsList, string printerName)
        {
            try
            {
                var name = printerName;
                if (name.IsNullOrEmpty())
                {
                    name = "Default";
                }
                var report = new LocalReport();
                var path = $"{_webHostEnvironment.WebRootPath}\\Report\\OrderPrint.rdlc";

                report.ReportPath = path;
                report.DataSources.Add(new ReportDataSource("BillH", billHList));
                report.DataSources.Add(new ReportDataSource("DataSet1", detailsList));
                report.SetParameters(new[] {
                    new ReportParameter("PrinterName",name)
                 });
                PrintToPrinter(report, printerName);
            }
            catch
            {
                return;
            }
        }

        #endregion


        #region // Common methods //

        private string GetItemDescByItemId(string itemId)
        {
            var itemDesc = _dbContext.ms_stock
                .Where(stk => stk.ItemId == itemId)
                .Select(stk => stk.ItemDesc)
                .FirstOrDefault();

            return itemDesc ?? "";
        }

        private static string ChangeDateFormat(DateTime date)
        {
            var dateOnly = DateOnly.FromDateTime(date);
            return dateOnly.ToString("dd-MM-yyyy");
        }

        protected string GetPOSId()
        {
            var userCde = HttpContext.User.Claims.FirstOrDefault()?.Value;
            var UPOS = _dbContext.pos_user
                .Join(_dbContext.ms_userpos,
                    user => user.UserId,
                    userPOS => userPOS.UserId,
                    (user, userPOS) => new
                    {
                        user.UserCde,
                        POSId = userPOS.POSid
                    })
                .FirstOrDefault(u => u.UserCde == userCde);

            return UPOS.POSId ?? "";
        }

        protected DateTime GetBizDate()
        {
            var bizDte = _dbContext.ms_hotelinfo
                    .Where(info => info.Cmpyid == CommonItems.DefaultValues.CmpyId)
                    .Select(info => info.Hoteldte)
                    .FirstOrDefault() ?? new DateTime(1990, 01, 01);

            return bizDte;
        }

        public decimal GetTotalAmount(int billhId)
        {
            var results = _dbContext.billd
                .Where(bill => bill.BillhId == billhId)
                .ToList();

            decimal total = 0;

            foreach (var result in results)
            {
                total += (result.Qty * result.Price) - result.DiscAmt;
            }

            return total;
        }

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

        public string GetCustomerAccCde(int custId)
        {
            var custAccCde = _dbContext.ms_arcust
                .Where(cust => cust.ArId == custId)
                .Select(cust => cust.ArAcCde)
                .FirstOrDefault();

            return custAccCde ?? "";

        }

        public void UpdateTableStatus(string tableNo, string status)
        {
            if (tableNo != null && tableNo != "")
            {
                string[] tableNos = tableNo.Split(',');
                foreach (var tblNo in tableNos)
                {
                    var table = _dbContext.tabledefinition.Where(td => td.TableNo == tblNo.Trim()).FirstOrDefault();
                    if (table != null)
                    {
                        table.TableStatus = status;
                        _dbContext.tabledefinition.Update(table);
                    }
                }
                _dbContext.SaveChanges();
            }
        }

        #endregion


        #region // Direct print methods for pos bill slip //

        public void PrintToPrinter(LocalReport report, string printerName)
        {
            Export(report, printerName);
        }

        public void Export(LocalReport report, string printerName, bool print = true) // change page width and height here
        {
            string deviceInfo =
             @"<DeviceInfo>
                <OutputFormat>EMF</OutputFormat>
                <PageWidth>4in</PageWidth>
                <PageHeight>12in</PageHeight>
                <MarginTop>0in</MarginTop>
                <MarginLeft>0in</MarginLeft>
                <MarginRight>0in</MarginRight>
                <MarginBottom>0in</MarginBottom>
            </DeviceInfo>";
            Warning[] warnings;
            m_streams = new List<Stream>();
            report.Render("Image", deviceInfo, CreateStream, out warnings);
            foreach (Stream stream in m_streams)
                stream.Position = 0;

            if (print)
            {
                Print(printerName);
            }
        }

        public void Print(string printerName)
        {
            if (m_streams == null || m_streams.Count == 0)
                throw new Exception("Error: no stream to print.");

            PrintDocument printDoc = new PrintDocument();

            if (!printerName.IsNullOrEmpty())
            {
                printDoc.PrinterSettings.PrinterName = printerName;
            }
            if (printerName.Equals("slipprintername"))
            {
                printerName = _dbContext.sysconfig.Where(config => config.Keycde == "slipprintername").Select(config => config.Keyvalue).FirstOrDefault() ?? "";
                printDoc.PrinterSettings.PrinterName = printerName;
            }

            if (!printDoc.PrinterSettings.IsValid)
            {
                throw new Exception("Error: cannot find the default printer.");
            }
            else
            {
                printDoc.PrintPage += new PrintPageEventHandler(PrintPage);
                m_currentPageIndex = 0;
                printDoc.Print();
            }
        }

        public static Stream CreateStream(string name, string fileNameExtension, Encoding encoding, string mimeType, bool willSeek)
        {
            Stream stream = new MemoryStream();
            m_streams.Add(stream);
            return stream;
        }

        public static void PrintPage(object sender, PrintPageEventArgs ev)
        {
            Metafile pageImage = new
               Metafile(m_streams[m_currentPageIndex]);

            // Adjust rectangular area with printer margins.
            Rectangle adjustedRect = new System.Drawing.Rectangle(
                ev.PageBounds.Left - (int)ev.PageSettings.HardMarginX,
                ev.PageBounds.Top - (int)ev.PageSettings.HardMarginY,
                ev.PageBounds.Width,
                ev.PageBounds.Height);

            // Draw a white background for the report
            ev.Graphics.FillRectangle(Brushes.White, adjustedRect);

            // Draw the report content
            ev.Graphics.DrawImage(pageImage, adjustedRect);

            // Prepare for the next page. Make sure we haven't hit the end.
            m_currentPageIndex++;
            ev.HasMorePages = (m_currentPageIndex < m_streams.Count);
        }

        public static void DisposePrint()
        {
            if (m_streams != null)
            {
                foreach (Stream stream in m_streams)
                    stream.Close();
                m_streams = null;
            }
        }

        public bool CheckPrinterAvailable(string printer)
        {
            bool available = false;
            PrintDocument printDoc = new PrintDocument();
            printDoc.PrinterSettings.PrinterName = printer;

            if (printDoc.PrinterSettings.IsValid)
            {
                available = true;
            }

            return available;
        }


        #endregion 

    }
}