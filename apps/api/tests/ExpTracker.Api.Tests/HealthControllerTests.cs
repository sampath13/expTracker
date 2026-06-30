using System.Net;
using System.Net.Http.Json;
using ExpTracker.Core.Models.Dtos;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace ExpTracker.Api.Tests;

public class HealthControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHealth_Returns200WithProperJsonStructure()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadFromJsonAsync<HealthResponse>();

        Assert.NotNull(content);
        Assert.Equal("Healthy", content.Status);
        Assert.True(IsValidHealthStatus(content.Db));
        Assert.True(IsValidHealthStatus(content.S3));
    }

    [Fact]
    public async Task GetHealth_HasCorrectContentType()
    {
        var response = await _client.GetAsync("/health");

        Assert.Contains("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    private static bool IsValidHealthStatus(string status)
    {
        return status is "Healthy" or "Degraded" or "Unhealthy";
    }
}
