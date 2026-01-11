-- ============================================================================
-- UTH-ConfMS Helper Functions for Guard Clauses
-- Version: 1.0.0
-- Date: 2026-01-10
-- Description: 
--   Helper functions để hỗ trợ Backend implement Guard Clauses
--   Các functions này có thể được gọi từ Backend hoặc sử dụng trong stored procedures
-- ============================================================================
-- PostgreSQL 15+ Compatible
-- ============================================================================

-- ============================================================================
-- DATABASE: db_submission
-- ============================================================================
\c db_submission;

-- Function 1: Check if user is author of any submission
-- Returns: submission_count (integer)
CREATE OR REPLACE FUNCTION check_user_has_submissions(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.submissions
    WHERE "authorId" = p_user_id
      AND deleted_at IS NULL
      AND is_active = true;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_has_submissions(INTEGER) IS 
'Kiểm tra User có phải là tác giả của submission nào không. Returns số lượng submissions.';

-- Function 2: Get submissions by author (for logging/debugging)
-- Returns: TABLE with submission details
CREATE OR REPLACE FUNCTION get_submissions_by_author(p_user_id INTEGER)
RETURNS TABLE (
    submission_id UUID,
    title VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.status::VARCHAR,
        s."createdAt"
    FROM public.submissions s
    WHERE s."authorId" = p_user_id
      AND s.deleted_at IS NULL
      AND s.is_active = true
    ORDER BY s."createdAt" DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_submissions_by_author(INTEGER) IS 
'Lấy danh sách submissions của một author (để log/debug).';

-- Function 3: Get submission IDs by track (for Case 3)
-- Returns: TABLE with submission UUIDs
CREATE OR REPLACE FUNCTION get_submission_ids_by_track(p_track_id INTEGER)
RETURNS TABLE (submission_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id
    FROM public.submissions s
    WHERE s."trackId" = p_track_id
      AND s.deleted_at IS NULL
      AND s.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_submission_ids_by_track(INTEGER) IS 
'Lấy danh sách submission IDs thuộc một track (dùng cho Case 3 guard clause).';

-- ============================================================================
-- DATABASE: db_review
-- ============================================================================
\c db_review;

-- Function 4: Check reviewer activity stats
-- Returns: JSONB with assignment_count and review_count
CREATE OR REPLACE FUNCTION get_reviewer_activity_stats(p_reviewer_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'assignmentCount', COUNT(DISTINCT a.id),
        'reviewCount', COUNT(DISTINCT r.id),
        'hasActiveAssignments', BOOL_OR(a.status IN ('PENDING', 'ACCEPTED')),
        'completedReviews', COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN r.id END)
    ) INTO v_result
    FROM public.assignments a
    LEFT JOIN public.reviews r ON r."assignmentId" = a.id
    WHERE a."reviewerId" = p_reviewer_id;
    
    RETURN COALESCE(v_result, '{"assignmentCount": 0, "reviewCount": 0, "hasActiveAssignments": false, "completedReviews": 0}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_reviewer_activity_stats(INTEGER) IS 
'Lấy thống kê hoạt động của reviewer: số assignments, số reviews đã hoàn thành.';

-- Function 5: Check if user has reviewed submissions in a track
-- Input: reviewer_id, array of submission_ids
-- Returns: JSONB with hasReviews (boolean) and count
CREATE OR REPLACE FUNCTION check_user_reviewed_submissions(
    p_reviewer_id INTEGER,
    p_submission_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER;
    v_result JSONB;
BEGIN
    SELECT COUNT(DISTINCT a.id) INTO v_count
    FROM public.assignments a
    WHERE a."reviewerId" = p_reviewer_id
      AND a."submissionId" = ANY(p_submission_ids);
    
    SELECT jsonb_build_object(
        'hasReviews', (v_count > 0),
        'reviewCount', v_count,
        'submissionCount', array_length(p_submission_ids, 1)
    ) INTO v_result;
    
    RETURN COALESCE(v_result, '{"hasReviews": false, "reviewCount": 0, "submissionCount": 0}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_reviewed_submissions(INTEGER, UUID[]) IS 
'Kiểm tra user có review submissions nào trong danh sách submission IDs không (dùng cho Case 3).';

-- Function 6: Get detailed reviewer activity (for logging/debugging)
-- Returns: TABLE with assignment and review details
CREATE OR REPLACE FUNCTION get_reviewer_activity_details(p_reviewer_id INTEGER)
RETURNS TABLE (
    assignment_id INTEGER,
    submission_id UUID,
    assignment_status VARCHAR,
    review_id INTEGER,
    review_recommendation VARCHAR,
    review_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a."submissionId",
        a.status::VARCHAR,
        r.id,
        r.recommendation::VARCHAR,
        r.score,
        a."createdAt"
    FROM public.assignments a
    LEFT JOIN public.reviews r ON r."assignmentId" = a.id
    WHERE a."reviewerId" = p_reviewer_id
    ORDER BY a."createdAt" DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_reviewer_activity_details(INTEGER) IS 
'Lấy chi tiết hoạt động reviewer: assignments và reviews (để log/debug).';

-- ============================================================================
-- DATABASE: db_conference
-- ============================================================================
\c db_conference;

-- Function 7: Check track member can be removed
-- This function requires cross-database call, so it's more of a template
-- Backend should implement this using cross-service API calls
-- Returns: JSONB with canRemove (boolean) and reason
CREATE OR REPLACE FUNCTION can_remove_track_member(
    p_track_id INTEGER,
    p_user_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_track_exists BOOLEAN;
    v_member_exists BOOLEAN;
    v_result JSONB;
BEGIN
    -- Check if track exists and is active
    SELECT EXISTS (
        SELECT 1 FROM public.tracks
        WHERE id = p_track_id
          AND deleted_at IS NULL
          AND is_active = true
    ) INTO v_track_exists;
    
    -- Check if member exists in track
    SELECT EXISTS (
        SELECT 1 FROM public.track_members
        WHERE "trackId" = p_track_id
          AND "userId" = p_user_id
    ) INTO v_member_exists;
    
    IF NOT v_track_exists THEN
        RETURN jsonb_build_object(
            'canRemove', false,
            'reason', 'Track does not exist or is inactive'
        );
    END IF;
    
    IF NOT v_member_exists THEN
        RETURN jsonb_build_object(
            'canRemove', false,
            'reason', 'User is not a member of this track'
        );
    END IF;
    
    -- Note: Actual review check should be done via Backend cross-service call
    -- This function only checks basic membership
    RETURN jsonb_build_object(
        'canRemove', true,
        'reason', 'Basic checks passed. Backend should verify review status via cross-service call.',
        'note', 'Check db_review.assignments for reviewer activity on track submissions'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_remove_track_member(INTEGER, INTEGER) IS 
'Kiểm tra cơ bản xem có thể xóa track member không. Backend cần verify thêm review status qua cross-service call.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant execute permissions to application user (adjust role name as needed)
-- \c db_submission;
-- GRANT EXECUTE ON FUNCTION check_user_has_submissions(INTEGER) TO app_user;
-- GRANT EXECUTE ON FUNCTION get_submissions_by_author(INTEGER) TO app_user;
-- GRANT EXECUTE ON FUNCTION get_submission_ids_by_track(INTEGER) TO app_user;

-- \c db_review;
-- GRANT EXECUTE ON FUNCTION get_reviewer_activity_stats(INTEGER) TO app_user;
-- GRANT EXECUTE ON FUNCTION check_user_reviewed_submissions(INTEGER, UUID[]) TO app_user;
-- GRANT EXECUTE ON FUNCTION get_reviewer_activity_details(INTEGER) TO app_user;

-- \c db_conference;
-- GRANT EXECUTE ON FUNCTION can_remove_track_member(INTEGER, INTEGER) TO app_user;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Example 1: Check if user has submissions (Case 1)
SELECT check_user_has_submissions(4);  -- Returns: integer count

-- Example 2: Get reviewer activity stats (Case 2)
SELECT get_reviewer_activity_stats(8);  
-- Returns: {"assignmentCount": 2, "reviewCount": 1, "hasActiveAssignments": true, "completedReviews": 1}

-- Example 3: Check user reviewed submissions in track (Case 3)
-- First, get submission IDs from track (via Backend API call or function)
-- Then check:
SELECT check_user_reviewed_submissions(
    8, 
    ARRAY['d4e2cfd7-889e-4929-bba3-c70aed41d97a'::UUID, '26b56ec7-068e-4b98-a908-59064525e543'::UUID]
);
-- Returns: {"hasReviews": true, "reviewCount": 1, "submissionCount": 2}
*/

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. These functions use SECURITY DEFINER, so they run with creator's privileges
--    Adjust permissions as needed for your security model
-- 2. For Microservices architecture, Backend should prefer direct queries or API calls
--    These functions are optional helpers that can simplify Backend code
-- 3. Consider caching results for frequently checked data (e.g., track submissions)
-- 4. All functions respect soft delete (deleted_at IS NULL, is_active = true)
-- ============================================================================
