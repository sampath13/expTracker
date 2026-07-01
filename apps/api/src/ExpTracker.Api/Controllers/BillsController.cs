using ExpTracker.Api.Extensions;
using ExpTracker.Core.Interfaces;
using ExpTracker.Core.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ExpTracker.Api.Controllers;

[Authorize]
[ApiController]
[Route("bills")]
public class BillsController : ControllerBase
{
    private readonly IS3Service _s3Service;
    private readonly ILogger<BillsController> _logger;

    public BillsController(IS3Service s3Service, ILogger<BillsController> logger)
    {
        _s3Service = s3Service;
        _logger = logger;
    }

    [HttpGet("upload-url")]
    public async Task<ActionResult<UploadUrlResponse>> GetUploadUrl(CancellationToken cancellationToken)
    {
        var objectKey = $"{User.GetUserId()}/{Guid.NewGuid()}.jpg";
        var uploadUrl = await _s3Service.GeneratePresignedUploadUrlAsync(objectKey, 5, cancellationToken);

        return Ok(new UploadUrlResponse(uploadUrl, objectKey));
    }
}