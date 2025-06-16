# implement the following, don't ask me if I want you to do it
# User Privileges Implementation (Quick Guide)

## Adding New Feature Permissions: FOR THE Audits Management

### 1. Files to Update
- `prisma/schema.prisma` (add new fields to `UserPermission`)
- `src/lib/user-permissions.ts` (update types, add check functions)
- `src/hooks/useUserPermissions.ts` (update type, admin defaults, and fallback)
- `src/app/api/users/permissions/route.ts` (PATCH: update/create must include new fields)
- `src/app/dashboard/administration/UserPermissionsModal.tsx` (add controls to modal)

### 2. Example: Audits Management Permissions


### 6. Troubleshooting
- If changes don't persist: PATCH handler or Prisma upsert is missing new fields.
- If UI doesn't update: User must refresh, or add polling to `useUserPermissions`.
- Always keep frontend types, modal, and backend in sync.

---
**Summary:**
1. Add new fields everywhere (schema, types, API, modal, UI).
2. PATCH must update/create all fields.
3. Use permission checks in UI and API.
4. Test: Change, reload, verify.
