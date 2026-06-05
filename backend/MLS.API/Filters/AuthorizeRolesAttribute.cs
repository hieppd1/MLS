using Microsoft.AspNetCore.Authorization;

namespace MLS.API.Filters;

/// <summary>
/// Restricts access to users with one of the specified roles.
/// Usage: [AuthorizeRoles(Role.Names.Admin, Role.Names.SuperAdmin)]
/// </summary>
public class AuthorizeRolesAttribute : AuthorizeAttribute
{
    public AuthorizeRolesAttribute(params string[] roles)
        : base()
    {
        Roles = string.Join(",", roles);
    }
}
