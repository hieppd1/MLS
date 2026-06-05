using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MLS.Application.Common.Interfaces;
using MLS.Application.Orders.Commands;

namespace MLS.API.Controllers;

[ApiController]
[Route("api/v1/payment")]
public class PaymentController(
    IMediator mediator,
    IMomoPaymentService momoService,
    IVnPayService vnPayService) : ControllerBase
{
    /// <summary>
    /// MoMo IPN (Instant Payment Notification) callback — called server-to-server by MoMo.
    /// Must return HTTP 204 to acknowledge, regardless of processing result.
    /// </summary>
    [HttpPost("momo/ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> MomoIpn(
        [FromBody] MomoIpnPayload payload,
        CancellationToken ct = default)
    {
        // Verify signature to prevent spoofing
        if (!momoService.VerifyIpnSignature(payload))
        {
            // Log but still return 204 to prevent retries leaking info
            return NoContent();
        }

        // resultCode 0 = success
        if (payload.ResultCode == 0 && !string.IsNullOrEmpty(payload.OrderId))
        {
            // OrderId in MoMo request was set to our Order.OrderCode
            // We need to look up the order and confirm payment
            await mediator.Send(
                new ConfirmOrderPaymentByCodeCommand(payload.OrderId, $"MoMo transId:{payload.TransId}"),
                ct);
        }

        // MoMo requires 204 to stop retrying
        return NoContent();
    }

    /// <summary>
    /// MoMo redirect return URL — called by MoMo browser redirect after payment.
    /// Redirects user to /thanh-toan/ket-qua page.
    /// </summary>
    [HttpGet("momo/return")]
    [AllowAnonymous]
    public IActionResult MomoReturn(
        [FromQuery] string orderId,
        [FromQuery] int resultCode,
        [FromQuery] string? message)
    {
        var success = resultCode == 0;
        var frontendBase = Request.Headers["X-Frontend-Url"].FirstOrDefault() ?? "http://localhost:3000";

        if (success)
            return Redirect($"{frontendBase}/thanh-toan/ket-qua?orderCode={orderId}");
        else
            return Redirect($"{frontendBase}/thanh-toan/ket-qua?failed=1");
    }

    /// <summary>
    /// VNPay IPN callback — called server-to-server by VNPay to confirm payment.
    /// Must return JSON {RspCode, Message} as VNPay documentation specifies.
    /// </summary>
    [HttpGet("vnpay/ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayIpn(CancellationToken ct = default)
    {
        var queryParams = Request.Query
            .ToDictionary(k => k.Key, k => k.Value.ToString());

        if (!vnPayService.VerifySignature(queryParams, out var orderCode, out var responseCode))
            return Ok(new { RspCode = "97", Message = "Invalid Signature" });

        if (responseCode != "00")
            return Ok(new { RspCode = "00", Message = "Confirm Success" });

        if (string.IsNullOrEmpty(orderCode))
            return Ok(new { RspCode = "01", Message = "Order not Found" });

        var confirmed = await mediator.Send(
            new ConfirmOrderPaymentByCodeCommand(orderCode, $"VNPay txnRef:{orderCode}"), ct);

        return confirmed
            ? Ok(new { RspCode = "00", Message = "Confirm Success" })
            : Ok(new { RspCode = "01", Message = "Order not Found" });
    }

    /// <summary>
    /// VNPay redirect return URL — browser is redirected here after VNPay payment.
    /// Also confirms the order (fallback for localhost where IPN cannot reach the server).
    /// Redirects user to frontend /thanh-toan/ket-qua page.
    /// </summary>
    [HttpGet("vnpay/return")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayReturn(CancellationToken ct = default)
    {
        var queryParams = Request.Query
            .ToDictionary(k => k.Key, k => k.Value.ToString());

        var frontendBase = Request.Headers["X-Frontend-Url"].FirstOrDefault()
            ?? "http://localhost:3000";

        if (!vnPayService.VerifySignature(queryParams, out var orderCode, out var responseCode))
            return Redirect($"{frontendBase}/thanh-toan/ket-qua?failed=1");

        if (responseCode != "00")
            return Redirect($"{frontendBase}/thanh-toan/ket-qua?failed=1&orderCode={orderCode}");

        // Confirm payment here too — idempotent, ensures activation even when IPN cannot
        // reach localhost during sandbox testing.
        if (!string.IsNullOrEmpty(orderCode))
            await mediator.Send(
                new ConfirmOrderPaymentByCodeCommand(orderCode, $"VNPay return txnRef:{orderCode}"), ct);

        return Redirect($"{frontendBase}/thanh-toan/ket-qua?orderCode={orderCode}&method=vnpay");
    }
}
