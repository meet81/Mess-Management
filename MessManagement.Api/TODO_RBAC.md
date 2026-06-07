# RBAC Task TODO

## Plan decision
- Route-level enforcement is the primary gate (middleware/endpoint-level).
- Controller/action-level `RequirePermission("Inventory","Delete")` attributes are only used when route/controller cannot represent different permission checks.

## Steps
1. Locate existing/implemented RBAC module (role, permission, permission assignment, audit logs) and any middleware.
2. Confirm current authorization style (currently JWT + `Authorize(Roles=...)` on controllers) and how it will integrate with permission checks.
3. Implement/adjust permission enforcement at the route/endpoint level.
4. Add/verify permission matrix endpoints needed by frontend.
5. Ensure JWT tokens carry enough identity (and optionally permission/role claims) to support authorization.
6. Update DB initializer seeding for RBAC module (roles, permissions, admin defaults).
7. Create EF migration: `AddRBACModule`.
8. Run `dotnet build`.
9. Run migrations: `dotnet ef database update`.
10. Test APIs via Swagger: create role, assign permissions, verify matrix endpoint.
11. Verify existing APIs still work with existing JWT tokens.
12. Manual verification steps:
    - Admin: Role Management, Permission Matrix, Audit Logs in sidebar.
    - Staff: RBAC pages not visible.
    - Create custom role (e.g., Kitchen Manager), assign permissions, assign to user, verify access.
    - Check audit logs on login and permission changes.

