using System.ComponentModel.DataAnnotations;

namespace POSWebApplication.Models
{
    public class SpecialInstruction
    {
        [Key] public int SpecInstrId { get; set; }

        public string SpecInstr { get; set; } = string.Empty;

        public string ItemId { get; set; } = string.Empty;
    }
}
