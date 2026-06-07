namespace MessManagement.Api.DTOs
{
    public class PermissionDto
    {
        public int PermissionId { get; set; }
        public string ModuleName { get; set; } = string.Empty;
        public string PermissionType { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
    }

    public class RoleDto
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Active";
        public bool IsSystemRole { get; set; }
        public bool AllowDashboardAccess { get; set; }
        public List<PermissionDto> Permissions { get; set; } = new();
    }

    public class SaveRoleDto
    {
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Active";
        public bool IsSystemRole { get; set; }
        public bool AllowDashboardAccess { get; set; } = true;
        public List<int> PermissionIds { get; set; } = new();
    }

    public class AssignPermissionsDto
    {
        public int RoleId { get; set; }
        public List<int> PermissionIds { get; set; } = new();
    }

    public class CreatePermissionModuleDto
    {
        public string ModuleName { get; set; } = string.Empty;
    }
}
