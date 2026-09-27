
package com.example.student.auth;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String username;
    private String password;
    private String role;       // ADMIN or STUDENT
    private String studentId;  // Used only when role is STUDENT

    // Default constructor
    public User() {
    }

    // Parameterized constructor
    public User(String id, String username, String password, String role, String studentId) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.studentId = studentId;
    }

    // Getter and Setter for id
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    // Getter and Setter for username
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    // Getter and Setter for password
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Getter and Setter for role
    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    // Getter and Setter for studentId
    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }
}

