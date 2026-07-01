using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExpTracker.Infrastructure.Data.Migrations.PersonalBills
{
    /// <inheritdoc />
    public partial class AddMarketingOptIn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MarketingOptIn",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MarketingOptIn",
                table: "AspNetUsers");
        }
    }
}
