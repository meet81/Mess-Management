using System.Security.Claims;
using MessManagement.Api.Data;
using MessManagement.Api.DTOs;
using MessManagement.Api.Models;
using MessManagement.Api.Security;
using MessManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MessManagement.Api.Controllers
{
    [Route("api/permissions")]
    [ApiController]
    [Authorize]
    public class PermissionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly RbacService _rbacService;

        public PermissionsController(AppDbContext context, RbacService rbacService)
        {
            _context = context;
            _rbacService = rbacService;
        }

        [HttpGet]
        [RequirePermission("Roles", "View")]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _context.Permissions
                .OrderBy(p => p.ModuleName)
                .ThenBy(p => p.PermissionType)
                .Select(p => new PermissionDto
                {
                    PermissionId = p.PermissionId,
                    ModuleName = p.ModuleName,
                    PermissionType = p.PermissionType,
                    DisplayName = p.DisplayName
                })
                .ToListAsync();

            return Ok(permissions);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyPermissions()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return Ok(await _rbacService.GetPermissionsForRoleAsync(role ?? string.Empty));
        }

        [HttpPost("modules")]
        [RequirePermission("Roles", "Create")]
        public async Task<IActionResult> CreateModule([FromBody] CreatePermissionModuleDto dto)
        {
            var moduleName = dto.ModuleName.Trim();
            if (string.IsNullOrWhiteSpace(moduleName))
            {
                return BadRequest(new { message = "Module name is required." });
            }

            if (await _context.Permissions.AnyAsync(p => p.ModuleName == moduleName))
            {
                return BadRequest(new { message = "Module already exists in the permission matrix." });
            }

            var actions = new[] { "View", "Read", "Create", "Edit", "Update", "Delete", "Approve", "Export" };
            var permissions = actions.Select(action => new Permission
            {
                ModuleName = moduleName,
                PermissionType = action,
                DisplayName = $"{moduleName} {action}"
            }).ToList();

            _context.Permissions.AddRange(permissions);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPermissions), permissions.Select(p => new PermissionDto
            {
                PermissionId = p.PermissionId,
                ModuleName = p.ModuleName,
                PermissionType = p.PermissionType,
                DisplayName = p.DisplayName
            }));
        }

        [HttpGet("user/{id:int}")]
        [RequirePermission("Roles", "View")]
        public async Task<IActionResult> GetUserPermissions(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            return Ok(await _rbacService.GetPermissionsForRoleAsync(user.Role));
        }

        [HttpPost("assign")]
        [RequirePermission("Roles", "Edit")]
        public async Task<IActionResult> AssignPermissions([FromBody] AssignPermissionsDto dto)
        {
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
            {
                return NotFound(new { message = "Role not found." });
            }

            var existing = _context.RolePermissions.Where(rp => rp.RoleId == dto.RoleId);
            _context.RolePermissions.RemoveRange(existing);

            var validPermissionIds = await _context.Permissions
                .Where(p => dto.PermissionIds.Contains(p.PermissionId))
                .Select(p => p.PermissionId)
                .ToListAsync();

            _context.RolePermissions.AddRange(validPermissionIds.Select(permissionId => new RolePermission
            {
                RoleId = dto.RoleId,
                PermissionId = permissionId
            }));

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
