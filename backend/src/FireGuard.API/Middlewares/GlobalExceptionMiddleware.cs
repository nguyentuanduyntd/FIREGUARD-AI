using System.Net;
using System.Text.Json;
using FireGuard.Application.Common.Models;
using FluentValidation;

namespace FireGuard.API.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            var statusCode = (int)HttpStatusCode.InternalServerError;
            ApiResponse<object> apiResponse;

            if (exception is ValidationException validationException)
            {
                statusCode = (int)HttpStatusCode.BadRequest;
                var errors = validationException.Errors.Select(e => e.ErrorMessage).ToArray();
                apiResponse = ApiResponse<object>.Failure(errors, "Validation failed.");
            }
            else
            {
                apiResponse = ApiResponse<object>.Failure(
                    new[] { exception.Message }, 
                    "An unexpected error occurred on the server."
                );
            }

            context.Response.StatusCode = statusCode;

            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var result = JsonSerializer.Serialize(apiResponse, jsonOptions);

            return context.Response.WriteAsync(result);
        }
    }
}
