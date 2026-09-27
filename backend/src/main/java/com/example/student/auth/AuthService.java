package com.example.student.auth;

import com.example.student.ActivityService;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository repository;
    private final ActivityService activityService;

    public AuthService(UserRepository repository,
                       ActivityService activityService) {
        this.repository = repository;
        this.activityService = activityService;
    }

    // ==============================
    // LOGIN
    // ==============================

    public Optional<User> login(String username, String password) {

        if (username == null || username.isBlank()
                || password == null || password.isBlank()) {
            return Optional.empty();
        }

        Optional<User> user =
                repository.findByUsername(username);

        if (user.isPresent()
                && password.equals(user.get().getPassword())) {

            User loggedInUser = user.get();

            activityService.log(
                    "LOGIN",
                    loggedInUser.getUsername(),
                    loggedInUser.getUsername(),
                    loggedInUser.getRole() + " signed in"
            );

            return Optional.of(loggedInUser);
        }

        return Optional.empty();
    }

    // ==============================
    // REGISTER
    // ==============================

    public User register(User user) {

        if (user == null) {
            throw new RuntimeException("User data is required");
        }

        if (user.getUsername() == null
                || user.getUsername().isBlank()) {
            throw new RuntimeException("Username required");
        }

        if (user.getPassword() == null
                || user.getPassword().isBlank()) {
            throw new RuntimeException("Password required");
        }

        if (repository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Default role
        if (user.getRole() == null
                || user.getRole().isBlank()) {
            user.setRole("STUDENT");
        }

        User savedUser =
                repository.save(user);

        activityService.log(
                "CREATE",
                "system",
                savedUser.getUsername(),
                "Registered " + savedUser.getRole()
        );

        return savedUser;
    }
}