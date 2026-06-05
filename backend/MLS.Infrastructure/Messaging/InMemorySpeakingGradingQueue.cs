using System.Collections.Concurrent;
using MLS.Application.Common.Interfaces;

namespace MLS.Infrastructure.Messaging;

/// <summary>
/// Dev-mode in-memory queue for speaking grading requests.
/// Replace with RabbitMQ/Azure Service Bus for production.
/// </summary>
public class InMemorySpeakingGradingQueue : ISpeakingGradingQueue
{
    private readonly ConcurrentQueue<SpeakingGradingRequest> _queue = new();

    public void Enqueue(SpeakingGradingRequest request) => _queue.Enqueue(request);

    public bool TryDequeue(out SpeakingGradingRequest? request) => _queue.TryDequeue(out request);
}
