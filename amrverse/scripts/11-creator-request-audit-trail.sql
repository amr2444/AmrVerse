CREATE TABLE IF NOT EXISTS creator_request_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES creator_requests(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_request_audit_request ON creator_request_audit_logs(request_id, created_at DESC);

INSERT INTO creator_request_audit_logs (request_id, actor_user_id, actor_type, action, notes, created_at)
SELECT
  cr.id,
  cr.user_id,
  'user',
  CASE
    WHEN cr.status = 'approved' THEN 'submitted'
    WHEN cr.status = 'rejected' THEN 'submitted'
    ELSE 'submitted'
  END,
  NULL,
  cr.created_at
FROM creator_requests cr
WHERE NOT EXISTS (
  SELECT 1
  FROM creator_request_audit_logs cal
  WHERE cal.request_id = cr.id
);

INSERT INTO creator_request_audit_logs (request_id, actor_user_id, actor_type, action, notes, created_at)
SELECT
  cr.id,
  cr.reviewed_by,
  'admin',
  CASE
    WHEN cr.status = 'approved' THEN 'approved'
    WHEN cr.status = 'rejected' THEN 'rejected'
    ELSE NULL
  END,
  cr.admin_notes,
  cr.reviewed_at
FROM creator_requests cr
WHERE cr.status IN ('approved', 'rejected')
  AND cr.reviewed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM creator_request_audit_logs cal
    WHERE cal.request_id = cr.id
      AND cal.action = CASE WHEN cr.status = 'approved' THEN 'approved' ELSE 'rejected' END
      AND cal.created_at = cr.reviewed_at
  );
