package com.example.student;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface StudentRepository extends MongoRepository<Student, String> {
    Optional<Student> findByStudentId(String studentId);
    void deleteByStudentId(String studentId);
    boolean existsByStudentId(String studentId);
}
