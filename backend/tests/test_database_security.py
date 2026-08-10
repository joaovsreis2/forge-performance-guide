import pytest
from django.db import connection


@pytest.mark.django_db
def test_public_tables_have_row_level_security_enabled() -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relkind IN ('r', 'p')
              AND NOT c.relrowsecurity
            ORDER BY c.relname
            """
        )
        tables_without_rls = [row[0] for row in cursor.fetchall()]

        cursor.execute(
            """
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relkind IN ('r', 'p')
              AND NOT c.relforcerowsecurity
            ORDER BY c.relname
            """
        )
        tables_without_forced_rls = [row[0] for row in cursor.fetchall()]

    assert tables_without_rls == []
    assert tables_without_forced_rls == []


@pytest.mark.django_db
def test_backend_database_role_has_explicit_rls_policy() -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT current_user
            """
        )
        current_role = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT c.relname
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relkind IN ('r', 'p')
              AND NOT EXISTS (
                  SELECT 1
                  FROM pg_policies p
                  WHERE p.schemaname = n.nspname
                    AND p.tablename = c.relname
                    AND p.policyname = 'forge_backend_full_access'
                    AND %s = ANY(p.roles)
              )
            ORDER BY c.relname
            """,
            [current_role],
        )
        tables_without_backend_policy = [row[0] for row in cursor.fetchall()]

    assert tables_without_backend_policy == []
