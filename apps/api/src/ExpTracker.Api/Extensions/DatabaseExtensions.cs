using ExpTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ExpTracker.Api.Extensions;

public static class DatabaseExtensions
{
    public static IHost ApplyMigrationsAndSeed(this IHost app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<Program>>();

        try
        {
            var personalBillsContext = services.GetRequiredService<PersonalBillsDbContext>();
            personalBillsContext.Database.Migrate();

            var comparisonPoolContext = services.GetRequiredService<ComparisonPoolDbContext>();
            comparisonPoolContext.Database.Migrate();

            SeedData.SeedAsync(personalBillsContext, comparisonPoolContext).GetAwaiter().GetResult();

            logger.LogInformation("Database migrations and seed data applied successfully");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to apply database migrations or seed data");
        }

        return app;
    }
}
