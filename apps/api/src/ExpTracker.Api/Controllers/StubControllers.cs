using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpTracker.Api.Controllers;

[Authorize]
[ApiController]
[Route("compare")]
public class CompareController : ControllerBase
{
    private readonly ILogger<CompareController> _logger;

    public CompareController(ILogger<CompareController> logger)
    {
        _logger = logger;
    }

    [HttpGet("stub")]
    public IActionResult Stub()
    {
        return Ok(new { Message = "CompareController stub" });
    }
}
