using Microsoft.EntityFrameworkCore;
using MessManagement.Api.Models;

namespace MessManagement.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
        public DbSet<Leave> Leaves { get; set; }
        public DbSet<StaffSalary> StaffSalaries { get; set; }
        
        // Inventory Module
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<InventoryItem> InventoryItems { get; set; }
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; }
        
        // Vegetable Planning Module
        public DbSet<MealVegetablePlan> MealVegetablePlans { get; set; }
        public DbSet<DailyVegetableUsage> DailyVegetableUsages { get; set; }
        public DbSet<VendorOrderSuggestion> VendorOrderSuggestions { get; set; }
        public DbSet<MenuIngredientMapping> MenuIngredientMappings { get; set; }
        public DbSet<VendorOrder> VendorOrders { get; set; }

        // New Modules
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<QrAttendance> QrAttendances { get; set; }
        public DbSet<SalaryAdvance> SalaryAdvances { get; set; }
        public DbSet<OvertimeRecord> OvertimeRecords { get; set; }
        public DbSet<AppRole> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ✅ Table Mapping
            modelBuilder.Entity<User>().ToTable("Users");
            modelBuilder.Entity<Menu>().ToTable("Menu");
            modelBuilder.Entity<Attendance>().ToTable("Attendance");
            modelBuilder.Entity<Payment>().ToTable("Payments");
            modelBuilder.Entity<Feedback>().ToTable("Feedback");
            modelBuilder.Entity<Leave>().ToTable("Leave");
            modelBuilder.Entity<StaffSalary>().ToTable("StaffSalaries");

            // Inventory Module Table Mapping
            modelBuilder.Entity<Vendor>().ToTable("Vendors");
            modelBuilder.Entity<InventoryItem>().ToTable("InventoryItems")
                .HasKey(i => i.InventoryId);
            modelBuilder.Entity<InventoryTransaction>().ToTable("InventoryTransactions")
                .HasKey(t => t.TransactionId);

            // Vegetable Planning Module Table Mapping
            modelBuilder.Entity<MealVegetablePlan>().ToTable("meal_vegetable_plans");
            modelBuilder.Entity<DailyVegetableUsage>().ToTable("daily_vegetable_usage");
            modelBuilder.Entity<VendorOrderSuggestion>().ToTable("vendor_order_suggestions");
            modelBuilder.Entity<MenuIngredientMapping>().ToTable("menu_ingredient_mapping");
            modelBuilder.Entity<VendorOrder>().ToTable("vendor_orders");

            // System Settings & QR Mapping
            modelBuilder.Entity<SystemSetting>().ToTable("system_settings");
            modelBuilder.Entity<QrAttendance>().ToTable("qr_attendance")
                .HasKey(q => q.AttendanceId);

            // Enterprise Salary Module Mapping
            modelBuilder.Entity<SalaryAdvance>().ToTable("salary_advances")
                .HasKey(a => a.AdvanceId);
            modelBuilder.Entity<SalaryAdvance>()
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OvertimeRecord>().ToTable("overtime_records")
                .HasKey(o => o.OvertimeId);
            modelBuilder.Entity<OvertimeRecord>()
                .HasOne(o => o.User)
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AppRole>().ToTable("roles")
                .HasKey(r => r.RoleId);
            modelBuilder.Entity<AppRole>()
                .HasIndex(r => r.RoleName)
                .IsUnique();

            modelBuilder.Entity<Permission>().ToTable("permissions")
                .HasKey(p => p.PermissionId);
            modelBuilder.Entity<Permission>()
                .HasIndex(p => new { p.ModuleName, p.PermissionType })
                .IsUnique();

            modelBuilder.Entity<RolePermission>().ToTable("role_permissions")
                .HasKey(rp => rp.RolePermissionId);
            modelBuilder.Entity<RolePermission>()
                .HasIndex(rp => new { rp.RoleId, rp.PermissionId })
                .IsUnique();
            modelBuilder.Entity<RolePermission>()
                .HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<RolePermission>()
                .HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
            
            modelBuilder.Entity<MealVegetablePlan>()
                .HasOne(m => m.Vegetable)
                .WithMany()
                .HasForeignKey(m => m.VegetableId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DailyVegetableUsage>()
                .HasOne(d => d.Vegetable)
                .WithMany()
                .HasForeignKey(d => d.VegetableId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<VendorOrderSuggestion>()
                .HasOne(v => v.Vegetable)
                .WithMany()
                .HasForeignKey(v => v.VegetableId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<VendorOrderSuggestion>()
                .HasOne(v => v.PreferredVendor)
                .WithMany()
                .HasForeignKey(v => v.PreferredVendorId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<MenuIngredientMapping>()
                .HasOne(m => m.Ingredient)
                .WithMany()
                .HasForeignKey(m => m.IngredientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<VendorOrder>()
                .HasOne(v => v.Ingredient)
                .WithMany()
                .HasForeignKey(v => v.IngredientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<VendorOrder>()
                .HasOne(v => v.Vendor)
                .WithMany()
                .HasForeignKey(v => v.VendorId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<InventoryItem>()
                .HasOne(i => i.Vendor)
                .WithMany()
                .HasForeignKey(i => i.VendorId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<InventoryTransaction>()
                .HasOne(t => t.InventoryItem)
                .WithMany()
                .HasForeignKey(t => t.InventoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ Unique Email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // ✅ StaffSalary Relationships
            modelBuilder.Entity<StaffSalary>()
                .HasOne(s => s.User)
                .WithMany() // or .WithMany(u => u.StaffSalaries) if added in User model
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ Prevent duplicate salary for same month
            modelBuilder.Entity<StaffSalary>()
                .HasIndex(s => new { s.UserId, s.Month, s.Year })
                .IsUnique();

            // ✅ QR Attendance Relationship
            modelBuilder.Entity<QrAttendance>()
                .HasOne(q => q.User)
                .WithMany()
                .HasForeignKey(q => q.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // ✅ Fix EF Core decimal warnings globally
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetColumnType("decimal(18,2)");
            }
        }
    }
}
