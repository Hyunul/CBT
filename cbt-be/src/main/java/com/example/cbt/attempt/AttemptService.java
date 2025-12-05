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
import com.example.cbt.question.Question; // Question 엔티티 임포트 가정
import com.example.cbt.question.QuestionRepository; // QuestionRepository 임포트 가정
import com.example.cbt.question.QuestionType; // QuestionType 임포트 가정
import com.example.cbt.ranking.SubmissionRankingService; // Redis 랭킹 서비스 임포트 가정
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j 
public class AttemptService {

    private final AttemptRepository attemptRepository;
    private final AnswerRepository answerRepository;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final SubmissionRankingService rankingService; 
    private final UserRepository userRepository;

    /**
     * 1) Attempt 생성 (시험 시작)
     */
    @Transactional
    public Attempt startAttempt(Long examId, Long userId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found with id: " + examId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

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
                questionDtos
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

        List<Answer> answers = answerRepository.findByAttemptId(attemptId);
        List<Question> questions = questionRepository.findByExamId(attempt.getExam().getId()); 

        int totalScore = 0;
        int correctCnt = 0;

        // --- 채점 로직 ---
        for (Answer ans : answers) {
            Question q = questions.stream()
                .filter(qq -> qq.getId().equals(ans.getQuestionId()))
                .findFirst().orElseThrow(() -> new RuntimeException("Question not found"));

            boolean isCorrect = false;
            // ... (채점 로직) ...
            if (q.getType() == QuestionType.MCQ) {
                isCorrect = q.getAnswerKey().equals(ans.getSelectedChoices());
            } else {
                String[] keys = q.getAnswerKeywords().split(",");
                for (String key : keys) {
                    if (ans.getResponseText() != null &&
                        ans.getResponseText().contains(key.trim())) {
                        isCorrect = true;
                        break;
                    }
                }
            }
            // ... (채점 로직 끝) ...

            ans.setIsCorrect(isCorrect);
            ans.setScoreAwarded((isCorrect ? q.getScore() : 0));
            
            if (isCorrect) correctCnt++;
            totalScore += ans.getScoreAwarded();
        }

        // Attempt 엔티티 업데이트
        attempt.setTotalScore(totalScore);
        attempt.setStatus(AttemptStatus.GRADED);
        attempt.setSubmittedAt(Instant.now());

        answerRepository.saveAll(answers);
        attemptRepository.save(attempt);

        // ⭐ 랭킹 서비스 동기화 및 반영 부분 [수정됨]
        // 1. 응시 횟수 랭킹 증가
        rankingService.increaseSubmission(attempt.getUser().getId());
        
        // 2. 시험 점수 랭킹 업데이트 (시험 ID, 사용자 ID, 최종 점수)
        rankingService.updateExamRanking(
            attempt.getExam().getId(), 
            attempt.getUser().getId(), 
            totalScore
        );
        // ⭐ [수정된 부분 끝]

        return new AttemptSubmitRes(
            attempt.getId(),
            attempt.getExam().getId(),
            (int)totalScore,
            correctCnt,
            answers.size() - correctCnt,
            answers.size()
        );
    }

    /**
     * 4) 응시 이력 조회 (개인)
     */
    @Transactional(readOnly = true)
    public Page<AttemptHistoryDto> getAttemptHistory(String identifier, Pageable pageable) {
        // UserRepository.findByUsernameOrEmail(String username, String email) 시그니처에 맞춰 두 번 전달
        User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new RuntimeException("User not found: " + identifier));
        
        Long userId = user.getId();

        // AttemptRepository에 JOIN FETCH 쿼리 메서드가 구현되어 있어야 함
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