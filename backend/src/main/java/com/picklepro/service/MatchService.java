package com.picklepro.service;

import com.picklepro.model.Match;
import com.picklepro.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;

    public List<Match> getMatchesForUser(String userId) {
        return matchRepository.findByUserIdOrderByDateDesc(userId);
    }

    public Match createMatch(Match match, String userId) {
        match.setId(UUID.randomUUID().toString());
        match.setUserId(userId);
        return matchRepository.save(match);
    }

    @Transactional
    public void deleteMatch(String matchId, String userId) {
        matchRepository.deleteByIdAndUserId(matchId, userId);
    }
}
