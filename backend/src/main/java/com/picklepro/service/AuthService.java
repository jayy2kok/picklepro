package com.picklepro.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.picklepro.dto.AuthResponse;
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
    private final com.picklepro.repository.PlayerRepository playerRepository;

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

            // Fix: implicit flow can return email_verified as String instead of Boolean
            Object emailVerified = payload.get("email_verified");
            if (emailVerified instanceof String) {
                payload.set("email_verified", Boolean.parseBoolean((String) emailVerified));
            }

            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            // Determine system role
            boolean isAdmin = Arrays.asList(adminEmails.split(",")).contains(email);
            User.SystemRole systemRole = isAdmin ? User.SystemRole.ADMIN : User.SystemRole.USER;

            User user = userRepository.findByGoogleId(googleId)
                    .orElseGet(() -> createUser(googleId, email, name, picture, systemRole));

            // Update user info and role if changed
            boolean changed = false;
            // Only update role if it's currently different or if we just determined they
            // should be admin
            if (user.getSystemRole() != systemRole) {
                user.setSystemRole(systemRole);
                changed = true;
            }
            if (!user.getName().equals(name)) {
                user.setName(name);
                changed = true;
            }
            if (!user.getPicture().equals(picture)) {
                user.setPicture(picture);
                changed = true;
            }

            if (changed) {
                user = userRepository.save(user);
            }

            final User finalUser = user;

            // Sync system role to Player entity if exists
            playerRepository.findByEmail(email).ifPresent(player -> {
                if (player.getSystemRole() != finalUser.getSystemRole()) {
                    player.setSystemRole(finalUser.getSystemRole());
                    playerRepository.save(player);
                }
            });

            String jwt = jwtTokenProvider.generateToken(user.getId());

            return new AuthResponse(jwt, user);

        } catch (GeneralSecurityException | IOException e) {
            log.error("Error verifying Google ID token", e);
            throw new RuntimeException("Failed to authenticate with Google", e);
        }
    }

    private User createUser(String googleId, String email, String name, String picture, User.SystemRole systemRole) {
        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .googleId(googleId)
                .email(email)
                .name(name)
                .picture(picture)
                .systemRole(systemRole)
                .build();
        return userRepository.save(user);
    }
}
