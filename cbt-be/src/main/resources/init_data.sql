USE cbt_platform;

INSERT INTO exams (id, title, description, duration_sec, is_published, created_at, updated_at) 
VALUES (1, 'Test Exam', 'For Load Test', 3600, 1, NOW(), NOW()) 
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO questions (id, text, type, score, answer_key, exam_id, choices) 
VALUES (1, 'Q1?', 'MCQ', 10, '1', 1, '["1","2","3","4"]') 
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO questions (id, text, type, score, answer_key, exam_id, choices) 
VALUES (2, 'Q2?', 'MCQ', 10, '1', 1, '["1","2","3","4"]') 
ON DUPLICATE KEY UPDATE id=id;
