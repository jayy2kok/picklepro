package com.picklepro.controller;

import com.picklepro.model.Player;
import com.picklepro.model.User;
import com.picklepro.service.PlayerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    public ResponseEntity<List<Player>> getPlayers() {
        List<Player> players = playerService.getAllPlayers();
        return ResponseEntity.ok(players);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Player> createPlayer(@AuthenticationPrincipal User user,
            @Valid @RequestBody Player player) {
        Player created = playerService.createPlayer(player, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Player> updatePlayer(@AuthenticationPrincipal User user,
            @PathVariable String id,
            @RequestBody Player player) {
        Player updated = playerService.updatePlayer(id, player, user);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePlayer(@AuthenticationPrincipal User user,
            @PathVariable String id) {
        playerService.deletePlayer(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
