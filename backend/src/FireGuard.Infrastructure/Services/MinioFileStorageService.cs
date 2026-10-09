using FireGuard.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Minio;
using Minio.DataModel.Args;

namespace FireGuard.Infrastructure.Services
{
    public class MinioFileStorageService : IFileStorageService
    {
        private readonly IMinioClient _minioClient;
        private readonly ILogger<MinioFileStorageService> _logger;
        private readonly string _endpoint;

        public MinioFileStorageService(IConfiguration configuration, ILogger<MinioFileStorageService> logger)
        {
            _logger = logger;
            _endpoint = configuration["Minio:Endpoint"] ?? "localhost:9000";
            var accessKey = configuration["Minio:AccessKey"] ?? "minioadmin";
            var secretKey = configuration["Minio:SecretKey"] ?? "minioadmin";

            // Initialize MinIO Client using Builder pattern
            _minioClient = new MinioClient()
                .WithEndpoint(_endpoint)
                .WithCredentials(accessKey, secretKey)
                .Build();
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string bucketName = "images")
        {
            try
            {
                // Ensure bucket exists
                var bucketExistsArgs = new BucketExistsArgs().WithBucket(bucketName);
                bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs);
                if (!found)
                {
                    var makeBucketArgs = new MakeBucketArgs().WithBucket(bucketName);
                    await _minioClient.MakeBucketAsync(makeBucketArgs);
                    
                    // Set public policy so images are visible
                    var policyJson = $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [
                            {{
                                ""Effect"": ""Allow"",
                                ""Principal"": {{""AWS"": [""*""]}},
                                ""Action"": [""s3:GetObject""],
                                ""Resource"": [""arn:aws:s3:::{bucketName}/*""]
                            }}
                        ]
                    }}";
                    
                    var setPolicyArgs = new SetPolicyArgs()
                        .WithBucket(bucketName)
                        .WithPolicy(policyJson);
                    await _minioClient.SetPolicyAsync(setPolicyArgs);
                }

                // Upload the object
                var putObjectArgs = new PutObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(fileName)
                    .WithStreamData(fileStream)
                    .WithObjectSize(fileStream.Length)
                    .WithContentType(contentType);

                await _minioClient.PutObjectAsync(putObjectArgs);

                _logger.LogInformation("File {FileName} uploaded to MinIO bucket {BucketName} successfully.", fileName, bucketName);

                // Construct and return the URL
                var protocol = _endpoint.StartsWith("localhost") ? "http://" : "https://";
                return $"{protocol}{_endpoint}/{bucketName}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file {FileName} to MinIO.", fileName);
                throw;
            }
        }

        public async Task<List<string>> ListFilesAsync(string bucketName = "images")
        {
            var urls = new List<string>();
            try
            {
                var bucketExistsArgs = new BucketExistsArgs().WithBucket(bucketName);
                bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs);
                if (!found)
                {
                    return urls;
                }

                var listArgs = new ListObjectsArgs().WithBucket(bucketName);
                var observable = _minioClient.ListObjectsAsync(listArgs);
                
                var tcs = new TaskCompletionSource<bool>();
                
                using var subscription = observable.Subscribe(
                    item =>
                    {
                        if (!item.IsDir)
                        {
                            var protocol = _endpoint.StartsWith("localhost") ? "http://" : "https://";
                            urls.Add($"{protocol}{_endpoint}/{bucketName}/{item.Key}");
                        }
                    },
                    ex => tcs.SetException(ex),
                    () => tcs.SetResult(true)
                );

                await tcs.Task;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing files in MinIO bucket {BucketName}.", bucketName);
            }

            return urls;
        }
    }
}
