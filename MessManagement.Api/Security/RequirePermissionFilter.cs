using System.Security.Claims;
using MessManagement.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MessManagement.Api.Security
{
    public class RequirePermissionFilter : IAsyncAuthorizationFilter
    {
        private readonly string _moduleName;
        private readonly string _permissionType;
        private readonly RbacService _rbacService;

        public RequirePermissionFilter(string moduleName, string permissionType, RbacService rbacService)
        {
            _moduleName = moduleName;
            _permissionType = permissionType;
            _rbacService = rbacService;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            if (context.HttpContext.User.Identity?.IsAuthenticated != true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var roleName = context.HttpContext.User.FindFirst(ClaimTypes.Role)?.Value;
            var allowed = await _rbacService.HasPermissionAsync(roleName ?? string.Empty, _moduleName, _permissionType);
            if (!allowed)
            {
                context.Result = new ForbidResult();
            }
        }
    }
}
