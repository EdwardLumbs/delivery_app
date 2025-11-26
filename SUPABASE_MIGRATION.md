# Supabase Migration Guide

## ✅ Migration Complete!

Your app has been migrated from Appwrite to Supabase. Here's what you need to do:

---

## 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose a name and password
4. Select a region (closest to your users)
5. Wait for project to be created (~2 minutes)

---

## 2. Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

---

## 3. Update .env File

Replace the placeholder values in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 4. Create Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste and click "Run"
5. Wait for success message

This creates all your tables:
- ✅ users
- ✅ categories
- ✅ menu
- ✅ customizations
- ✅ menu_customizations
- ✅ orders (for future)
- ✅ order_items (for future)
- ✅ driver_locations (for future)

---

## 5. Seed Your Database

1. Start your app: `npx expo start`
2. Open the app on your device/emulator
3. Navigate to the Search tab
4. Click the "Seed" button
5. Wait for "✅ Seeding complete!" message

This will populate your database with:
- 6 categories
- 20 customizations
- 14 menu items

---

## 6. Test Everything

### Test Auth:
1. Go to Sign Up screen
2. Create a new account
3. Should redirect to home screen

### Test Menu:
1. Go to Search tab
2. Should see menu items
3. Try filtering by category
4. Try searching

### Test Cart:
1. Add items to cart
2. Go to Cart tab
3. Should see items with correct prices

---

## What Changed?

### Files Removed:
- ❌ `lib/appwrite.ts`
- ❌ `lib/useAppwrite.ts`

### Files Added:
- ✅ `lib/supabase.ts` - Supabase client and auth functions
- ✅ `lib/useSupabase.ts` - Custom hook for data fetching
- ✅ `lib/queries.ts` - Database query functions
- ✅ `lib/seed.ts` - Updated seed script for Supabase
- ✅ `supabase-schema.sql` - Database schema
- ✅ `SUPABASE_MIGRATION.md` - This file

### Files Updated:
- ✅ `type.d.ts` - Removed Appwrite Models dependency
- ✅ `store/auth.store.ts` - Updated imports
- ✅ `app/(auth)/sign-in.tsx` - Updated imports
- ✅ `app/(auth)/sign-up.tsx` - Updated imports
- ✅ `app/(tabs)/search.tsx` - Updated imports and hooks
- ✅ `components/MenuCard.tsx` - Changed `$id` to `id`
- ✅ `.env` - Updated with Supabase credentials

---

## Key Differences: Appwrite vs Supabase

| Feature | Appwrite | Supabase |
|---------|----------|----------|
| **ID field** | `$id` | `id` |
| **Queries** | SDK methods | SQL-like syntax |
| **Auth** | `account.create()` | `supabase.auth.signUp()` |
| **Database** | `databases.listDocuments()` | `supabase.from().select()` |
| **Real-time** | `client.subscribe()` | `supabase.channel().on()` |

---

## Troubleshooting

### "Invalid API key" error:
- Check your `.env` file has correct credentials
- Restart Expo: `npx expo start --clear`

### "Table does not exist" error:
- Run the SQL schema in Supabase dashboard
- Make sure all tables were created

### Seed fails:
- Check your Supabase credentials
- Make sure tables are created first
- Check console for specific error

### Auth not working:
- Go to **Authentication** → **Providers** in Supabase
- Make sure Email provider is enabled
- Check "Confirm email" is disabled (for development)

---

## Next Steps

### Enable Email Confirmation (Production):
1. Go to **Authentication** → **Email Templates**
2. Customize confirmation email
3. Enable "Confirm email" in settings

### Add Storage for Images:
1. Go to **Storage** in Supabase
2. Create a bucket called "menu-images"
3. Set it to public
4. Upload your menu item images

### Enable Real-time (for driver tracking):
Already enabled in schema! Just use:
```typescript
supabase
  .channel('driver-tracking')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'driver_locations'
  }, (payload) => {
    console.log('Driver moved:', payload)
  })
  .subscribe()
```

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **React Native Guide**: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

---

## Summary

✅ Appwrite removed  
✅ Supabase installed  
✅ All code updated  
✅ Schema ready  
✅ Seed script ready  

**Just add your credentials and run the schema!** 🚀
