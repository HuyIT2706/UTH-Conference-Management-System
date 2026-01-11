-- ============================================================================
-- UTH-ConfMS Emergency Fix Script for NULL submissionId
-- Version: 1.1.0
-- Date: 2026-01-10
-- Description: 
--   Emergency fix for NULL submissionId values in db_review tables
--   This script should be run BEFORE migration script if database has NULL values
--   Usage via Docker: docker exec -i uth_postgres psql -U admin -d db_review < 02-fix-null-submissionid.sql
-- ============================================================================
-- PostgreSQL 15+ Compatible
-- ============================================================================
-- NOTE: Run with: docker exec -i uth_postgres psql -U admin -d db_review < 02-fix-null-submissionid.sql
--       Or connect to db_review first, then run this script
-- ============================================================================

-- ============================================================================
-- FIX 1: Clean up assignments table
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assignments') THEN
        -- Delete rows with NULL or empty submissionId (invalid data)
        DELETE FROM public.assignments WHERE "submissionId" IS NULL OR "submissionId" = '';
        RAISE NOTICE 'Cleaned up assignments with NULL or empty submissionId';
        
        -- Delete rows with invalid UUID format (if column is still VARCHAR)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'assignments' 
            AND column_name = 'submissionId'
            AND data_type = 'character varying'
        ) THEN
            DELETE FROM public.assignments 
            WHERE "submissionId" IS NOT NULL 
            AND "submissionId" != ''
            AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            RAISE NOTICE 'Cleaned up assignments with invalid UUID format';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- FIX 2-5: Clean up all other tables (decisions, pc_discussions, rebuttals, review_preferences)
-- ============================================================================
DO $$
BEGIN
    -- Fix decisions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'decisions') THEN
        DELETE FROM public.decisions WHERE "submissionId" IS NULL OR "submissionId" = '';
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'decisions' 
            AND column_name = 'submissionId'
            AND data_type = 'character varying'
        ) THEN
            DELETE FROM public.decisions 
            WHERE "submissionId" IS NOT NULL 
            AND "submissionId" != ''
            AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        END IF;
        RAISE NOTICE 'Cleaned up decisions with NULL or invalid submissionId';
    END IF;
    
    -- Fix pc_discussions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pc_discussions') THEN
        DELETE FROM public.pc_discussions WHERE "submissionId" IS NULL OR "submissionId" = '';
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pc_discussions' 
            AND column_name = 'submissionId'
            AND data_type = 'character varying'
        ) THEN
            DELETE FROM public.pc_discussions 
            WHERE "submissionId" IS NOT NULL 
            AND "submissionId" != ''
            AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        END IF;
        RAISE NOTICE 'Cleaned up pc_discussions with NULL or invalid submissionId';
    END IF;
    
    -- Fix rebuttals
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rebuttals') THEN
        DELETE FROM public.rebuttals WHERE "submissionId" IS NULL OR "submissionId" = '';
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'rebuttals' 
            AND column_name = 'submissionId'
            AND data_type = 'character varying'
        ) THEN
            DELETE FROM public.rebuttals 
            WHERE "submissionId" IS NOT NULL 
            AND "submissionId" != ''
            AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        END IF;
        RAISE NOTICE 'Cleaned up rebuttals with NULL or invalid submissionId';
    END IF;
    
    -- Fix review_preferences
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_preferences') THEN
        DELETE FROM public.review_preferences WHERE "submissionId" IS NULL OR "submissionId" = '';
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'review_preferences' 
            AND column_name = 'submissionId'
            AND data_type = 'character varying'
        ) THEN
            DELETE FROM public.review_preferences 
            WHERE "submissionId" IS NOT NULL 
            AND "submissionId" != ''
            AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        END IF;
        RAISE NOTICE 'Cleaned up review_preferences with NULL or invalid submissionId';
    END IF;
END $$;

-- ============================================================================
-- FIX 6: If column was already partially converted (UUID type but has NULL values)
-- ============================================================================
-- Make sure all UUID columns allow NULL temporarily, then fix data, then add NOT NULL back
DO $$
BEGIN
    -- Fix assignments
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assignments' 
        AND column_name = 'submissionId'
        AND data_type = 'uuid'
    ) THEN
        -- Check if there are NULL values
        IF EXISTS (SELECT 1 FROM public.assignments WHERE "submissionId" IS NULL) THEN
            -- Delete rows with NULL (invalid data)
            DELETE FROM public.assignments WHERE "submissionId" IS NULL;
            RAISE NOTICE 'Fixed assignments: Deleted rows with NULL UUID submissionId';
        END IF;
        
        -- Ensure NOT NULL constraint exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public' 
            AND tc.table_name = 'assignments'
            AND ccu.column_name = 'submissionId'
            AND tc.constraint_type = 'CHECK'
            AND ccu.table_schema = 'public'
        ) THEN
            -- Constraint exists, skip
            NULL;
        ELSE
            ALTER TABLE public.assignments ALTER COLUMN "submissionId" SET NOT NULL;
            RAISE NOTICE 'Added NOT NULL constraint to assignments.submissionId';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- FIX COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Cleaned up all rows with NULL or invalid submissionId
-- ✅ Ready for migration script (02-migration-fixes.sql)
-- ============================================================================
