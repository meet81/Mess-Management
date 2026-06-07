using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvancesAndOvertime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmploymentType",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AdvanceRecovery",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DailySalary",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FestivalBonus",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GrossSalary",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Incentive",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "LatePenalty",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "LeaveDays",
                table: "StaffSalaries",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "LeaveDeduction",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "NetSalary",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OtherDeductions",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OvertimeRate",
                table: "StaffSalaries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "overtime_records",
                columns: table => new
                {
                    OvertimeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    OvertimeHours = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OvertimeDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApprovedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovalStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OvertimeRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_overtime_records", x => x.OvertimeId);
                    table.ForeignKey(
                        name: "FK_overtime_records_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "salary_advances",
                columns: table => new
                {
                    AdvanceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    AdvanceAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RecoveryAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RemainingAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ApprovalStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_salary_advances", x => x.AdvanceId);
                    table.ForeignKey(
                        name: "FK_salary_advances_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_overtime_records_UserId",
                table: "overtime_records",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_salary_advances_UserId",
                table: "salary_advances",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "overtime_records");

            migrationBuilder.DropTable(
                name: "salary_advances");

            migrationBuilder.DropColumn(
                name: "EmploymentType",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AdvanceRecovery",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "DailySalary",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "FestivalBonus",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "GrossSalary",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "Incentive",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "LatePenalty",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "LeaveDays",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "LeaveDeduction",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "NetSalary",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "OtherDeductions",
                table: "StaffSalaries");

            migrationBuilder.DropColumn(
                name: "OvertimeRate",
                table: "StaffSalaries");
        }
    }
}
