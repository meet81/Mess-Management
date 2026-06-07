using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class FinalFix4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF OBJECT_ID('vendor_orders', 'U') IS NOT NULL 
                    DROP TABLE vendor_orders;

                CREATE TABLE vendor_orders (
                    VendorOrderId INT IDENTITY(1,1) PRIMARY KEY,
                    VendorId INT NULL,
                    VendorName NVARCHAR(MAX) NULL,
                    IngredientId INT NOT NULL,
                    IngredientName NVARCHAR(MAX) NOT NULL,
                    Quantity DECIMAL(18,2) NOT NULL,
                    Unit NVARCHAR(MAX) NOT NULL,
                    Rate DECIMAL(18,2) NOT NULL,
                    TotalAmount DECIMAL(18,2) NOT NULL,
                    OrderDate DATETIME2 NOT NULL,
                    ExpectedDeliveryDate DATETIME2 NULL,
                    Status NVARCHAR(MAX) NOT NULL,
                    RequiresAdminApproval BIT NOT NULL,
                    IsAdminApproved BIT NOT NULL,
                    DeliveredAt DATETIME2 NULL,
                    CreatedBy NVARCHAR(MAX) NULL
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
