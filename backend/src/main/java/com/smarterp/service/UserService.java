package com.smarterp.service;

import com.smarterp.dto.AuthResponse;
import com.smarterp.dto.LoginRequest;
import com.smarterp.dto.RegisterRequest;
import com.smarterp.dto.UserDTO;
import com.smarterp.entity.User;
import com.smarterp.repository.UserRepository;
import com.smarterp.util.HashUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public UserDTO register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(HashUtils.hashPassword(request.getPassword()))
                .role("USER")
                .build();

        User saved = userRepository.save(user);
        return convertToDTO(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!HashUtils.verifyPassword(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Generate a simple mock token
        String token = "mock-jwt-token-" + UUID.randomUUID().toString();

        return AuthResponse.builder()
                .token(token)
                .user(convertToDTO(user))
                .build();
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    /**
     * Seed default admin user on application startup if no users exist.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultAdmin() {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .name("System Administrator")
                    .email("admin@smarterp.com")
                    .password(HashUtils.hashPassword("admin123"))
                    .role("ADMIN")
                    .build();
            userRepository.save(admin);
            System.out.println("=================================================");
            System.out.println("SmartERP: Seeded default Admin user successfully!");
            System.out.println("Email: admin@smarterp.com");
            System.out.println("Password: admin123");
            System.out.println("=================================================");
        }
    }
}
