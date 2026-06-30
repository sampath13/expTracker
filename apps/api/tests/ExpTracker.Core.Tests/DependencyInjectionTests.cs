using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace ExpTracker.Core.Tests;

public class DependencyInjectionTests
{
    [Fact]
    public void AddCore_RegistersSuccessfully()
    {
        var services = new ServiceCollection();

        var result = services.AddCore();

        Assert.NotNull(result);
        Assert.Same(services, result);
    }
}
