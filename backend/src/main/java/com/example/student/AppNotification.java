package com.example.student;

import java.time.Instant;
import java.util.UUID;

public class AppNotification {

    private String id;
    private String level;       // info | success | warning | danger
    private String title;
    private String message;
    private String forUser;     // username, or "*" for all
    private boolean read;
    private long timestamp;

    // Default constructor
    public AppNotification() {
        this.timestamp = Instant.now().toEpochMilli();
        this.read = false;
        this.level = "info";
    }

    // Full constructor
    public AppNotification(
            String id,
            String level,
            String title,
            String message,
            String forUser,
            boolean read,
            long timestamp) {

        this.id = id;
        this.level = level;
        this.title = title;
        this.message = message;
        this.forUser = forUser;
        this.read = read;
        this.timestamp = timestamp;
    }

    // Constructor used by ActivityService
    public AppNotification(
            String level,
            String title,
            String message,
            String forUser) {

        this.id = UUID.randomUUID().toString();
        this.level = level == null ? "info" : level;
        this.title = title;
        this.message = message;
        this.forUser = forUser;
        this.read = false;
        this.timestamp = Instant.now().toEpochMilli();
    }

    // ==============================
    // GETTERS
    // ==============================

    public String getId() {
        return id;
    }

    public String getLevel() {
        return level;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getForUser() {
        return forUser;
    }

    public boolean isRead() {
        return read;
    }

    public long getTimestamp() {
        return timestamp;
    }

    // ==============================
    // SETTERS
    // ==============================

    public void setId(String id) {
        this.id = id;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setForUser(String forUser) {
        this.forUser = forUser;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}