using System;
using System.Linq;
using MessManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=MessManagementDB;Trusted_Connection=True;MultipleActiveResultSets=true");

using (var context = new AppDbContext(optionsBuilder.Options))
{
    var vendors = context.Vendors.ToList();
    foreach(var v in vendors) {
        Console.WriteLine($"ID: {v.VendorId}, Name: {v.VendorName}");
    }
}
