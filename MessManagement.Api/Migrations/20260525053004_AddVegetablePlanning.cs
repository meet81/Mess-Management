using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVegetablePlanning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "daily_vegetable_usage",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsageDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MealType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VegetableId = table.Column<int>(type: "int", nullable: false),
                    VegetableName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PlannedQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ActualUsedQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WastedQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RemainingQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UsageStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_daily_vegetable_usage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_daily_vegetable_usage_InventoryItems_VegetableId",
                        column: x => x.VegetableId,
                        principalTable: "InventoryItems",
                        principalColumn: "InventoryId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "meal_vegetable_plans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlanDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MealType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MenuItem = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VegetableId = table.Column<int>(type: "int", nullable: false),
                    VegetableName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequiredQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpectedStudentCount = table.Column<int>(type: "int", nullable: false),
                    ExpectedStaffCount = table.Column<int>(type: "int", nullable: false),
                    TotalExpectedMealCount = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meal_vegetable_plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_meal_vegetable_plans_InventoryItems_VegetableId",
                        column: x => x.VegetableId,
                        principalTable: "InventoryItems",
                        principalColumn: "InventoryId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "vendor_order_suggestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    VegetableId = table.Column<int>(type: "int", nullable: false),
                    VegetableName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AvailableStock = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NextDayRequiredQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SafetyStock = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SuggestedOrderQuantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PreferredVendorId = table.Column<int>(type: "int", nullable: true),
                    PreferredVendorName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastPurchaseRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EstimatedCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RecommendationStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vendor_order_suggestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_vendor_order_suggestions_InventoryItems_VegetableId",
                        column: x => x.VegetableId,
                        principalTable: "InventoryItems",
                        principalColumn: "InventoryId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_vendor_order_suggestions_Vendors_PreferredVendorId",
                        column: x => x.PreferredVendorId,
                        principalTable: "Vendors",
                        principalColumn: "VendorId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_daily_vegetable_usage_VegetableId",
                table: "daily_vegetable_usage",
                column: "VegetableId");

            migrationBuilder.CreateIndex(
                name: "IX_meal_vegetable_plans_VegetableId",
                table: "meal_vegetable_plans",
                column: "VegetableId");

            migrationBuilder.CreateIndex(
                name: "IX_vendor_order_suggestions_PreferredVendorId",
                table: "vendor_order_suggestions",
                column: "PreferredVendorId");

            migrationBuilder.CreateIndex(
                name: "IX_vendor_order_suggestions_VegetableId",
                table: "vendor_order_suggestions",
                column: "VegetableId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "daily_vegetable_usage");

            migrationBuilder.DropTable(
                name: "meal_vegetable_plans");

            migrationBuilder.DropTable(
                name: "vendor_order_suggestions");
        }
    }
}
