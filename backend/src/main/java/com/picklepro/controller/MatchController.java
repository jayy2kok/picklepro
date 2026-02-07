package com.picklepro.controller;

import com.picklepro.model.Match;
import com.picklepro.model.User;
import com.picklepro.service.MatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping
    public ResponseEntity<List<Match>> getMatches(@AuthenticationPrincipal User user) {
        List<Match> matches = matchService.getMatchesForUser(user.getId());
        return ResponseEntity.ok(matches);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Match> createMatch(@AuthenticationPrincipal User user,
            @Valid @RequestBody Match match) {
        Match created = matchService.createMatch(match, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteMatch(@AuthenticationPrincipal User user,
            @PathVariable String id) {
        matchService.deleteMatch(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
