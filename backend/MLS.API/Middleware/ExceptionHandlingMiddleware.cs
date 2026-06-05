using System.Net;
using System.Text.Json;
using FluentValidation;
using MLS.Domain.Common;

namespace MLS.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            ValidationException ve => (HttpStatusCode.BadRequest,
                string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))),
            ConflictException ce => (HttpStatusCode.Conflict, ce.Message),
            NotFoundException nfe => (HttpStatusCode.NotFound, nfe.Message),
            UnauthorizedException ue => (HttpStatusCode.Unauthorized, ue.Message),
            ForbiddenException fe => (HttpStatusCode.Forbidden, fe.Message),
            DomainException de => (HttpStatusCode.BadRequest, de.Message),
            InvalidOperationException ioe => (HttpStatusCode.BadRequest, ioe.Message),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new { error = message, status = (int)statusCode };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
