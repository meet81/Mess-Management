using MessManagement.Api.Data;
using MessManagement.Api.DTOs;
using MessManagement.Api.Models;
using MessManagement.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Controllers
{
    [Route("api/roles")]
    [ApiController]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RolesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [RequirePermission("Roles", "View")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .OrderBy(r => r.RoleName)
                .Select(r => new RoleDto
                {
                    RoleId = r.RoleId,
                    RoleName = r.RoleName,
                    Description = r.Description,
                    Status = r.Status,
                    IsSystemRole = r.IsSystemRole,
                    AllowDashboardAccess = r.AllowDashboardAccess,
                    Permissions = r.RolePermissions
                        .Where(rp => rp.Permission != null)
                        .Select(rp => new PermissionDto
                        {
                            PermissionId = rp.Permission!.PermissionId,
                            ModuleName = rp.Permission.ModuleName,
                            PermissionType = rp.Permission.PermissionType,
                            DisplayName = rp.Permission.DisplayName
                        })
                        .OrderBy(p => p.ModuleName)
                        .ThenBy(p => p.PermissionType)
                        .ToList()
                })
                .ToListAsync();

            return Ok(roles);
        }

        [HttpPost]
        [RequirePermission("Roles", "Create")]
        public async Task<IActionResult> CreateRole([FromBody] SaveRoleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RoleName))
            {
                return BadRequest(new { message = "Role name is required." });
            }

            if (await _context.Roles.AnyAsync(r => r.RoleName == dto.RoleName))
            {
                return BadRequest(new { message = "Role already exists." });
            }

            var role = new AppRole
            {
                RoleName = dto.RoleName.Trim(),
                Description = dto.Description,
                Status = dto.Status,
                IsSystemRole = dto.IsSystemRole,
                AllowDashboardAccess = dto.AllowDashboardAccess
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            await ReplacePermissions(role.RoleId, dto.PermissionIds);

            return CreatedAtAction(nameof(GetRoles), new { id = role.RoleId }, role);
        }

        [HttpPut("{id:int}")]
        [RequirePermission("Roles", "Edit")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] SaveRoleDto dto)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                return NotFound(new { message = "Role not found." });
            }

            if (await _context.Roles.AnyAsync(r => r.RoleId != id && r.RoleName == dto.RoleName))
            {
                return BadRequest(new { message = "Role already exists." });
            }

            role.RoleName = dto.RoleName.Trim();
            role.Description = dto.Description;
            role.Status = dto.Status;
            role.IsSystemRole = dto.IsSystemRole;
            role.AllowDashboardAccess = dto.AllowDashboardAccess;

            await ReplacePermissions(role.RoleId, dto.PermissionIds);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [RequirePermission("Roles", "Delete")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                return NotFound(new { message = "Role not found." });
            }

            if (role.IsSystemRole)
            {
                return BadRequest(new { message = "System roles cannot be deleted." });
            }

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task ReplacePermissions(int roleId, List<int> permissionIds)
        {
            var existing = _context.RolePermissions.Where(rp => rp.RoleId == roleId);
            _context.RolePermissions.RemoveRange(existing);

            var validPermissionIds = await _context.Permissions
                .Where(p => permissionIds.Contains(p.PermissionId))
                .Select(p => p.PermissionId)
                .ToListAsync();

            _context.RolePermissions.AddRange(validPermissionIds.Select(permissionId => new RolePermission
            {
                RoleId = roleId,
                PermissionId = permissionId
            }));
        }
    }
}
