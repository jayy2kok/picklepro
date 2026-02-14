package com.picklepro.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.picklepro.model.Player;
import com.picklepro.model.Role;
import com.picklepro.model.User;
import com.picklepro.repository.PlayerRepository;
import com.picklepro.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String userId = tokenProvider.getUserIdFromToken(jwt);

                User user = userRepository.findById(userId).orElse(null);
                Player player = playerRepository.findById(userId).orElse(null);
                if (player != null && user != null) {
                    if (!player.getMemberships().equals(user.getMemberships())) {
                        user.setMemberships(player.getMemberships());
                        userRepository.save(user);
                    }
                }
                if (user != null) {
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getSystemRole().name()));

                    // Add ROLE_GROUP_ADMIN if they are admin in any group
                    boolean isGroupAdmin = false;
                    if (user.getMemberships() != null) {
                        isGroupAdmin = user.getMemberships().values().stream()
                                .anyMatch(role -> role == Role.GROUP_ADMIN);
                    }

                    if (isGroupAdmin) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_GROUP_ADMIN"));
                    }

                    // Re-attach the principal with authorities
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(user,
                            null, authorities);
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception e) {
            log.error("Could not set user authentication in security context", e);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
