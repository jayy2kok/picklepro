package com.picklepro.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.picklepro.dto.AuthResponse;
import com.picklepro.model.Role;
import com.picklepro.model.User;
import com.picklepro.repository.UserRepository;
import com.picklepro.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.Collections;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${google.client-id}")
    private String googleClientId;

    @Value("${picklepro.admin-emails}")
    private String adminEmails;

    public AuthResponse authenticateWithGoogle(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);

            if (googleIdToken == null) {
                throw new RuntimeException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            // Determine role
            Role role = Arrays.asList(adminEmails.split(",")).contains(email) ? Role.ADMIN : Role.VIEWER;

            User user = userRepository.findByGoogleId(googleId)
                    .orElseGet(() -> createUser(googleId, email, name, picture, role));

            // Update user info and role if changed
            boolean changed = false;
            if (!user.getName().equals(name)) {
                user.setName(name);
                changed = true;
            }
            if (!user.getPicture().equals(picture)) {
                user.setPicture(picture);
                changed = true;
            }
            if (user.getRole() != role) {
                user.setRole(role);
                changed = true;
            }

            if (changed) {
                user = userRepository.save(user);
            }

            String jwt = jwtTokenProvider.generateToken(user.getId());

            return new AuthResponse(jwt, user);

        } catch (GeneralSecurityException | IOException e) {
            log.error("Error verifying Google ID token", e);
            throw new RuntimeException("Failed to authenticate with Google", e);
        }
    }

    private User createUser(String googleId, String email, String name, String picture, Role role) {
        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .googleId(googleId)
                .email(email)
                .name(name)
                .picture(picture)
                .role(role)
                .build();
        return userRepository.save(user);
    }
}
