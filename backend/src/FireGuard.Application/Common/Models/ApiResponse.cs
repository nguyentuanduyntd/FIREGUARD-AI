namespace FireGuard.Application.Common.Models
{
    public class ApiResponse<T>
    {
        public bool Succeeded { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public string[]? Errors { get; set; }

        public static ApiResponse<T> Success(T data, string? message = null)
        {
            return new ApiResponse<T>
            {
                Succeeded = true,
                Message = message,
                Data = data
            };
        }

        public static ApiResponse<T> Failure(string[] errors, string? message = null)
        {
            return new ApiResponse<T>
            {
                Succeeded = false,
                Message = message,
                Errors = errors
            };
        }

        public static ApiResponse<T> Failure(string error, string? message = null)
        {
            return new ApiResponse<T>
            {
                Succeeded = false,
                Message = message,
                Errors = new[] { error }
            };
        }
    }
}
