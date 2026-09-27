package com.example.student;

import java.time.Instant;
import java.util.UUID;

public class Announcement {

    private String id;
    private String author;
    private String title;
    private String body;
    private String level;   // info | success | warning | danger
    private long timestamp;
    private boolean pinned;

    // Default constructor
    public Announcement() {
        this.timestamp = Instant.now().toEpochMilli();
        this.level = "info";
        this.pinned = false;
    }

    // Full constructor
    public Announcement(
            String id,
            String author,
            String title,
            String body,
            String level,
            long timestamp,
            boolean pinned) {

        this.id = id;
        this.author = author;
        this.title = title;
        this.body = body;
        this.level = level;
        this.timestamp = timestamp;
        this.pinned = pinned;
    }

    // Constructor used by ActivityService
    public Announcement(
            String author,
            String title,
            String body,
            String level) {

        this.id = UUID.randomUUID().toString();
        this.author = author;
        this.title = title;
        this.body = body;
        this.level = level == null ? "info" : level;
        this.timestamp = Instant.now().toEpochMilli();
        this.pinned = false;
    }

    // ==============================
    // GETTERS
    // ==============================

    public String getId() {
        return id;
    }

    public String getAuthor() {
        return author;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public String getLevel() {
        return level;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public boolean isPinned() {
        return pinned;
    }

    // ==============================
    // SETTERS
    // ==============================

    public void setId(String id) {
        this.id = id;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }
}