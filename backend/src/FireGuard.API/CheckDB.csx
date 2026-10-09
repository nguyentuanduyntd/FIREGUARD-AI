using System;
using System.Linq;
using FireGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseMySql("Server=localhost;Port=3307;Database=fireguard_db;User=root;Password=FireGuard@2026", ServerVersion.AutoDetect("Server=localhost;Port=3307;Database=fireguard_db;User=root;Password=FireGuard@2026"));

using (var ctx = new ApplicationDbContext(optionsBuilder.Options))
{
    Console.WriteLine($"Reminders: {ctx.MaintenanceReminders.Count()}");
    Console.WriteLine($"Assets: {ctx.EquipmentAssets.Count()}");
}
