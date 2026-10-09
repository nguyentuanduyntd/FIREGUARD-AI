namespace FireGuard.Application.Common.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string bucketName = "images");
        Task<List<string>> ListFilesAsync(string bucketName = "images");
    }
}
