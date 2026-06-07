using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLeaveMeals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BreakfastLeave",
                table: "Leave",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DinnerLeave",
                table: "Leave",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "LunchLeave",
                table: "Leave",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BreakfastLeave",
                table: "Leave");

            migrationBuilder.DropColumn(
                name: "DinnerLeave",
                table: "Leave");

            migrationBuilder.DropColumn(
                name: "LunchLeave",
                table: "Leave");
        }
    }
}
