using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class FinalFix2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("IF COL_LENGTH('InventoryItems', 'AlertWhenLowStock') IS NULL ALTER TABLE InventoryItems ADD AlertWhenLowStock bit NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("IF COL_LENGTH('InventoryItems', 'IsPerishable') IS NULL ALTER TABLE InventoryItems ADD IsPerishable bit NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("IF COL_LENGTH('InventoryItems', 'UseInMealPlanning') IS NULL ALTER TABLE InventoryItems ADD UseInMealPlanning bit NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("IF COL_LENGTH('menu_ingredient_mapping', 'IsRequired') IS NULL ALTER TABLE menu_ingredient_mapping ADD IsRequired bit NOT NULL DEFAULT 1;");
            migrationBuilder.Sql(@"
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='vendor_orders' AND xtype='U')
            BEGIN
                CREATE TABLE vendor_orders (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    IngredientId INT NOT NULL,
                    Quantity DECIMAL(18,2) NOT NULL,
                    ExpectedDeliveryDate DATETIME2 NOT NULL,
                    Status NVARCHAR(MAX) NULL,
                    VendorId INT NULL
                );
            END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
