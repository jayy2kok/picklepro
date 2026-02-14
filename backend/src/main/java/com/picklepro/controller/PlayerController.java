package com.picklepro.controller;

import com.picklepro.model.Player;
import com.picklepro.model.Role;
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

    @GetMapping("/by-email/{email}")
    public ResponseEntity<Player> getPlayerByEmail(@PathVariable String email) {
        return playerService.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('GROUP_ADMIN')")
    public ResponseEntity<Player> createPlayer(@AuthenticationPrincipal User user,
            @Valid @RequestBody Player player,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) Role role) {
        Player created = playerService.createPlayer(player, user, groupId, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{playerId}/groups/{groupId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GROUP_ADMIN')")
    public ResponseEntity<Void> addToGroup(@AuthenticationPrincipal User user,
            @PathVariable String playerId,
            @PathVariable String groupId,
            @RequestParam Role role) {
        playerService.addPlayerToGroup(playerId, groupId, role, user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{playerId}/groups/{groupId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GROUP_ADMIN')")
    public ResponseEntity<Void> removeFromGroup(@AuthenticationPrincipal User user,
            @PathVariable String playerId,
            @PathVariable String groupId) {
        playerService.removePlayerFromGroup(playerId, groupId, user);
        return ResponseEntity.noContent().build();
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
