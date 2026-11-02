# Mitta Air nickname + password update

1. Execute `migrations/2026-11-02_passenger_password.sql` in Supabase SQL Editor.
2. Deploy the full project. Existing gate code and game progression remain unchanged.
3. New passengers register with nickname + password (8–128 chars); duplicate nicknames are allowed, but duplicate nickname/password pairs are rejected using a unique keyed lookup.
4. Existing accounts created with recovery codes must use the one-time migration form. Their game progress stays under the same UUID.
5. The legacy recovery-code localStorage entry is deleted after successful migration. New passwords are never stored in localStorage.
6. IMPORTANT: This release does NOT yet implement durable login rate limiting. Do not publicly launch before adding it; per-IP and per-nickname throttling at the edge/database is recommended. Avoid brute-force attacks against weak passwords.
7. Existing cookie sessions remain valid; after switching passenger, users log in using their nickname and password.
8. Test on a Vercel preview before production, including duplicate nickname with different passwords, duplicate pair rejection, existing account migration, save/restore, and multiple devices.
