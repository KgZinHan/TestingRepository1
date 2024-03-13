using System.ComponentModel.DataAnnotations;

namespace POSWebApplication.Models
{
    public class SysConfig
    {
        [Key] public string Keycde { get; set; } = null!;

        public string Keyvalue { get; set; } = null!;
    }

}
