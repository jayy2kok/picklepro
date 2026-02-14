package com.picklepro.service;

import com.picklepro.dto.MatchResponse;
import com.picklepro.model.Match;
import com.picklepro.model.Player;
import com.picklepro.model.Role;
import com.picklepro.model.User;
import com.picklepro.repository.MatchRepository;
import com.picklepro.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;
    private final RatingService ratingService;

    public List<MatchResponse> getAllMatches() {
        return matchRepository.findAllMatchesWithPlayerNames();
    }

    @Transactional
    public MatchResponse createMatch(Match match, String userId) {
        match.setId(UUID.randomUUID().toString());
        match.setUserId(userId);
        Match savedMatch = matchRepository.save(match);
        ratingService.updateRatings(savedMatch);
        return toMatchResponse(savedMatch);
    }

    @Transactional
    public void deleteMatch(String matchId, User currentUser) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        boolean isSystemAdmin = currentUser.getSystemRole() == User.SystemRole.ADMIN;
        boolean isCreator = match.getUserId() != null && match.getUserId().equals(currentUser.getId());

        boolean isGroupAdmin = false;
        if (match.getGroupId() != null && currentUser.getMemberships() != null) {
            isGroupAdmin = currentUser.getMemberships().get(match.getGroupId()) == Role.GROUP_ADMIN;
        }

        if (isSystemAdmin || isCreator || isGroupAdmin) {
            matchRepository.deleteById(matchId);
            // Optionally update ratings if needed (revert)
        } else {
            throw new RuntimeException("Unauthorized: You cannot delete this match.");
        }
    }

    private MatchResponse toMatchResponse(Match match) {
        // Collect all unique player IDs from both teams
        List<String> allIds = new java.util.ArrayList<>();
        if (match.getTeamA() != null)
            allIds.addAll(match.getTeamA());
        if (match.getTeamB() != null)
            allIds.addAll(match.getTeamB());

        // Batch-fetch players and build an ID -> name map
        Map<String, String> idToName = StreamSupport
                .stream(playerRepository.findAllById(allIds).spliterator(), false)
                .collect(Collectors.toMap(Player::getId, Player::getName));

        return MatchResponse.builder()
                .id(match.getId())
                .date(match.getDate())
                .type(match.getType())
                .teamANames(match.getTeamA() == null ? List.of()
                        : match.getTeamA().stream().map(id -> idToName.getOrDefault(id, id)).toList())
                .teamBNames(match.getTeamB() == null ? List.of()
                        : match.getTeamB().stream().map(id -> idToName.getOrDefault(id, id)).toList())
                .scoreA(match.getScoreA())
                .scoreB(match.getScoreB())
                .notes(match.getNotes())
                .venueId(match.getVenueId())
                .courtNumber(match.getCourtNumber())
                .userId(match.getUserId())
                .groupId(match.getGroupId())
                .build();
    }
}
