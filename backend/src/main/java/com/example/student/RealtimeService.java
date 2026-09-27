package com.example.student;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class RealtimeService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter register() {

        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));

        emitter.onTimeout(() -> emitters.remove(emitter));

        emitter.onError(error -> emitters.remove(emitter));

        try {
            emitter.send(
                    SseEmitter.event()
                            .name("connected")
                            .data("Connection successful")
            );
        } catch (IOException | IllegalStateException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcast(String event, Object data) {

        for (SseEmitter emitter : emitters) {

            try {
                emitter.send(
                        SseEmitter.event()
                                .name(event)
                                .data(data)
                );
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
            }
        }
    }

    public int activeConnections() {
        return emitters.size();
    }
}