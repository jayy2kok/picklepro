package com.picklepro.service;

import com.picklepro.model.Player;
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
    public void deletePlayer(String playerId, String userId) {
        playerRepository.deleteByIdAndUserId(playerId, userId);
    }
}
