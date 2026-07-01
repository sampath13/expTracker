using Amazon.S3;
using Amazon.S3.Model;
using ExpTracker.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace ExpTracker.Infrastructure.Services;

public class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string? _publicUrl;

    public S3Service(IAmazonS3 s3Client, IConfiguration configuration)
    {
        _s3Client = s3Client;
        _bucketName = configuration["S3:BucketName"] ?? "receipt-images";
        _publicUrl = configuration["S3:PublicUrl"];
    }

    public async Task<string> GeneratePresignedUploadUrlAsync(string objectKey, int expiryMinutes, CancellationToken cancellationToken = default)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
        };

        var url = await _s3Client.GetPreSignedURLAsync(request);

        if (!string.IsNullOrEmpty(_publicUrl))
        {
            var uri = new Uri(url);
            var publicUri = new Uri(_publicUrl);
            url = new UriBuilder(uri) { Scheme = publicUri.Scheme, Host = publicUri.Host, Port = publicUri.Port }.ToString();
        }

        return url;
    }
}
