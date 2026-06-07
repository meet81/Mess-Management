using System.ComponentModel.DataAnnotations;

namespace MessManagement.Api.Models
{
    public class AppRole
    {
        public int RoleId { get; set; }

        [Required]
        [StringLength(100)]
        public string RoleName { get; set; } = string.Empty;

        [StringLength(250)]
        public string? Description { get; set; }

        [StringLength(30)]
        public string Status { get; set; } = "Active";

        public bool IsSystemRole { get; set; }
        public bool AllowDashboardAccess { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
}
