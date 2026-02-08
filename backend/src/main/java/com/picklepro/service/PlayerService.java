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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;

    public List<Player> getPlayersForUser(String userId) {
        return playerRepository.findByUserId(userId);
    }

    public Player createPlayer(Player player, String userId) {
        player.setId(UUID.randomUUID().toString());
        player.setUserId(userId);
        player.setJoinedDate(Instant.now());
        return playerRepository.save(player);
    }

    @Transactional
    public Player updatePlayer(String id, Player updatedPlayer, User currentUser) {
        Player existingPlayer = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
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

        return playerRepository.save(existingPlayer);
    }

    @Transactional
    public void deletePlayer(String playerId, String userId) {
        playerRepository.deleteByIdAndUserId(playerId, userId);
    }
}
