using ExpTracker.Core.Interfaces;
using ExpTracker.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Xunit;

namespace ExpTracker.Infrastructure.Tests;

public class DependencyInjectionTests
{
    [Fact]
    public void TokenService_ImplementsITokenService()
    {
        var config = Substitute.For<IConfiguration>();
        var section = Substitute.For<IConfigurationSection>();
        section.Value.Returns("test-secret-key-that-is-long-enough-32-chars");
        config.GetSection("Jwt").Returns(section);

        var service = new TokenService(config);

        Assert.IsAssignableFrom<ITokenService>(service);
    }

    [Fact]
    public void S3Service_ImplementsIS3Service()
    {
        var s3Client = Substitute.For<Amazon.S3.IAmazonS3>();
        var section = Substitute.For<IConfigurationSection>();
        section.Value.Returns("receipt-images");
        var config = Substitute.For<IConfiguration>();
        config.GetSection("S3:BucketName").Returns(section);
        config["S3:BucketName"].Returns("receipt-images");

        var service = new S3Service(s3Client, config);

        Assert.IsAssignableFrom<IS3Service>(service);
    }
}
