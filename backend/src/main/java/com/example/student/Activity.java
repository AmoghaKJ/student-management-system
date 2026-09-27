package com.example.student;

import java.time.Instant;
import java.util.UUID;

public class Activity {

    private String id;
    private String type;
    private String actor;
    private String target;
    private String message;
    private long timestamp;

    public Activity() {
        this.timestamp = Instant.now().toEpochMilli();
    }

    public Activity(String type, String actor, String target, String message) {
        this.id = UUID.randomUUID().toString();
        this.type = type;
        this.actor = actor;
        this.target = target;
        this.message = message;
        this.timestamp = Instant.now().toEpochMilli();
    }

    public Activity(String id, String type, String actor,
                    String target, String message, long timestamp) {
        this.id = id;
        this.type = type;
        this.actor = actor;
        this.target = target;
        this.message = message;
        this.timestamp = timestamp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}