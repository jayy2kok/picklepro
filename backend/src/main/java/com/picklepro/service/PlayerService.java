package com.picklepro.service;

import com.picklepro.model.Player;
import com.picklepro.model.Role;
import com.picklepro.model.User;
import com.picklepro.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final com.picklepro.repository.UserRepository userRepository;

    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    public Optional<Player> findByEmail(String email) {
        return playerRepository.findByEmail(email);
    }

    @Transactional
    public Player createPlayer(Player player, User currentUser, String groupId, Role role) {
        if (player.getEmail() != null && playerRepository.findByEmail(player.getEmail()).isPresent()) {
            throw new RuntimeException(
                    "Player with this email already exists across the system. Use the reuse option.");
        }

        if (groupId != null) {
            validateGroupAdmin(currentUser, groupId);
        }

        player.setId(UUID.randomUUID().toString());
        // Do not bind to currentUser. Only external auth (Google) binds users.
        // Or if we want to support manual binding later.
        // For now, removing the binding to currentUser as it causes issues when Admin
        // creates other players.
        // player.setUserId(currentUser.getId());
        player.setJoinedDate(Instant.now());

        if (groupId != null && role != null) {
            if (player.getMemberships() == null) {
                player.setMemberships(new java.util.HashMap<>());
            }
            player.getMemberships().put(groupId, role);
        }

        Player savedPlayer = playerRepository.save(player);
        syncRolesToUser(savedPlayer);
        return savedPlayer;
    }

    @Transactional
    public void addPlayerToGroup(String playerId, String groupId, Role role, User currentUser) {
        validateGroupAdmin(currentUser, groupId);
        Player player = playerRepository.findById(playerId).orElseThrow(() -> new RuntimeException("Player not found"));

        if (player.getMemberships() == null) {
            player.setMemberships(new java.util.HashMap<>());
        }
        player.getMemberships().put(groupId, role);
        Player savedPlayer = playerRepository.save(player);
        syncRolesToUser(savedPlayer);
    }

    @Transactional
    public void removePlayerFromGroup(String playerId, String groupId, User currentUser) {
        validateGroupAdmin(currentUser, groupId);
        Player player = playerRepository.findById(playerId).orElseThrow(() -> new RuntimeException("Player not found"));

        if (player.getMemberships() != null) {
            player.getMemberships().remove(groupId);
            Player savedPlayer = playerRepository.save(player);
            syncRolesToUser(savedPlayer);
        }
    }

    private void validateGroupAdmin(User user, String groupId) {
        boolean isSystemAdmin = user.getSystemRole() == User.SystemRole.ADMIN;
        boolean isGroupAdmin = user.getMemberships().getOrDefault(groupId, null) == Role.GROUP_ADMIN;

        if (!isSystemAdmin && !isGroupAdmin) {
            throw new RuntimeException("Unauthorized: You must be a Group Admin to perform this action.");
        }
    }

    @Transactional
    public Player updatePlayer(String id, Player updatedPlayer, User currentUser) {
        Player existingPlayer = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        boolean isAdmin = currentUser.getSystemRole() == User.SystemRole.ADMIN;
        boolean isOwner = existingPlayer.getEmail() != null
                && existingPlayer.getEmail().equalsIgnoreCase(currentUser.getEmail());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Unauthorized: You can only update your own player profile");
        }

        // update allowed fields
        existingPlayer.setName(updatedPlayer.getName());
        existingPlayer.setContactNumber(updatedPlayer.getContactNumber());
        existingPlayer.setSocialMedia(updatedPlayer.getSocialMedia());

        // Only ADMIN can update email
        if (isAdmin && updatedPlayer.getEmail() != null) {
            existingPlayer.setEmail(updatedPlayer.getEmail());
        }

        Player savedPlayer = playerRepository.save(existingPlayer);
        syncRolesToUser(savedPlayer);
        return savedPlayer;
    }

    @Transactional
    public void deletePlayer(String playerId, String userId) {
        playerRepository.deleteByIdAndUserId(playerId, userId);
    }

    private void syncRolesToUser(Player player) {
        if (player == null)
            return;

        User user = null;
        if (player.getUserId() != null) {
            user = userRepository.findById(player.getUserId()).orElse(null);
        }

        // Fallback: try to find by email if user not found by ID
        if (user == null && player.getEmail() != null) {
            user = userRepository.findByEmail(player.getEmail()).orElse(null);
            // If found by email, link them now
            if (user != null) {
                player.setUserId(user.getId());
                playerRepository.save(player);
            }
        }

        if (user != null) {
            boolean changed = false;

            // Sync memberships
            if (player.getMemberships() != null && !player.getMemberships().equals(user.getMemberships())) {
                user.setMemberships(new java.util.HashMap<>(player.getMemberships()));
                changed = true;
            }

            // Sync system role
            if (player.getSystemRole() != null) {
                // Map Player SystemRole to User SystemRole if they are compatible enums
                // Assuming they are identical for now based on previous context
                try {
                    User.SystemRole userRole = User.SystemRole.valueOf(player.getSystemRole().name());
                    if (user.getSystemRole() != userRole) {
                        user.setSystemRole(userRole);
                        changed = true;
                    }
                } catch (IllegalArgumentException e) {
                    // Ignore if roles don't map 1:1, or handle gracefully
                }
            }

            if (changed) {
                userRepository.save(user);
            }
        }
    }
}
