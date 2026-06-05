using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MLS.Application.Shipping.Commands;
using MLS.Infrastructure.Shipping;

namespace MLS.API.Controllers;

/// <summary>
/// Receives inbound webhooks from shipping carriers.
/// NOT protected by JWT — protected by HMAC signature validation.
/// </summary>
[ApiController]
[Route("api/v1/webhooks")]
public class WebhooksController(
    IMediator                  mediator,
    IOptions<ShippingSettings> settings)
    : ControllerBase
{
    // POST /api/v1/webhooks/viettelpost
    [HttpPost("viettelpost")]
    public async Task<IActionResult> ViettelPost(CancellationToken ct)
    {
        // Read raw body (required for signature validation)
        Request.EnableBuffering();
        using var reader = new System.IO.StreamReader(Request.Body, leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync(ct);
        Request.Body.Position = 0;

        // Validate HMAC signature
        var sig = Request.Headers["X-Signature"].FirstOrDefault() ?? string.Empty;
        var webhookSecret = settings.Value.WebhookSecret;

        if (!string.IsNullOrWhiteSpace(webhookSecret))
        {
            if (!ViettelPostProvider.ValidateWebhookSignature(rawBody, sig, webhookSecret))
                return Unauthorized("Invalid webhook signature.");
        }

        // Parse payload
        ViettelPostWebhookPayload? payload;
        try
        {
            payload = System.Text.Json.JsonSerializer.Deserialize<ViettelPostWebhookPayload>(
                rawBody,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            return BadRequest("Invalid JSON payload.");
        }

        if (payload?.OrderNumber == null)
            return BadRequest("Missing ORDER_NUMBER.");

        var status      = payload.OrderStatus?.ToString() ?? "Unknown";
        var description = payload.OrderStatusName ?? payload.Description;

        await mediator.Send(new ProcessViettelPostWebhookCommand(
            payload.OrderNumber,
            status,
            description,
            rawBody), ct);

        return Ok(new { received = true });
    }
}

public record ViettelPostWebhookPayload(
    [property: System.Text.Json.Serialization.JsonPropertyName("ORDER_NUMBER")]
    string? OrderNumber,

    [property: System.Text.Json.Serialization.JsonPropertyName("ORDER_STATUS")]
    int? OrderStatus,

    [property: System.Text.Json.Serialization.JsonPropertyName("ORDER_STATUS_NAME")]
    string? OrderStatusName,

    [property: System.Text.Json.Serialization.JsonPropertyName("DESCRIPTION")]
    string? Description);
