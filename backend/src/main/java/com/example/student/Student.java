package com.example.student;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "students")
public class Student {

    @Id
    private String id;

    private String studentId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String department;
    private String batch;
    private int age;
    private String gender;
    private String address;
    private String avatarColor;

    // Semester GPAs
    private double gpa1;
    private double gpa2;
    private double gpa3;
    private double gpa4;
    private double gpa5;

    // Cumulative CGPAs
    private double cgpa1;
    private double cgpa2;
    private double cgpa3;
    private double cgpa4;
    private double cgpa5;

    // Core fields
    private int attendance;
    private double placementScore;
    private boolean isAtRisk;
    private int backlogs;

    // Metadata
    private long createdAt;
    private long updatedAt;

    // Default constructor
    public Student() {
        this.createdAt = Instant.now().toEpochMilli();
        this.updatedAt = Instant.now().toEpochMilli();
    }

    // Full constructor
    public Student(
            String id,
            String studentId,
            String firstName,
            String lastName,
            String email,
            String phone,
            String department,
            String batch,
            int age,
            String gender,
            String address,
            String avatarColor,
            double gpa1,
            double gpa2,
            double gpa3,
            double gpa4,
            double gpa5,
            double cgpa1,
            double cgpa2,
            double cgpa3,
            double cgpa4,
            double cgpa5,
            int attendance,
            double placementScore,
            boolean isAtRisk,
            int backlogs,
            long createdAt,
            long updatedAt) {

        this.id = id;
        this.studentId = studentId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.department = department;
        this.batch = batch;
        this.age = age;
        this.gender = gender;
        this.address = address;
        this.avatarColor = avatarColor;
        this.gpa1 = gpa1;
        this.gpa2 = gpa2;
        this.gpa3 = gpa3;
        this.gpa4 = gpa4;
        this.gpa5 = gpa5;
        this.cgpa1 = cgpa1;
        this.cgpa2 = cgpa2;
        this.cgpa3 = cgpa3;
        this.cgpa4 = cgpa4;
        this.cgpa5 = cgpa5;
        this.attendance = attendance;
        this.placementScore = placementScore;
        this.isAtRisk = isAtRisk;
        this.backlogs = backlogs;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAvatarColor() {
        return avatarColor;
    }

    public void setAvatarColor(String avatarColor) {
        this.avatarColor = avatarColor;
    }

    public double getGpa1() {
        return gpa1;
    }

    public void setGpa1(double gpa1) {
        this.gpa1 = gpa1;
    }

    public double getGpa2() {
        return gpa2;
    }

    public void setGpa2(double gpa2) {
        this.gpa2 = gpa2;
    }

    public double getGpa3() {
        return gpa3;
    }

    public void setGpa3(double gpa3) {
        this.gpa3 = gpa3;
    }

    public double getGpa4() {
        return gpa4;
    }

    public void setGpa4(double gpa4) {
        this.gpa4 = gpa4;
    }

    public double getGpa5() {
        return gpa5;
    }

    public void setGpa5(double gpa5) {
        this.gpa5 = gpa5;
    }

    public double getCgpa1() {
        return cgpa1;
    }

    public void setCgpa1(double cgpa1) {
        this.cgpa1 = cgpa1;
    }

    public double getCgpa2() {
        return cgpa2;
    }

    public void setCgpa2(double cgpa2) {
        this.cgpa2 = cgpa2;
    }

    public double getCgpa3() {
        return cgpa3;
    }

    public void setCgpa3(double cgpa3) {
        this.cgpa3 = cgpa3;
    }

    public double getCgpa4() {
        return cgpa4;
    }

    public void setCgpa4(double cgpa4) {
        this.cgpa4 = cgpa4;
    }

    public double getCgpa5() {
        return cgpa5;
    }

    public void setCgpa5(double cgpa5) {
        this.cgpa5 = cgpa5;
    }

    public int getAttendance() {
        return attendance;
    }

    public void setAttendance(int attendance) {
        this.attendance = attendance;
    }

    public double getPlacementScore() {
        return placementScore;
    }

    public void setPlacementScore(double placementScore) {
        this.placementScore = placementScore;
    }

    public boolean isAtRisk() {
        return isAtRisk;
    }

    public void setAtRisk(boolean atRisk) {
        isAtRisk = atRisk;
    }

    public int getBacklogs() {
        return backlogs;
    }

    public void setBacklogs(int backlogs) {
        this.backlogs = backlogs;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(long updatedAt) {
        this.updatedAt = updatedAt;
    }
}