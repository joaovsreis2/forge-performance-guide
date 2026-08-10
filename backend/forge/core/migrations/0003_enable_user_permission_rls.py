from django.db import migrations


FORWARD_SQL = """
DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'users_groups',
        'users_user_permissions'
    ]
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);

        IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = table_name
              AND policyname = 'forge_backend_full_access'
        ) THEN
            EXECUTE format(
                'CREATE POLICY forge_backend_full_access ON public.%I FOR ALL TO %I USING (true) WITH CHECK (true)',
                table_name,
                current_user
            );
        END IF;
    END LOOP;
END $$;
"""


REVERSE_SQL = """
DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'users_groups',
        'users_user_permissions'
    ]
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS forge_backend_full_access ON public.%I',
            table_name
        );
        EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY', table_name);
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_enable_public_table_rls"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, REVERSE_SQL),
    ]
