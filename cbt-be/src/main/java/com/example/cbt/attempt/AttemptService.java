package com.example.cbt.attempt;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cbt.attempt.dto.AttemptDetailRes; // 필요 DTO 임포트 가정
import com.example.cbt.attempt.dto.AttemptHistoryDto;
import com.example.cbt.attempt.dto.AttemptReviewRes;
import com.example.cbt.attempt.dto.AttemptSubmitRes;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.grading.GradingResult;
import com.example.cbt.grading.GradingService;
import com.example.cbt.kafka.dto.ExamGradedEvent;
import com.example.cbt.question.Question; // Question 엔티티 임포트 가정
import com.example.cbt.question.QuestionRepository; // QuestionRepository 임포트 가정
import com.example.cbt.question.QuestionType; // QuestionType 임포트 가정
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final GradingService gradingService;
    private final KafkaTemplate<String, ExamGradedEvent> kafkaTemplate;

    public static final String TOPIC_EXAM_GRADED = "exam-graded";

    /**
     * 1) Attempt 생성 (시험 시작)
     */
    @Transactional
    public Attempt startAttempt(Long examId, Long userId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found with id: " + examId));
        
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        }

        Attempt attempt = Attempt.builder()
                .exam(exam) // Exam 객체 매핑
                .user(user) // User 객체 매핑
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build();

        return attemptRepository.save(attempt);
    }

    /**
     * 2) Attempt 상세 조회 (Question 포함)
     */
    @Transactional(readOnly = true)
    public AttemptDetailRes getAttemptDetail(Long attemptId) {
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));
        
        Exam exam = attempt.getExam();
        
        // ExamId로 Question 목록을 가져옴
        List<Question> questions = questionRepository.findByExamId(exam.getId()); 

        List<AttemptDetailRes.QuestionDto> questionDtos = questions.stream()
                .map(q -> new AttemptDetailRes.QuestionDto(
                        q.getId(),
                        q.getText(),
                        q.getType().name(),
                        q.getChoices(),
                        q.getScore()
                ))
                .toList();

        return new AttemptDetailRes(
                attempt.getId(),
                exam.getId(),
                exam.getTitle(),
                questionDtos,
                exam.getDurationSec(),
                attempt.getStartedAt()
        );
    }

    /**
     * 3) Attempt 제출 + 자동 채점 + Redis 랭킹 반영
     */
    @Transactional
    public AttemptSubmitRes submitAndGrade(Long attemptId) {
        Attempt attempt = attemptRepository.findById(attemptId)
            .orElseThrow(() -> new RuntimeException("응시 기록이 없습니다."));

        if (attempt.getStatus() == AttemptStatus.GRADED)
            throw new RuntimeException("이미 채점 완료된 응시입니다.");

        GradingResult gradingResult = gradingService.gradeAttempt(attempt);
        int totalScore = gradingResult.totalScore();
        int correctCnt = gradingResult.correctCount();
        List<Answer> gradedAnswers = gradingResult.gradedAnswers();
        int totalQuestions = gradedAnswers.size();

        // Attempt 엔티티 업데이트
        attempt.setTotalScore(totalScore);
        attempt.setStatus(AttemptStatus.GRADED);
        attempt.setSubmittedAt(Instant.now());

        answerRepository.saveAll(gradedAnswers);
        attemptRepository.save(attempt);

        // If the user is not a guest, publish an event to Kafka for ranking update.
        if (attempt.getUser() != null) {
            ExamGradedEvent event = new ExamGradedEvent(
                attempt.getUser().getId(),
                attempt.getExam().getId(),
                totalScore
            );
            kafkaTemplate.send(TOPIC_EXAM_GRADED, event);
            log.info("Published ExamGradedEvent to Kafka: {}", event);
        }

        return new AttemptSubmitRes(
            attempt.getId(),
            attempt.getExam().getId(),
            totalScore,
            correctCnt,
            totalQuestions - correctCnt,
            totalQuestions
        );
    }

    /**
     * 4) 응시 이력 조회 (개인)
     */
    @Transactional(readOnly = true)
    public Page<AttemptHistoryDto> getAttemptHistory(Long userId, Pageable pageable) {
        Page<Attempt> attempts = attemptRepository.findByUserId(userId, pageable);
        return attempts.map(AttemptHistoryDto::new);
    }

    /**
     * 5) 오답 리뷰 (문항별 상세)
     */
    @Transactional(readOnly = true)
    public List<AttemptReviewRes> getReview(Long attemptId) {
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("응시 내역 없음"));

        List<Question> questions = questionRepository.findByExamId(attempt.getExam().getId()); 
        List<Answer> answers = answerRepository.findByAttemptId(attemptId);

        return questions.stream().map(q -> {
             Answer ans = answers.stream()
                    .filter(a -> a.getQuestionId().equals(q.getId()))
                    .findFirst().orElse(null);

            String correctAnswer = q.getType() == QuestionType.MCQ
                    ? q.getAnswerKey()
                    : q.getAnswerKeywords();

            return new AttemptReviewRes(
                    q.getId(),
                    q.getText(),
                    q.getType().name(),
                    q.getChoices(),
                    ans != null ? ans.getSelectedChoices() : null,
                    ans != null ? ans.getResponseText() : null,
                    correctAnswer,
                    ans != null && ans.getIsCorrect(),
                    q.getScore(),
                    q.getExplanation()
            );
        }).collect(Collectors.toList());
    }


}