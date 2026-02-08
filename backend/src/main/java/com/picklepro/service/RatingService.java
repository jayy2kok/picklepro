package com.picklepro.service;

import com.picklepro.model.Match;
import com.picklepro.model.Player;
import com.picklepro.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final PlayerRepository playerRepository;
    private static final int K_FACTOR = 32;

    @Transactional
    public void updateRatings(Match match) {
        // Fetch all players involved
        // Assuming match has stored player IDs or we need to fetch them.
        // Match model currently stores 'teamA' and 'teamB' as List<String> (names or
        // IDs).
        // We need to ensure they are IDs to fetch players.

        // For this implementation, we will assume they are IDs or Names we can resolve.
        // But for robust rating, we really need Player IDs linked.
        // Let's assume the frontend sends Player IDs in match.teamA/teamB.

        List<String> teamAIds = match.getTeamA();
        List<String> teamBIds = match.getTeamB();

        if (teamAIds == null || teamBIds == null || teamAIds.isEmpty() || teamBIds.isEmpty()) {
            return; // Cannot rate without players
        }

        List<Player> teamAPlayers = (List<Player>) playerRepository.findAllById(teamAIds);
        List<Player> teamBPlayers = (List<Player>) playerRepository.findAllById(teamBIds);

        if (teamAPlayers.isEmpty() || teamBPlayers.isEmpty())
            return;

        double ratingA = getAverageRating(teamAPlayers);
        double ratingB = getAverageRating(teamBPlayers);

        double expectedA = 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400.0));
        double expectedB = 1.0 / (1.0 + Math.pow(10, (ratingA - ratingB) / 400.0));

        double actualA = match.getScoreA() > match.getScoreB() ? 1.0 : 0.0;
        // If draw (not typical in Pickleball but possible in casual), 0.5? Assuming
        // win/loss for now.

        // Calculate Rating Change
        double delta = K_FACTOR * (actualA - expectedA);

        // Apply updates
        updatePlayerRatings(teamAPlayers, delta);
        updatePlayerRatings(teamBPlayers, -delta);

        playerRepository.saveAll(teamAPlayers);
        playerRepository.saveAll(teamBPlayers);
    }

    private double getAverageRating(List<Player> players) {
        return players.stream()
                .mapToDouble(p -> p.getRating() != null ? p.getRating() : 1200.0)
                .average()
                .orElse(1200.0);
    }

    private void updatePlayerRatings(List<Player> players, double delta) {
        for (Player p : players) {
            double current = p.getRating() != null ? p.getRating() : 1200.0;
            p.setRating(current + delta);
        }
    }
}
