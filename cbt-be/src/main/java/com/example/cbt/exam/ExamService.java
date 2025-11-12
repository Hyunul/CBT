package com.example.cbt.exam;

import com.example.cbt.question.Question;
import com.example.cbt.question.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

    @Transactional
    public Exam create(Exam exam) {
        return examRepository.save(exam);
    }

    public Exam get(Long id) {
        return examRepository.findById(id).orElseThrow();
    }

    public List<Exam> listPublished() {
        return examRepository.findByIsPublishedTrue();
    }

    @Transactional
    public Exam publish(Long id, boolean published) {
        Exam e = get(id);
        e.setPublished(published);
        return examRepository.save(e);
    }

    public List<Question> getQuestions(Long examId) {
        return questionRepository.findByExamId(examId);
    }
}
