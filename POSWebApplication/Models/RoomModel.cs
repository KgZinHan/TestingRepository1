namespace POSWebApplication.Models
{
    public class RoomModel
    {
        public string RoomNo { get; set; } = string.Empty;

        public string GuestName { get; set; } = string.Empty;

        public string CheckInId { get; set; } = string.Empty;

        public bool CheckOutFlg { get; set; }
    }
}
