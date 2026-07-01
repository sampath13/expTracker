using ExpTracker.Api.Extensions;
using ExpTracker.Core.Interfaces;
using ExpTracker.Core.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpTracker.Api.Controllers;

[Authorize]
[ApiController]
[Route("user")]
public class UserController : ControllerBase
{
    private readonly IConsentService _consentService;
    private readonly ILogger<UserController> _logger;

    public UserController(IConsentService consentService, ILogger<UserController> logger)
    {
        _consentService = consentService;
        _logger = logger;
    }

    [HttpGet("consent")]
    public async Task<ActionResult<ConsentResponse>> GetConsent(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var result = await _consentService.GetConsentAsync(userId, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : NotFound(new { error = result.Error!.Description });
    }

    [HttpPatch("consent")]
    public async Task<ActionResult<ConsentResponse>> UpdateConsent(UpdateConsentRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var result = await _consentService.UpdateConsentAsync(userId, request, cancellationToken);

        return result.IsSuccess
            ? Ok(result.Value)
            : NotFound(new { error = result.Error!.Description });
    }
}