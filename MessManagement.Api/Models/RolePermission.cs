namespace MessManagement.Api.Models
{
    public class RolePermission
    {
        public int RolePermissionId { get; set; }
        public int RoleId { get; set; }
        public int PermissionId { get; set; }

        public AppRole? Role { get; set; }
        public Permission? Permission { get; set; }
    }
}
