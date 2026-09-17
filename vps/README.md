# MultySMM — full VPS setup

Files here are used to recreate the panel's database structure on a self-hosted
Supabase stack running on the VPS.

Run order (from the app folder on the VPS, e.g. `/var/www/multysmm`):

```
PW=your-super-secret-and-long-postgres-password
for f in vps/schema.sql vps/views.sql vps/grants.sql; do
  docker exec -i -e PGPASSWORD=$PW supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=0 -f - < $f
done
```

- `schema.sql` — enums, sequences, tables, constraints, indexes, functions,
  triggers, RLS, policies
- `views.sql` — reporting views
- `grants.sql` — table permissions for anon / authenticated / service_role
