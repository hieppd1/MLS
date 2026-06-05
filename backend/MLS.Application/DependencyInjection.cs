using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using MLS.Application.Common.Behaviors;

namespace MLS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));

        // Scan assembly for all IValidator<T> implementations and register them
        var validatorOpenType = typeof(IValidator<>);
        foreach (var type in assembly.GetTypes().Where(t => !t.IsAbstract && !t.IsInterface))
        {
            foreach (var iface in type.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == validatorOpenType))
            {
                services.AddTransient(iface, type);
            }
        }

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
