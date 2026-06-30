using ExpTracker.Core.Models.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace ExpTracker.Api.Controllers;

[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public ActionResult<HealthResponse> GetHealth()
    {
        _logger.LogDebug("Health check requested");

        return Ok(new HealthResponse(
            Status: "Healthy",
            Db: "Unhealthy",
            S3: "Unhealthy"));
    }
}
