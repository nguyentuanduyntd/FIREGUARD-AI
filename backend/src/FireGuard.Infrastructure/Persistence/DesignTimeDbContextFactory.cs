using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace FireGuard.Infrastructure.Persistence
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var basePath = Path.Combine(Directory.GetCurrentDirectory(), "../FireGuard.API");
            
            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection") 
                                   ?? "Server=localhost;Port=3306;Database=fireguard_db;User Id=root;Password=rootpassword;";

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            
            optionsBuilder.UseMySql(
                connectionString, 
                ServerVersion.AutoDetect(connectionString),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)
            );

            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
