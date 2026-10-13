ALTER TABLE attempts ADD COLUMN guest_token_hash VARCHAR(255), ADD COLUMN duration_sec INT;
UPDATE attempts a JOIN exams e ON e.id=a.exam_id SET a.duration_sec=e.duration_sec;
-- Fail on legacy duplicate answers instead of silently dropping user data.
ALTER TABLE answers ADD CONSTRAINT uk_answer_attempt_question UNIQUE(attempt_id,question_id);
CREATE INDEX idx_attempt_user_submitted ON attempts(user_id,submitted_at);
CREATE INDEX idx_attempt_exam_submitted ON attempts(exam_id,submitted_at);
ALTER TABLE users ADD CONSTRAINT uk_user_provider UNIQUE(provider,provider_id);
ALTER TABLE questions MODIFY explanation TEXT, MODIFY answer_keywords TEXT;
