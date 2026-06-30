using Microsoft.Extensions.DependencyInjection;

namespace ExpTracker.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddCore(this IServiceCollection services)
    {
        return services;
    }
}
