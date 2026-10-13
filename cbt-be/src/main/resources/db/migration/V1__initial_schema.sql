CREATE TABLE users (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) NOT NULL UNIQUE,
 email VARCHAR(255) UNIQUE, password VARCHAR(255), provider VARCHAR(255), provider_id VARCHAR(255),
 role ENUM('ROLE_USER','ROLE_ADMIN') NOT NULL, created_at DATETIME(6)
);
CREATE TABLE exam_series (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
 description VARCHAR(500), created_at DATETIME(6), updated_at DATETIME(6)
);
CREATE TABLE exams (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, series_id BIGINT, round INT,
 title VARCHAR(255) NOT NULL, description TEXT, duration_sec INT, total_score INT,
 is_published BIT NOT NULL, created_by BIGINT, created_at DATETIME(6), updated_at DATETIME(6),
 CONSTRAINT uk_exam_round UNIQUE(series_id,round),
 CONSTRAINT fk_exam_series FOREIGN KEY(series_id) REFERENCES exam_series(id),
 CONSTRAINT fk_exam_author FOREIGN KEY(created_by) REFERENCES users(id)
);
CREATE TABLE questions (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, exam_id BIGINT,
 type ENUM('MCQ','SUBJECTIVE'), text TEXT NOT NULL, choices JSON,
 answer_key VARCHAR(255), answer_keywords VARCHAR(255), score INT, tags VARCHAR(255), explanation VARCHAR(255),
 CONSTRAINT fk_question_exam FOREIGN KEY(exam_id) REFERENCES exams(id)
);
CREATE TABLE attempts (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, exam_id BIGINT NOT NULL, user_id BIGINT,
 started_at DATETIME(6), submitted_at DATETIME(6), total_score INT,
 CONSTRAINT fk_attempt_exam FOREIGN KEY(exam_id) REFERENCES exams(id),
 CONSTRAINT fk_attempt_user FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE answers (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, question_id BIGINT NOT NULL, attempt_id BIGINT NOT NULL,
 selected_choices TEXT, response_text TEXT, is_correct BIT, score_awarded INT,
 CONSTRAINT fk_answer_question FOREIGN KEY(question_id) REFERENCES questions(id),
 CONSTRAINT fk_answer_attempt FOREIGN KEY(attempt_id) REFERENCES attempts(id)
);
