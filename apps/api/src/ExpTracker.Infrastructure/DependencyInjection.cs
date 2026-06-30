using System.Text;
using ExpTracker.Core.Interfaces;
using ExpTracker.Infrastructure.Data;
using ExpTracker.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace ExpTracker.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ClockSkew = TimeSpan.Zero,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!))
                };
            });

        services.AddDbContext<PersonalBillsDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("PersonalBills")));

        services.AddDbContext<ComparisonPoolDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("ComparisonPool")));

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IS3Service, S3Service>();

        return services;
    }
}
