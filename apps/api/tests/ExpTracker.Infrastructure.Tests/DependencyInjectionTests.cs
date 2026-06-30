using ExpTracker.Core.Interfaces;
using ExpTracker.Infrastructure.Services;
using Xunit;

namespace ExpTracker.Infrastructure.Tests;

public class DependencyInjectionTests
{
    [Fact]
    public void TokenService_ImplementsITokenService()
    {
        var service = new TokenService();

        Assert.IsAssignableFrom<ITokenService>(service);
    }

    [Fact]
    public void S3Service_ImplementsIS3Service()
    {
        var service = new S3Service();

        Assert.IsAssignableFrom<IS3Service>(service);
    }
}
