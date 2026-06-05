using System.Collections.Concurrent;
using MLS.Application.Common.Interfaces;

namespace MLS.Infrastructure.Messaging;

/// <summary>
/// Dev-mode in-memory queue for writing grading requests.
/// Replace with RabbitMQ/Azure Service Bus for production.
/// </summary>
public class InMemoryWritingGradingQueue : IWritingGradingQueue
{
    private readonly ConcurrentQueue<WritingGradingRequest> _queue = new();

    public void Enqueue(WritingGradingRequest request) => _queue.Enqueue(request);

    public bool TryDequeue(out WritingGradingRequest? request) => _queue.TryDequeue(out request);
}
