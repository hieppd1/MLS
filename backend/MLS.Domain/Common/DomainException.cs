namespace MLS.Domain.Common;

public class DomainException(string message) : Exception(message);

public class NotFoundException(string entity, object key)
    : DomainException($"{entity} '{key}' was not found.");

public class UnauthorizedException(string message = "Unauthorized.")
    : DomainException(message);

public class ConflictException(string message) : DomainException(message);

public class ForbiddenException(string message = "Forbidden.") : DomainException(message);
