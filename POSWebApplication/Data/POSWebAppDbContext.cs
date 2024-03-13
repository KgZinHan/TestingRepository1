using Hotel_Core_MVC_V1.Models;
using Microsoft.EntityFrameworkCore;
using POSWebApplication.Models;

namespace POSWebApplication.Data
{
    public class POSWebAppDbContext : DbContext
    {
        public POSWebAppDbContext(DbContextOptions<POSWebAppDbContext> options) : base(options) { }

        /*User*/
        public DbSet<User> pos_user { get; set; }
        public DbSet<UserPOS> ms_userpos { get; set; }
        public DbSet<UserMenuGroup> ms_usermenugrp { get; set; }
        public DbSet<MenuAccess> ms_usermenuaccess { get; set; }

        /*Stock*/
        public DbSet<Stock> ms_stock { get; set; }
        public DbSet<StockUOM> ms_stockuom { get; set; }
        public DbSet<StockCategory> ms_stockcategory { get; set; }
        public DbSet<StockGroup> ms_stockgroup { get; set; }
        public DbSet<ServiceItem> ms_serviceitem { get; set; }
        public DbSet<StockBOM> ms_stockbom { get; set; }
        public DbSet<StockPkgH> ms_stockpkgh { get; set; }
        public DbSet<StockPkgD> ms_stockpkgd { get; set; }
        public DbSet<SpecialInstruction> specialInstruction { get; set; }


        /*Sale*/
        public DbSet<Billd> billd { get; set; }
        public DbSet<Billh> billh { get; set; }
        public DbSet<Billp> billp { get; set; }
        public DbSet<TableDefinition> tabledefinition { get; set; }

        /*Inventory*/
        public DbSet<InventoryBillH> icarap { get; set; }
        public DbSet<InventoryMoveBillH> icmove { get; set; }
        public DbSet<InventoryBillD> icarapdetail { get; set; }
        public DbSet<Supplier> ms_apvend { get; set; }
        public DbSet<Customer> ms_arcust { get; set; }
        public DbSet<SupplierItem> ms_stockapvend { get; set; }
        public DbSet<InventoryAutoNumber> ictranautonumber { get; set; }
        public DbSet<ICReason> icreason { get; set; }

        /*Others*/
        public DbSet<Currency> ms_currency { get; set; }
        public DbSet<AutoNumber> ms_autonumber { get; set; }
        public DbSet<Location> ms_location { get; set; }
        public DbSet<CategoryPrinter> ms_stockcategoryprinter { get; set; }

        /*Hotel Link*/
        public DbSet<PmsGuestbilling> pms_guestbilling { get; set; }

        public DbSet<PmsRoomledger> pms_roomledger { get; set; }

        public DbSet<PmsCheckinroomguest> pms_checkinroomguest { get; set; }

        public DbSet<PmsCheckin> pms_checkin { get; set; }

        public DbSet<MsGuestdatum> ms_guestdata { get; set; }

        public DbSet<MsHotelinfo> ms_hotelinfo { get; set; }

        public DbSet<RoomFolio> pms_roomfolioh { get; set; }
        public DbSet<SysConfig> sysconfig { get; set; }

    }
}
