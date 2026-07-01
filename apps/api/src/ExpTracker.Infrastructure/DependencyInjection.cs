using System.Text;
using Amazon;
using Amazon.S3;
using ExpTracker.Core.Interfaces;
using ExpTracker.Core.Models.Entities;
using ExpTracker.Infrastructure.Data;
using ExpTracker.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
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
        services.AddIdentity<User, IdentityRole<Guid>>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 8;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;

            options.User.RequireUniqueEmail = true;

            options.Lockout.AllowedForNewUsers = false;
        })
        .AddEntityFrameworkStores<PersonalBillsDbContext>()
        .AddDefaultTokenProviders();

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        })
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

        var s3Config = configuration.GetSection("S3");
        var s3ServiceUrl = s3Config["ServiceUrl"];
        var s3AccessKey = s3Config["AccessKey"];
        var s3SecretKey = s3Config["SecretKey"];
        var s3Region = s3Config["Region"];

        if (!string.IsNullOrEmpty(s3ServiceUrl))
        {
            var config = new AmazonS3Config { ServiceURL = s3ServiceUrl, ForcePathStyle = true };
            services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(s3AccessKey, s3SecretKey, config));
        }
        else
        {
            var region = RegionEndpoint.GetBySystemName(s3Region ?? "ap-southeast-1");
            services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(region));
        }

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IS3Service, S3Service>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IConsentService, ConsentService>();

        return services;
    }
}
