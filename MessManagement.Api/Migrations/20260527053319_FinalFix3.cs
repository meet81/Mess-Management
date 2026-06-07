using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class FinalFix3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("IF COL_LENGTH('daily_vegetable_usage', 'ConfirmedUsageEntry') IS NULL ALTER TABLE daily_vegetable_usage ADD ConfirmedUsageEntry bit NOT NULL DEFAULT 1;");
            migrationBuilder.Sql("IF COL_LENGTH('daily_vegetable_usage', 'DeductedFromInventory') IS NULL ALTER TABLE daily_vegetable_usage ADD DeductedFromInventory bit NOT NULL DEFAULT 1;");
            migrationBuilder.Sql("IF COL_LENGTH('daily_vegetable_usage', 'LowStockAlertSent') IS NULL ALTER TABLE daily_vegetable_usage ADD LowStockAlertSent bit NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("IF COL_LENGTH('daily_vegetable_usage', 'MarkMealPrepared') IS NULL ALTER TABLE daily_vegetable_usage ADD MarkMealPrepared bit NOT NULL DEFAULT 1;");
            migrationBuilder.Sql("IF COL_LENGTH('daily_vegetable_usage', 'WastageCannotBeReused') IS NULL ALTER TABLE daily_vegetable_usage ADD WastageCannotBeReused bit NOT NULL DEFAULT 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
