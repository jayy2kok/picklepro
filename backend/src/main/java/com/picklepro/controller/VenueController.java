package com.picklepro.controller;

import com.picklepro.model.User;
import com.picklepro.model.Venue;
import com.picklepro.service.VenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @GetMapping
    public ResponseEntity<List<Venue>> getAllVenues() {
        return ResponseEntity.ok(venueService.getAllVenues());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('GROUP_ADMIN')")
    public ResponseEntity<Venue> createVenue(@AuthenticationPrincipal User user,
            @RequestBody Venue venue,
            @RequestParam(required = false) String groupId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(venueService.createVenue(venue, user.getId(), groupId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Venue> updateVenue(@AuthenticationPrincipal User user, @PathVariable String id,
            @RequestBody Venue venue) {
        return ResponseEntity.ok(venueService.updateVenue(id, venue, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVenue(@AuthenticationPrincipal User user, @PathVariable String id) {
        venueService.deleteVenue(id, user);
        return ResponseEntity.noContent().build();
    }
}
