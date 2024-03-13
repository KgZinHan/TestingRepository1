using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace POSWebApplication.Models
{
    public class CategoryPrinter
    {
        [Key] public short CatgPrinterId { get; set; }

        [DisplayName("Printer Name")] public string PrinterNme { get; set; } = string.Empty;

        [DisplayName("Category")] public string CatgCde { get; set; } = string.Empty;
    }
}
