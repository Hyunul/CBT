ALTER TABLE exams ADD COLUMN type VARCHAR(16) NOT NULL DEFAULT 'WRITTEN';
UPDATE exams e JOIN exam_series s ON s.id=e.series_id SET e.type='PRACTICAL'
 WHERE s.name='정보처리기사 실기 (복원)';
