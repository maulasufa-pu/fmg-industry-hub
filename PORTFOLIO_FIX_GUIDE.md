# Portfolio API Fix Guide

## Problem
- Portfolio page showing "No Projects found" 
- Console error: `GET /api/portfolio 500 (Internal Server Error)`
- Data exists in portfolio table but not loading

## Root Causes
1. Portfolio table might not exist in Supabase
2. Row Level Security (RLS) policies blocking access
3. Missing or incorrect table structure

## Solution Steps

### Step 1: Create Portfolio Table in Supabase

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project: `FMG Industry Hub`

2. **Open SQL Editor**
   - Click on "SQL Editor" in left sidebar
   - Click "New query"

3. **Run the Migration Script**
   - Copy the entire content from: `supabase/migrations/create_portfolio_table.sql`
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for "Success" message

4. **Verify Table Creation**
   - Go to "Table Editor" in left sidebar
   - You should see `portfolio` table listed
   - Click on it to see structure

### Step 2: Check Existing Data

Run this query in SQL Editor to check if you have data:

```sql
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN release_date IS NOT NULL THEN 1 END) as with_release_date
FROM public.portfolio;
```

### Step 3: Verify RLS Policies

Run this query to check policies:

```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'portfolio';
```

You should see 4 policies:
- ✅ Public can view portfolio (SELECT)
- ✅ Admin/Owner can insert portfolio (INSERT)
- ✅ Admin/Owner can update portfolio (UPDATE)
- ✅ Admin/Owner can delete portfolio (DELETE)

### Step 4: Test API Endpoint

1. **Restart Dev Server**
   ```powershell
   # Press Ctrl+C in terminal
   npm run dev
   ```

2. **Test in Browser**
   - Open: http://localhost:3000/api/portfolio
   - You should see JSON response with `{ success: true, data: [...] }`

3. **Check Portfolio Page**
   - Open: http://localhost:3000/portfolio
   - Data should now load

### Step 5: Check Browser Console

Open browser console (F12) and look for:
- ✅ "Portfolio data fetched:" - Success
- ❌ "API Error Response:" - Check error details
- ❌ "Supabase fetch error:" - Database issue

### Step 6: Import Sample Data (Optional)

If table is empty, run sample data import:

```sql
-- Import from: src/app/portfolio/import-portfolio.sql
-- Or add manually through "Add Portfolio" button
```

## Troubleshooting

### Issue: Still getting 500 error

**Check Server Logs:**
```powershell
# In VS Code terminal where dev server is running
# Look for error messages like:
# - "Missing Supabase environment variables"
# - "Supabase fetch error: ..."
```

**Verify Environment Variables:**
```powershell
# Check .env.local file contains:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Issue: RLS blocking access

If you see "permission denied" errors:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE public.portfolio DISABLE ROW LEVEL SECURITY;

-- Test API
-- Then re-enable:
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
```

### Issue: Column mismatch

If structure doesn't match:

```sql
-- Check actual columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'portfolio';

-- Compare with expected structure in create_portfolio_table.sql
```

### Issue: Data not showing after import

Clear cache and refresh:
```powershell
# Hard refresh in browser
Ctrl + Shift + R

# Or restart dev server
npm run dev
```

## Verification Checklist

- [ ] Portfolio table exists in Supabase
- [ ] RLS policies are set up correctly
- [ ] API endpoint returns 200 status
- [ ] Data appears in portfolio page
- [ ] Search and filter working
- [ ] Pagination working
- [ ] Admin can add new portfolio items

## Success Indicators

✅ **API Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "genre": "Pop",
      "song_title": "Example Song",
      "singer": ["Artist Name"],
      ...
    }
  ]
}
```

✅ **Page Display:**
- Loading spinner appears briefly
- Portfolio cards render with:
  - Song titles
  - Artist names
  - Artwork/thumbnails
  - Genre badges
  - Release dates

✅ **Console:**
```
Portfolio data fetched: {success: true, data: Array(10)}
```

## Contact Support

If issues persist:
1. Copy error messages from console
2. Screenshot of Supabase table structure
3. Check server terminal logs
4. Verify Supabase project is active

## Additional Notes

- Portfolio table uses RLS with public read access
- Only admin/owner can modify data
- Supports multiple artists per field (arrays)
- Release dates are optional (can be NULL)
- Artwork URLs are optional with fallback to default logo
