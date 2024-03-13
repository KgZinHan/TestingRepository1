using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace Hotel_Core_MVC_V1.Common
{
    [Authorize]
    public class CommonItems : Controller
    {
        public static class DefaultValues
        {
            public const int CmpyId = 1;

        }

    }
}
