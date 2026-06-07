using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMealCountsToPayments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BreakfastCount",
                table: "Payments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DinnerCount",
                table: "Payments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LunchCount",
                table: "Payments",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BreakfastCount",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DinnerCount",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "LunchCount",
                table: "Payments");
        }
    }
}
