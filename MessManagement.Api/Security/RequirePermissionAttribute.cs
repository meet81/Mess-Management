using Microsoft.AspNetCore.Mvc;

namespace MessManagement.Api.Security
{
    public class RequirePermissionAttribute : TypeFilterAttribute
    {
        public RequirePermissionAttribute(string moduleName, string permissionType)
            : base(typeof(RequirePermissionFilter))
        {
            Arguments = new object[] { moduleName, permissionType };
        }
    }
}
