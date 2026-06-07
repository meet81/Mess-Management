using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInventoryAndVegetableTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IngredientId",
                table: "vendor_order_suggestions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "IngredientName",
                table: "menu_ingredient_mapping",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MenuItemId",
                table: "menu_ingredient_mapping",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MenuItemName",
                table: "menu_ingredient_mapping",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "menu_ingredient_mapping",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdated",
                table: "Menu",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ApprovedLeaveCount",
                table: "meal_vegetable_plans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AttendanceTrendCount",
                table: "meal_vegetable_plans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BufferCount",
                table: "meal_vegetable_plans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CalculatedStatus",
                table: "meal_vegetable_plans",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MenuItemId",
                table: "meal_vegetable_plans",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StaffAttendanceCount",
                table: "meal_vegetable_plans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "SafetyStock",
                table: "InventoryItems",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "MenuItem",
                table: "daily_vegetable_usage",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PlanId",
                table: "daily_vegetable_usage",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "vendor_orders",
                columns: table => new
                {
                    VendorOrderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<int>(type: "int", nullable: true),
                    VendorName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IngredientId = table.Column<int>(type: "int", nullable: false),
                    IngredientName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedDeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendor_orders", x => x.VendorOrderId);
                    table.ForeignKey(
                        name: "FK_vendor_orders_InventoryItems_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "InventoryItems",
                        principalColumn: "InventoryId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_vendor_orders_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "VendorId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_vendor_orders_IngredientId",
                table: "vendor_orders",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_vendor_orders_VendorId",
                table: "vendor_orders",
                column: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "vendor_orders");

            migrationBuilder.DropColumn(
                name: "IngredientId",
                table: "vendor_order_suggestions");

            migrationBuilder.DropColumn(
                name: "IngredientName",
                table: "menu_ingredient_mapping");

            migrationBuilder.DropColumn(
                name: "MenuItemId",
                table: "menu_ingredient_mapping");

            migrationBuilder.DropColumn(
                name: "MenuItemName",
                table: "menu_ingredient_mapping");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "menu_ingredient_mapping");

            migrationBuilder.DropColumn(
                name: "LastUpdated",
                table: "Menu");

            migrationBuilder.DropColumn(
                name: "ApprovedLeaveCount",
                table: "meal_vegetable_plans");

            migrationBuilder.DropColumn(
                name: "AttendanceTrendCount",
                table: "meal_vegetable_plans");

            migrationBuilder.DropColumn(
                name: "BufferCount",
                table: "meal_vegetable_plans");

            migrationBuilder.DropColumn(
                name: "CalculatedStatus",
                table: "meal_vegetable_plans");

            migrationBuilder.DropColumn(
                name: "MenuItemId",
                table: "meal_vegetable_plans");

            migrationBuilder.DropColumn(
                name: "StaffAttendanceCount",
                table: "meal_vegetable_plans");

            migrationBuilder.DropColumn(
                name: "SafetyStock",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "MenuItem",
                table: "daily_vegetable_usage");

            migrationBuilder.DropColumn(
                name: "PlanId",
                table: "daily_vegetable_usage");
        }
    }
}
