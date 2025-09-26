# Debug Authentication Bypass

## What it does
This feature bypasses Supabase authentication when accessing admin pages from localhost during development.

## How it works
- **Client-side**: `src/lib/roles/effective.ts` returns "admin" role for localhost
- **Server-side**: `src/middleware.ts` allows access to admin routes without auth check for localhost

## Security
- Only works in `development` mode (`NODE_ENV=development`)
- Only works for localhost/127.0.0.1/192.168.x.x/.local domains
- Never affects production builds

## How to disable
Add these environment variables to `.env.local`:

```env
NEXT_PUBLIC_DISABLE_AUTH_DEBUG=true
DISABLE_AUTH_DEBUG=true
```

## Console logs
When active, you'll see console messages:
- `🐛 DEBUG MODE: Bypassing auth for localhost - returning admin role`
- `🐛 DEBUG MODE: Bypassing middleware auth for localhost: /admin/...`

## Admin pages you can now access without login:
- http://localhost:3000/admin/dashboard
- http://localhost:3000/admin/productservices  
- http://localhost:3000/admin/projects
- http://localhost:3000/admin/invoices
- http://localhost:3000/admin/users

## Notes
- This is for debugging purposes only
- All admin functionality will work as if you're logged in as an admin user
- Database operations still require proper Supabase configuration
- Remember to test with real auth before production deployment