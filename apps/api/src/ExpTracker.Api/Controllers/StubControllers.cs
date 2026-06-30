using Microsoft.AspNetCore.Mvc;

namespace ExpTracker.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;

    public AuthController(ILogger<AuthController> logger)
    {
        _logger = logger;
    }

    [HttpGet("stub")]
    public IActionResult Stub()
    {
        return Ok(new { Message = "AuthController stub" });
    }
}

[ApiController]
[Route("bills")]
public class BillsController : ControllerBase
{
    private readonly ILogger<BillsController> _logger;

    public BillsController(ILogger<BillsController> logger)
    {
        _logger = logger;
    }

    [HttpGet("stub")]
    public IActionResult Stub()
    {
        return Ok(new { Message = "BillsController stub" });
    }
}

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

[ApiController]
[Route("user")]
public class UserController : ControllerBase
{
    private readonly ILogger<UserController> _logger;

    public UserController(ILogger<UserController> logger)
    {
        _logger = logger;
    }

    [HttpGet("stub")]
    public IActionResult Stub()
    {
        return Ok(new { Message = "UserController stub" });
    }
}
