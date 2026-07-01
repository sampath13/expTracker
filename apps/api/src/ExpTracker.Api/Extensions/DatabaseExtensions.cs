using System.Net;
using Amazon.S3;
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

        try
        {
            var s3Client = scope.ServiceProvider.GetRequiredService<Amazon.S3.IAmazonS3>();
            var config = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
            var bucketName = config["S3:BucketName"] ?? "receipt-images";
            var response = s3Client.ListBucketsAsync().GetAwaiter().GetResult();
            if (!response.Buckets.Any(b => b.BucketName == bucketName))
            {
                s3Client.PutBucketAsync(bucketName).GetAwaiter().GetResult();
                logger.LogInformation("Created S3 bucket: {Bucket}", bucketName);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to verify S3 bucket");
        }

        return app;
    }
}
