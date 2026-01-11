-- ============================================================================
-- UTH-ConfMS Database Migration Script
-- Version: 1.1.0
-- Date: 2026-01-10
-- Description: 
--   1. Fix data type inconsistencies (VARCHAR -> UUID for submissionId)
--   2. Implement Soft Delete pattern
--   3. Add indexes for performance optimization
-- ============================================================================
-- PostgreSQL 15+ Compatible
-- ============================================================================
-- IMPORTANT: 
--   If you encounter NULL submissionId errors, run 02-fix-null-submissionid.sql FIRST
--   Then run this migration script
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: AUDIT & FIX DATA TYPES
-- ============================================================================
-- Convert all submissionId columns from VARCHAR to UUID in db_review database
-- to match the UUID type used in db_submission.submissions.id
-- ============================================================================

\c db_review;

-- Step 1.1: Convert assignments.submissionId from VARCHAR to UUID
-- CRITICAL: Handle NULL values first - delete rows with NULL submissionId (invalid data)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assignments' 
        AND column_name = 'submissionId'
        AND data_type = 'character varying'
    ) THEN
        -- Step 1.1a: Clean up invalid data - delete rows with NULL submissionId
        DELETE FROM public.assignments WHERE "submissionId" IS NULL OR "submissionId" = '';
        RAISE NOTICE 'Cleaned up assignments with NULL or empty submissionId';
        
        -- Step 1.1b: Delete rows with invalid UUID format (cannot be converted)
        DELETE FROM public.assignments 
        WHERE "submissionId" IS NOT NULL 
        AND "submissionId" != ''
        AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        RAISE NOTICE 'Cleaned up assignments with invalid UUID format';
        
        -- Step 1.1c: Make column nullable temporarily to allow conversion
        ALTER TABLE public.assignments 
        ALTER COLUMN "submissionId" DROP NOT NULL;
        RAISE NOTICE 'Made submissionId nullable temporarily';
        
        -- Step 1.1d: Convert to UUID
        ALTER TABLE public.assignments 
        ALTER COLUMN "submissionId" TYPE uuid USING "submissionId"::uuid;
        RAISE NOTICE 'Converted assignments.submissionId from VARCHAR to UUID';
        
        -- Step 1.1e: Add NOT NULL constraint back (all rows should have valid UUID now)
        ALTER TABLE public.assignments 
        ALTER COLUMN "submissionId" SET NOT NULL;
        RAISE NOTICE 'Set submissionId to NOT NULL after conversion';
    END IF;
END $$;

-- Step 1.2: Convert decisions.submissionId from VARCHAR to UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'decisions' 
        AND column_name = 'submissionId'
        AND data_type = 'character varying'
    ) THEN
        -- Clean up invalid data
        DELETE FROM public.decisions WHERE "submissionId" IS NULL OR "submissionId" = '';
        DELETE FROM public.decisions 
        WHERE "submissionId" IS NOT NULL 
        AND "submissionId" != ''
        AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE public.decisions 
        ALTER COLUMN "submissionId" DROP NOT NULL;
        
        ALTER TABLE public.decisions 
        ALTER COLUMN "submissionId" TYPE uuid USING "submissionId"::uuid;
        
        ALTER TABLE public.decisions 
        ALTER COLUMN "submissionId" SET NOT NULL;
        
        RAISE NOTICE 'Converted decisions.submissionId from VARCHAR to UUID';
    END IF;
END $$;

-- Step 1.3: Convert pc_discussions.submissionId from VARCHAR to UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'pc_discussions' 
        AND column_name = 'submissionId'
        AND data_type = 'character varying'
    ) THEN
        -- Clean up invalid data
        DELETE FROM public.pc_discussions WHERE "submissionId" IS NULL OR "submissionId" = '';
        DELETE FROM public.pc_discussions 
        WHERE "submissionId" IS NOT NULL 
        AND "submissionId" != ''
        AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE public.pc_discussions 
        ALTER COLUMN "submissionId" DROP NOT NULL;
        
        ALTER TABLE public.pc_discussions 
        ALTER COLUMN "submissionId" TYPE uuid USING "submissionId"::uuid;
        
        ALTER TABLE public.pc_discussions 
        ALTER COLUMN "submissionId" SET NOT NULL;
        
        RAISE NOTICE 'Converted pc_discussions.submissionId from VARCHAR to UUID';
    END IF;
END $$;

-- Step 1.4: Convert rebuttals.submissionId from VARCHAR to UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'rebuttals' 
        AND column_name = 'submissionId'
        AND data_type = 'character varying'
    ) THEN
        -- Clean up invalid data
        DELETE FROM public.rebuttals WHERE "submissionId" IS NULL OR "submissionId" = '';
        DELETE FROM public.rebuttals 
        WHERE "submissionId" IS NOT NULL 
        AND "submissionId" != ''
        AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE public.rebuttals 
        ALTER COLUMN "submissionId" DROP NOT NULL;
        
        ALTER TABLE public.rebuttals 
        ALTER COLUMN "submissionId" TYPE uuid USING "submissionId"::uuid;
        
        ALTER TABLE public.rebuttals 
        ALTER COLUMN "submissionId" SET NOT NULL;
        
        RAISE NOTICE 'Converted rebuttals.submissionId from VARCHAR to UUID';
    END IF;
END $$;

-- Step 1.5: Convert review_preferences.submissionId from VARCHAR to UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'review_preferences' 
        AND column_name = 'submissionId'
        AND data_type = 'character varying'
    ) THEN
        -- Clean up invalid data
        DELETE FROM public.review_preferences WHERE "submissionId" IS NULL OR "submissionId" = '';
        DELETE FROM public.review_preferences 
        WHERE "submissionId" IS NOT NULL 
        AND "submissionId" != ''
        AND "submissionId" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        ALTER TABLE public.review_preferences 
        ALTER COLUMN "submissionId" DROP NOT NULL;
        
        ALTER TABLE public.review_preferences 
        ALTER COLUMN "submissionId" TYPE uuid USING "submissionId"::uuid;
        
        ALTER TABLE public.review_preferences 
        ALTER COLUMN "submissionId" SET NOT NULL;
        
        RAISE NOTICE 'Converted review_preferences.submissionId from VARCHAR to UUID';
    END IF;
END $$;

-- ============================================================================
-- PART 2: IMPLEMENT SOFT DELETE PATTERN
-- ============================================================================
-- Add deleted_at (TIMESTAMP NULL) and is_active (BOOLEAN DEFAULT TRUE)
-- to critical tables: users, conferences, tracks, submissions
-- ============================================================================

-- Step 2.1: Add Soft Delete columns to db_identity.users
\c db_identity;

DO $$
BEGIN
    -- Add deleted_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;
        
        RAISE NOTICE 'Added deleted_at column to users table';
    END IF;
    
    -- Add is_active column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
        
        RAISE NOTICE 'Added is_active column to users table';
    END IF;
END $$;

-- Step 2.2: Add Soft Delete columns to db_conference.conferences
\c db_conference;

DO $$
BEGIN
    -- Add deleted_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conferences' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.conferences 
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;
        
        RAISE NOTICE 'Added deleted_at column to conferences table';
    END IF;
    
    -- Add is_active column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conferences' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.conferences 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
        
        RAISE NOTICE 'Added is_active column to conferences table';
    END IF;
END $$;

-- Step 2.3: Add Soft Delete columns to db_conference.tracks
DO $$
BEGIN
    -- Add deleted_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tracks' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.tracks 
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;
        
        RAISE NOTICE 'Added deleted_at column to tracks table';
    END IF;
    
    -- Add is_active column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tracks' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.tracks 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
        
        RAISE NOTICE 'Added is_active column to tracks table';
    END IF;
END $$;

-- Step 2.4: Add Soft Delete columns to db_submission.submissions
\c db_submission;

DO $$
BEGIN
    -- Add deleted_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'submissions' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.submissions 
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;
        
        RAISE NOTICE 'Added deleted_at column to submissions table';
    END IF;
    
    -- Add is_active column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'submissions' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.submissions 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
        
        RAISE NOTICE 'Added is_active column to submissions table';
    END IF;
END $$;

-- ============================================================================
-- PART 3: CREATE INDEXES FOR SOFT DELETE & PERFORMANCE
-- ============================================================================
-- Add indexes on deleted_at and is_active for query optimization
-- ============================================================================

-- Step 3.1: Indexes for db_identity.users
\c db_identity;

CREATE INDEX IF NOT EXISTS "IDX_users_deleted_at" 
ON public.users USING btree (deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_users_is_active" 
ON public.users USING btree (is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS "IDX_users_active_not_deleted" 
ON public.users USING btree (is_active, deleted_at) 
WHERE is_active = true AND deleted_at IS NULL;

-- Step 3.2: Indexes for db_conference.conferences
\c db_conference;

CREATE INDEX IF NOT EXISTS "IDX_conferences_deleted_at" 
ON public.conferences USING btree (deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_conferences_is_active" 
ON public.conferences USING btree (is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS "IDX_conferences_active_not_deleted" 
ON public.conferences USING btree (is_active, deleted_at) 
WHERE is_active = true AND deleted_at IS NULL;

-- Step 3.3: Indexes for db_conference.tracks
CREATE INDEX IF NOT EXISTS "IDX_tracks_deleted_at" 
ON public.tracks USING btree (deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_tracks_is_active" 
ON public.tracks USING btree (is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS "IDX_tracks_active_not_deleted" 
ON public.tracks USING btree (is_active, deleted_at) 
WHERE is_active = true AND deleted_at IS NULL;

-- Step 3.4: Indexes for db_submission.submissions
\c db_submission;

CREATE INDEX IF NOT EXISTS "IDX_submissions_deleted_at" 
ON public.submissions USING btree (deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS "IDX_submissions_is_active" 
ON public.submissions USING btree (is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS "IDX_submissions_active_not_deleted" 
ON public.submissions USING btree (is_active, deleted_at) 
WHERE is_active = true AND deleted_at IS NULL;

-- Step 3.5: Index for db_review on submissionId (after UUID conversion)
\c db_review;

CREATE INDEX IF NOT EXISTS "IDX_assignments_submissionId" 
ON public.assignments USING btree ("submissionId");

CREATE INDEX IF NOT EXISTS "IDX_decisions_submissionId" 
ON public.decisions USING btree ("submissionId");

CREATE INDEX IF NOT EXISTS "IDX_pc_discussions_submissionId" 
ON public.pc_discussions USING btree ("submissionId");

CREATE INDEX IF NOT EXISTS "IDX_rebuttals_submissionId" 
ON public.rebuttals USING btree ("submissionId");

CREATE INDEX IF NOT EXISTS "IDX_review_preferences_submissionId" 
ON public.review_preferences USING btree ("submissionId");

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ All submissionId columns converted from VARCHAR to UUID
-- ✅ Soft Delete columns (deleted_at, is_active) added to critical tables
-- ✅ Indexes created for optimal query performance
-- ============================================================================
