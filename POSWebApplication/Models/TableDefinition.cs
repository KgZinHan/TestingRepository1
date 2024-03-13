using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace POSWebApplication.Models
{
    public class TableDefinition
    {
        [Key] public short TableId { get; set; }

        [DisplayName("Table No")] public string TableNo { get; set; } = string.Empty;

        [DisplayName("Table Status")] public string TableStatus { get; set; } = string.Empty;

        [DisplayName("Outlet")] public string Outlet { get; set; } = string.Empty;
    }
}
