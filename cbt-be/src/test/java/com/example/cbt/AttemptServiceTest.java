package com.example.cbt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.example.cbt.attempt.Answer;
import com.example.cbt.attempt.AnswerRepository;
import com.example.cbt.attempt.Attempt;
import com.example.cbt.attempt.AttemptRepository;
import com.example.cbt.attempt.AttemptService;
import com.example.cbt.attempt.dto.AttemptHistoryDto;
import com.example.cbt.attempt.dto.AttemptSubmitRes;
import com.example.cbt.exam.Exam;
import com.example.cbt.exam.ExamRepository;
import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import com.example.cbt.question.QuestionType;
import com.example.cbt.ranking.SubmissionRankingService;
import com.example.cbt.user.User;
import com.example.cbt.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class AttemptServiceTest {

    // @InjectMocks
    // private AttemptService attemptService;

    // // Mock Repositories and Services
    // @Mock private AttemptRepository attemptRepository;
    // @Mock private AnswerRepository answerRepository;
    // @Mock private ExamRepository examRepository;
    // @Mock private QuestionRepository questionRepository;
    // @Mock private SubmissionRankingService rankingService;
    // @Mock private UserRepository userRepository;

    // private User testUser;
    // private Exam testExam;

    // @BeforeEach
    // void setUp() {
    //     // 테스트에 사용할 공통 Mock 엔티티 정의
    //     testUser = User.builder().id(1L).username("testuser").email("test@mail.com").build();
    //     testExam = Exam.builder().id(10L).title("Mock Exam").totalScore(100).build();
    // }

    // // ---------------------- 1. startAttempt 테스트 ----------------------

    // @Test
    // @DisplayName("시험 시작 성공: Attempt 엔티티가 생성되고 저장되어야 한다")
    // void startAttempt_Success() {
    //     // Given
    //     when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
    //     when(examRepository.findById(anyLong())).thenReturn(Optional.of(testExam));
    //     // when(attemptRepository.save(any(Attempt.class))) 대신, builder를 통해 객체 생성 후 반환되는 모습 모킹
    //     when(attemptRepository.save(any(Attempt.class))).thenAnswer(invocation -> {
    //         Attempt savedAttempt = invocation.getArgument(0);
    //         savedAttempt.setId(100L); // ID 할당 모킹
    //         return savedAttempt;
    //     });

    //     // When
    //     Attempt result = attemptService.startAttempt(testExam.getId(), testUser.getId());

    //     // Then
    //     assertThat(result).isNotNull();
    //     assertThat(result.getExam().getId()).isEqualTo(testExam.getId()); // Exam 객체가 매핑되었는지 확인
    //     assertThat(result.getUser().getId()).isEqualTo(testUser.getId());   // User 객체가 매핑되었는지 확인
    //     assertThat(result.getStatus()).isEqualTo(AttemptStatus.IN_PROGRESS);
    //     verify(attemptRepository, times(1)).save(any(Attempt.class));
    // }

    // @Test
    // @DisplayName("시험 시작 실패: 존재하지 않는 ExamId는 예외를 발생시켜야 한다")
    // void startAttempt_ExamNotFound() {
    //     // Given
    //     when(examRepository.findById(anyLong())).thenReturn(Optional.empty());

    //     // When & Then
    //     assertThrows(RuntimeException.class, () -> {
    //         attemptService.startAttempt(99L, testUser.getId());
    //     });
    // }

    // // ---------------------- 2. submitAndGrade 테스트 ----------------------
    
    // @Test
    // @DisplayName("시험 제출 및 채점 성공: 총점과 상태가 업데이트되고 랭킹에 반영되어야 한다")
    // void submitAndGrade_Success() {
    //     // Given
    //     Long attemptId = 200L;
    //     int questionScore = 20;
    //     // DTO 필드에 맞춰 Integer(int) 타입으로 수정
    //     int expectedScore = 40; 

    //     // Mock Attempt (IN_PROGRESS 상태)
    //     Attempt mockAttempt = Attempt.builder()
    //             .id(attemptId)
    //             .exam(testExam)
    //             .user(testUser)
    //             .status(AttemptStatus.IN_PROGRESS)
    //             .totalScore(0)
    //             .build();
    //     when(attemptRepository.findById(attemptId)).thenReturn(Optional.of(mockAttempt));
        
    //     // Mock Questions (2문제, MCQ, 점수 20점)
    //     Question q1 = Question.builder().id(1L).type(QuestionType.MCQ).answerKey("A").score(questionScore).build();
    //     Question q2 = Question.builder().id(2L).type(QuestionType.MCQ).answerKey("B").score(questionScore).build();
    //     List<Question> questions = List.of(q1, q2);
    //     when(questionRepository.findByExamId(testExam.getId())).thenReturn(questions);

    //     // Mock Answers (2문제, 모두 정답)
    //     Answer ans1 = Answer.builder().id(101L).attemptId(attemptId).questionId(1L).selectedChoices("A").build(); 
    //     Answer ans2 = Answer.builder().id(102L).attemptId(attemptId).questionId(2L).selectedChoices("B").build(); 
    //     List<Answer> answers = List.of(ans1, ans2);
    //     when(answerRepository.findByAttemptId(attemptId)).thenReturn(answers);

    //     // Mock save
    //     when(answerRepository.saveAll(anyList())).thenReturn(answers);
    //     when(attemptRepository.save(any(Attempt.class))).thenReturn(mockAttempt);


    //     // When
    //     AttemptSubmitRes result = attemptService.submitAndGrade(attemptId);

    //     // Then
    //     // 1. DTO 필드 검증 (Record는 필드명과 동일한 메서드 사용: totalScore(), correctCount())
    //     assertThat(result.totalScore()).isEqualTo(expectedScore);
    //     assertThat(result.correctCount()).isEqualTo(2);
        
    //     // 2. 엔티티 상태 검증 (엔티티의 totalScore는 Double 타입)
    //     assertThat(mockAttempt.getTotalScore()).isEqualTo(40); 
    //     assertThat(mockAttempt.getStatus()).isEqualTo(AttemptStatus.GRADED); 
        
    //     // 3. 랭킹 서비스 호출 검증 (Double 타입 점수 사용)
    //     verify(rankingService, times(1)).increaseSubmission(testUser.getId());
    //     verify(rankingService, times(1)).updateExamRanking(testExam.getId(), testUser.getId(), (double)expectedScore);
    //     verify(attemptRepository, times(1)).save(mockAttempt);
    // }
    
    // @Test
    // @DisplayName("시험 제출 실패: 이미 채점된 경우 예외 발생")
    // void submitAndGrade_AlreadyGraded() {
    //     // Given
    //     Long attemptId = 200L;
    //     Attempt mockAttempt = Attempt.builder().id(attemptId).status(AttemptStatus.GRADED).build();
    //     when(attemptRepository.findById(attemptId)).thenReturn(Optional.of(mockAttempt));

    //     // When & Then
    //     assertThrows(RuntimeException.class, () -> {
    //         attemptService.submitAndGrade(attemptId);
    //     });
    // }

    // // ---------------------- 3. getAttemptHistory 테스트 ----------------------

    // @Test
    // @DisplayName("응시 이력 조회 성공: 사용자 ID로 이력 목록이 반환되어야 한다")
    // void getAttemptHistory_Success() {
    //     // Given
    //     String identifier = testUser.getUsername();
    //     Pageable pageable = PageRequest.of(0, 10);
        
    //     // Mock User 조회
    //     when(userRepository.findByUsernameOrEmail(identifier, identifier)).thenReturn(Optional.of(testUser));
        
    //     // Mock Attempt 목록
    //     Attempt attempt1 = Attempt.builder()
    //             .id(301L)
    //             .exam(testExam)
    //             .user(testUser)
    //             .status(AttemptStatus.GRADED)
    //             .submittedAt(Instant.now())
    //             .totalScore(85)
    //             .build();
        
    //     List<Attempt> attempts = List.of(attempt1);
    //     Page<Attempt> mockPage = new PageImpl<>(attempts, pageable, 1);
    //     when(attemptRepository.findByUserId(testUser.getId(), pageable)).thenReturn(mockPage);

    //     // When
    //     Page<AttemptHistoryDto> resultPage = attemptService.getAttemptHistory(identifier, pageable);

    //     // Then
    //     assertThat(resultPage).isNotNull();
    //     assertThat(resultPage.getTotalElements()).isEqualTo(1);
    //     assertThat(resultPage.getContent().get(0).getExamTitle()).isEqualTo(testExam.getTitle());
    //     assertThat(resultPage.getContent().get(0).getFinalScore()).isEqualTo(85);
        
    //     // findByUsernameOrEmail이 올바른 인자로 호출되었는지 확인
    //     verify(userRepository, times(1)).findByUsernameOrEmail(identifier, identifier);
    //     verify(attemptRepository, times(1)).findByUserId(testUser.getId(), pageable);
    // }
    
    // @Test
    // @DisplayName("응시 이력 조회 실패: 사용자 식별자를 찾을 수 없는 경우 예외 발생")
    // void getAttemptHistory_UserNotFound() {
    //     // Given
    //     String identifier = "unknown";
    //     Pageable pageable = PageRequest.of(0, 10);
        
    //     when(userRepository.findByUsernameOrEmail(identifier, identifier)).thenReturn(Optional.empty());

    //     // When & Then
    //     assertThrows(RuntimeException.class, () -> {
    //         attemptService.getAttemptHistory(identifier, pageable);
    //     });
    //     verify(attemptRepository, never()).findByUserId(anyLong(), any());
    // }
}