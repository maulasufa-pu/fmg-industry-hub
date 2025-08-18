# 🌙 Dark Mode Implementation Report
Generated: 2025-08-17

## Summary
- **Total Files**: 105
- **Files with Dark Mode**: 46 (44%)
- **Total Dark Mode Classes**: 145
- **Coverage**: 44%

## Top Files by Dark Mode Implementation


1. **src\app\debug\dark-mode\page.tsx**
   - Dark classes: 11
   - Features: dark:, useTheme, next-themes
   - Lines: 116

2. **src\app\admin\users\page.tsx**
   - Dark classes: 8
   - Features: dark:, var(--
   - Lines: 502

3. **src\components\ui\button.tsx**
   - Dark classes: 7
   - Features: dark:
   - Lines: 60

4. **src\app\admin\projects\[id]\page.tsx**
   - Dark classes: 6
   - Features: dark:, var(--
   - Lines: 2160

5. **src\app\admin\ui\AdminPanel.tsx**
   - Dark classes: 6
   - Features: dark:, var(--
   - Lines: 652

6. **src\components\theme-toggle.tsx**
   - Dark classes: 6
   - Features: dark:, useTheme, next-themes
   - Lines: 30

7. **src\app\admin\dashboard\page.tsx**
   - Dark classes: 5
   - Features: dark:
   - Lines: 546

8. **src\app\client\dashboard\page.tsx**
   - Dark classes: 5
   - Features: dark:
   - Lines: 471

9. **src\app\client\projects\CreateProjectPopover.tsx**
   - Dark classes: 5
   - Features: dark:, var(--
   - Lines: 923

10. **src\app\ui\HeaderSection.tsx**
   - Dark classes: 5
   - Features: dark:, var(--
   - Lines: 247


## Files WITHOUT Dark Mode Support
- src\app\about\page.tsx
- src\app\admin\AdminShell.tsx
- src\app\admin\layout.tsx
- src\app\admin\page.tsx
- src\app\admin\projects\page.tsx
- src\app\admin\users\api\route.ts
- src\app\admin-test\page.tsx
- src\app\api\assignments\route.ts
- src\app\api\bootstrap\owner\route.ts
- src\app\api\debug-profiles\route.ts
- src\app\api\meetings\google\route.ts
- src\app\api\meetings\zoom\route.ts
- src\app\api\profiles\route.ts
- src\app\api\profiles\update-role\route.ts
- src\app\api\projects\submit\route.ts
- src\app\api\upload-avatar\route.ts
- src\app\auth\callback\CallbackClient.tsx
- src\app\auth\callback\page.tsx
- src\app\auth\debug-cookies.ts
- src\app\auth\LogoutButton.tsx
- src\app\auth\RedirectIfAuthenticated.tsx
- src\app\auth\RequireAdmin.tsx
- src\app\auth\RequireRole.tsx
- src\app\auth\signout\route.ts
- src\app\auth\w.tsx
- src\app\client\ClientShell.tsx
- src\app\client\layout.tsx
- src\app\client\page.tsx
- src\app\client\publishing\page.tsx
- src\app\client\reports\page.tsx
- src\app\client\settings\page.tsx
- src\app\debug\page.tsx
- src\app\portofolio\page.tsx
- src\app\pricing\page.tsx
- src\app\services\page.tsx
- src\app\signup\page.tsx
- src\components\catalog.ts
- src\components\ClientWakeReloader.tsx
- src\components\shell\MainContainerClient.tsx
- src\components\ui\HeaderVisibility.tsx
- src\hooks\useReInitOnFocus.ts
- src\hooks\useWakeRefetch.ts
- src\icons\index.ts
- src\lib\client.ts
- src\lib\roles\effective.ts
- src\lib\roles.ts
- src\lib\server.ts
- src\lib\supabase\admin.ts
- src\lib\supabase\client.ts
- src\lib\supabase\server.ts
- src\lib\supabase\useFocusRefetch.ts
- src\lib\supabase\useFocusWarmAuth.ts
- src\lib\supabase.ts
- src\lib\utils.ts
- src\lib\validators.ts
- src\lib\wakeRefetch.ts
- src\middleware.ts
- src\utils\supabase\client.ts
- src\utils\supabase\server.ts

## Most Used Dark Mode Classes
- `dark:bg-gray-`: 35 times
- `dark:shadow-gray-`: 27 times
- `dark:text-gray-`: 26 times
- `dark:border-gray-`: 18 times
- `dark:text-white`: 8 times
- `dark:bg-blue-`: 7 times
- `dark:bg-red-`: 5 times
- `dark:bg-green-`: 3 times
- `dark:hover`: 2 times
- `dark:aria-invalid`: 2 times

## Recommendations
- ⚠️ Consider running `npm run add-dark-mode` to increase coverage
- ✅ Comprehensive dark mode styling!
- ✅ All files parsed successfully

## File Details

### src\app\debug\dark-mode\page.tsx
- **Dark Mode**: ✅
- **Classes**: 11 (dark:text-white, dark:text-gray-, dark:bg-gray-, dark:border-gray-, dark:bg-blue-...)
- **Features**: dark:, useTheme, next-themes
- **Lines**: 116


### src\app\admin\users\page.tsx
- **Dark Mode**: ✅
- **Classes**: 8 (dark:bg-gray-, dark:text-gray-, dark:text-white, dark:bg-blue-, dark:bg-green-...)
- **Features**: dark:, var(--
- **Lines**: 502


### src\components\ui\button.tsx
- **Dark Mode**: ✅
- **Classes**: 7 (dark:aria-invalid, dark:shadow-gray-, dark:focus-visible, dark:bg-destructive, dark:bg-input...)
- **Features**: dark:
- **Lines**: 60


### src\app\admin\projects\[id]\page.tsx
- **Dark Mode**: ✅
- **Classes**: 6 (dark:border-gray-, dark:bg-gray-, dark:shadow-gray-, dark:text-gray-, dark:bg-blue-...)
- **Features**: dark:, var(--
- **Lines**: 2160


### src\app\admin\ui\AdminPanel.tsx
- **Dark Mode**: ✅
- **Classes**: 6 (dark:border-gray-, dark:bg-blue-, dark:shadow-gray-, dark:text-gray-, dark:bg-gray-...)
- **Features**: dark:, var(--
- **Lines**: 652


### src\components\theme-toggle.tsx
- **Dark Mode**: ✅
- **Classes**: 6 (dark:bg-gray-, dark:shadow-gray-, dark:border-gray-, dark:-rotate-, dark:scale-...)
- **Features**: dark:, useTheme, next-themes
- **Lines**: 30


### src\app\admin\dashboard\page.tsx
- **Dark Mode**: ✅
- **Classes**: 5 (dark:shadow-gray-, dark:border-gray-, dark:text-gray-, dark:text-white, dark:bg-gray-)
- **Features**: dark:
- **Lines**: 546


### src\app\client\dashboard\page.tsx
- **Dark Mode**: ✅
- **Classes**: 5 (dark:border-gray-, dark:bg-gray-, dark:shadow-gray-, dark:text-gray-, dark:text-white)
- **Features**: dark:
- **Lines**: 471


### src\app\client\projects\CreateProjectPopover.tsx
- **Dark Mode**: ✅
- **Classes**: 5 (dark:text-gray-, dark:bg-gray-, dark:border-gray-, dark:text-white, dark:shadow-gray-)
- **Features**: dark:, var(--
- **Lines**: 923


### src\app\ui\HeaderSection.tsx
- **Dark Mode**: ✅
- **Classes**: 5 (dark:bg-gray-, dark:border-gray-, dark:shadow-gray-, dark:text-gray-, dark:bg-blue-)
- **Features**: dark:, var(--
- **Lines**: 247


### src\app\admin\ui\AdminSidebarSection.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:bg-gray-, dark:shadow-gray-, dark:text-gray-, dark:border-gray-)
- **Features**: dark:, var(--
- **Lines**: 390


### src\app\client\invoices\page.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:border-gray-, dark:bg-gray-, dark:shadow-gray-, dark:text-gray-)
- **Features**: dark:, var(--
- **Lines**: 326


### src\app\client\projects\page.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:border-gray-, dark:bg-gray-, dark:text-gray-, dark:shadow-gray-)
- **Features**: dark:
- **Lines**: 287


### src\app\client\projects\ProjectPaginationSection.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:border-gray-, dark:bg-gray-, dark:shadow-gray-, dark:text-gray-)
- **Features**: dark:
- **Lines**: 157


### src\app\client\projects\ProjectTableSection.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:bg-gray-, dark:border-gray-, dark:shadow-gray-, dark:text-gray-)
- **Features**: dark:, var(--
- **Lines**: 347


### src\app\client\projects\ProjectTabsSection.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:border-gray-, dark:text-gray-, dark:bg-blue-, dark:shadow-gray-)
- **Features**: dark:, var(--
- **Lines**: 203


### src\app\client\projects\[id]\page.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:border-gray-, dark:bg-gray-, dark:shadow-gray-, dark:text-gray-)
- **Features**: dark:, var(--
- **Lines**: 960


### src\app\client\ui\SubmitSuccessForm.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:bg-gray-, dark:shadow-gray-, dark:text-white, dark:text-gray-)
- **Features**: dark:, var(--
- **Lines**: 97


### src\app\page.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:bg-gray-, dark:text-white, dark:shadow-gray-, dark:text-gray-)
- **Features**: dark:
- **Lines**: 195


### src\app\profile\settings\page.tsx
- **Dark Mode**: ✅
- **Classes**: 4 (dark:bg-gray-, dark:border-gray-, dark:shadow-gray-, dark:text-gray-)
- **Features**: dark:, var(--
- **Lines**: 815


### src\app\admin\env-test\page.tsx
- **Dark Mode**: ✅
- **Classes**: 3 (dark:bg-gray-, dark:text-gray-, dark:bg-yellow-)
- **Features**: dark:
- **Lines**: 53


### src\app\admin\invoices\page.tsx
- **Dark Mode**: ✅
- **Classes**: 3 (dark:bg-gray-, dark:text-gray-, dark:shadow-gray-)
- **Features**: dark:, var(--
- **Lines**: 152


### src\app\admin\meetings\page.tsx
- **Dark Mode**: ✅
- **Classes**: 3 (dark:bg-gray-, dark:shadow-gray-, dark:text-gray-)
- **Features**: dark:
- **Lines**: 162


### src\app\admin\publishing\page.tsx
- **Dark Mode**: ✅
- **Classes**: 3 (dark:bg-gray-, dark:text-gray-, dark:shadow-gray-)
- **Features**: dark:
- **Lines**: 138


### src\app\quick-debug\page.tsx
- **Dark Mode**: ✅
- **Classes**: 3 (dark:bg-gray-, dark:bg-red-, dark:bg-blue-)
- **Features**: dark:
- **Lines**: 147


### src\components\ui\input.tsx
- **Dark Mode**: ✅
- **Classes**: 3 (dark:bg-input, dark:shadow-gray-, dark:aria-invalid)
- **Features**: dark:
- **Lines**: 22


### src\app\admin\test-access\page.tsx
- **Dark Mode**: ✅
- **Classes**: 2 (dark:text-gray-, dark:bg-gray-)
- **Features**: dark:
- **Lines**: 65


### src\app\admin\test-auth\page.tsx
- **Dark Mode**: ✅
- **Classes**: 2 (dark:bg-gray-, dark:text-gray-)
- **Features**: dark:
- **Lines**: 130


### src\app\client\projects\error.tsx
- **Dark Mode**: ✅
- **Classes**: 2 (dark:bg-red-, dark:bg-gray-)
- **Features**: dark:
- **Lines**: 68


### src\app\client\ui\SidebarSection.tsx
- **Dark Mode**: ✅
- **Classes**: 2 (dark:shadow-gray-, dark:bg-gray-)
- **Features**: dark:, var(--
- **Lines**: 427


### src\app\layout.tsx
- **Dark Mode**: ✅
- **Classes**: 2 (dark:bg-gray-, dark:border-gray-)
- **Features**: dark:, ThemeProvider, var(--
- **Lines**: 66


### src\components\settings\SubscriptionsPanel.tsx
- **Dark Mode**: ✅
- **Classes**: 2 (dark:bg-gray-, dark:bg-red-)
- **Features**: dark:
- **Lines**: 101


### src\app\admin\test-auth.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:bg-gray-)
- **Features**: dark:
- **Lines**: 83


### src\app\auth\RequireAuth.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:text-gray-)
- **Features**: dark:
- **Lines**: 328


### src\app\client\ui\SettingsSection.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:bg-gray-)
- **Features**: dark:, var(--
- **Lines**: 527


### src\app\login\page.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:text-gray-)
- **Features**: dark:
- **Lines**: 24


### src\app\ui\LoginSection.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:bg-gray-)
- **Features**: dark:, var(--
- **Lines**: 263


### src\app\ui\SignUpSection.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:bg-gray-)
- **Features**: dark:, var(--
- **Lines**: 179


### src\app\ui\UserMenu.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:shadow-gray-)
- **Features**: dark:, var(--
- **Lines**: 328


### src\components\settings\AccountPanel.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:bg-gray-)
- **Features**: dark:, var(--
- **Lines**: 216


### src\components\settings\BillingPanel.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:bg-gray-)
- **Features**: dark:, var(--
- **Lines**: 161


### src\components\ui\card.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:shadow-gray-)
- **Features**: dark:, var(--
- **Lines**: 93


### src\components\ui\dialog.tsx
- **Dark Mode**: ✅
- **Classes**: 1 (dark:shadow-gray-)
- **Features**: dark:
- **Lines**: 144


### src\app\about\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 7


### src\app\admin\AdminShell.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 52


### src\app\admin\layout.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 19


### src\app\admin\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 25


### src\app\admin\projects\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 288


### src\app\admin\users\api\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 14


### src\app\admin-test\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 74


### src\app\api\assignments\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 166


### src\app\api\bootstrap\owner\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 63


### src\app\api\debug-profiles\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 66


### src\app\api\meetings\google\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 81


### src\app\api\meetings\zoom\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 76


### src\app\api\profiles\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 81


### src\app\api\profiles\update-role\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 99


### src\app\api\projects\submit\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 288


### src\app\api\upload-avatar\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 83


### src\app\auth\callback\CallbackClient.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 165


### src\app\auth\callback\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 16


### src\app\auth\debug-cookies.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 8


### src\app\auth\LogoutButton.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 75


### src\app\auth\RedirectIfAuthenticated.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 95


### src\app\auth\RequireAdmin.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 91


### src\app\auth\RequireRole.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 16


### src\app\auth\signout\route.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 34


### src\app\auth\w.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 144


### src\app\client\ClientShell.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 56


### src\app\client\layout.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 19


### src\app\client\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 11


### src\app\client\publishing\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 4


### src\app\client\reports\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 4


### src\app\client\settings\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 7


### src\app\debug\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 37


### src\app\portofolio\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 7


### src\app\pricing\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 7


### src\app\services\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 7


### src\app\signup\page.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 21


### src\app\ui\LogoSection.tsx
- **Dark Mode**: ✅
- **Classes**: 0 ()
- **Features**: var(--
- **Lines**: 212


### src\components\catalog.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 33


### src\components\ClientWakeReloader.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 59


### src\components\shell\FooterClient.tsx
- **Dark Mode**: ✅
- **Classes**: 0 ()
- **Features**: var(--
- **Lines**: 21


### src\components\shell\MainContainerClient.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 13


### src\components\theme-provider.tsx
- **Dark Mode**: ✅
- **Classes**: 0 ()
- **Features**: ThemeProvider, next-themes
- **Lines**: 8


### src\components\ui\HeaderVisibility.tsx
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 16


### src\hooks\useReInitOnFocus.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 42


### src\hooks\useWakeRefetch.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 86


### src\icons\index.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 648


### src\lib\client.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 2


### src\lib\roles\effective.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 53


### src\lib\roles.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 31


### src\lib\server.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 2


### src\lib\supabase\admin.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 347


### src\lib\supabase\client.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 144


### src\lib\supabase\server.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 29


### src\lib\supabase\useFocusRefetch.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 161


### src\lib\supabase\useFocusWarmAuth.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 30


### src\lib\supabase.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 12


### src\lib\utils.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 7


### src\lib\validators.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 64


### src\lib\wakeRefetch.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 4


### src\middleware.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 19


### src\utils\supabase\client.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 2


### src\utils\supabase\server.ts
- **Dark Mode**: ❌
- **Classes**: 0 ()
- **Features**: None
- **Lines**: 2


