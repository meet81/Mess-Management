using System.ComponentModel.DataAnnotations;

namespace MessManagement.Api.Models
{
    public class Permission
    {
        public int PermissionId { get; set; }

        [Required]
        [StringLength(100)]
        public string ModuleName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string PermissionType { get; set; } = string.Empty;

        [StringLength(150)]
        public string DisplayName { get; set; } = string.Empty;

        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
