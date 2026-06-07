using MessManagement.Api.DTOs;
using MessManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Services
{
    public class RbacService
    {
        private readonly AppDbContext _context;

        public RbacService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<PermissionDto>> GetPermissionsForRoleAsync(string roleName)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return new List<PermissionDto>();
            }

            return await _context.RolePermissions
                .AsNoTracking()
                .Where(rp => rp.Role != null && rp.Permission != null &&
                    rp.Role.RoleName == roleName &&
                    rp.Role.Status == "Active")
                .OrderBy(rp => rp.Permission!.ModuleName)
                .ThenBy(rp => rp.Permission!.PermissionType)
                .Select(rp => new PermissionDto
                {
                    PermissionId = rp.Permission!.PermissionId,
                    ModuleName = rp.Permission.ModuleName,
                    PermissionType = rp.Permission.PermissionType,
                    DisplayName = rp.Permission.DisplayName
                })
                .ToListAsync();
        }

        public async Task<bool> HasPermissionAsync(string roleName, string moduleName, string permissionType)
        {
            if (string.IsNullOrWhiteSpace(roleName))
            {
                return false;
            }

            return await _context.RolePermissions.AnyAsync(rp =>
                rp.Role != null &&
                rp.Permission != null &&
                rp.Role.RoleName == roleName &&
                rp.Role.Status == "Active" &&
                rp.Permission.ModuleName == moduleName &&
                rp.Permission.PermissionType == permissionType);
        }
    }
}
