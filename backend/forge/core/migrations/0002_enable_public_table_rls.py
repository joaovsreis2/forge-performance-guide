from django.db import migrations


FORWARD_SQL = """
DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'achievements',
        'auth_group',
        'auth_group_permissions',
        'auth_permission',
        'body_measurements',
        'completed_sets',
        'daily_recovery',
        'django_admin_log',
        'django_content_type',
        'django_migrations',
        'django_session',
        'exercises',
        'experience_ledger',
        'habit_definitions',
        'habit_entries',
        'personal_records',
        'plan_workouts',
        'session_exercises',
        'session_notes',
        'sync_operations',
        'training_plans',
        'user_achievements',
        'user_preferences',
        'user_profiles',
        'user_progression',
        'users',
        'workout_exercises',
        'workout_sessions'
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
        'achievements',
        'auth_group',
        'auth_group_permissions',
        'auth_permission',
        'body_measurements',
        'completed_sets',
        'daily_recovery',
        'django_admin_log',
        'django_content_type',
        'django_migrations',
        'django_session',
        'exercises',
        'experience_ledger',
        'habit_definitions',
        'habit_entries',
        'personal_records',
        'plan_workouts',
        'session_exercises',
        'session_notes',
        'sync_operations',
        'training_plans',
        'user_achievements',
        'user_preferences',
        'user_profiles',
        'user_progression',
        'users',
        'workout_exercises',
        'workout_sessions'
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
        ("accounts", "0002_userpreference_userprofile"),
        ("admin", "0003_logentry_add_action_flag_choices"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contenttypes", "0002_remove_content_type_name"),
        ("core", "0001_initial"),
        ("progress", "0002_achievement_experienceledger_userachievement_and_more"),
        ("sessions", "0001_initial"),
        ("training", "0002_sessionexercise_workoutsession_sessionnote_and_more"),
    ]

    operations = [
        migrations.RunSQL(FORWARD_SQL, REVERSE_SQL),
    ]
