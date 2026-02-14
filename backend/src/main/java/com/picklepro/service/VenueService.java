package com.picklepro.service;

import com.picklepro.model.Match;
import com.picklepro.model.Role;
import com.picklepro.model.User;
import com.picklepro.model.Venue;
import com.picklepro.repository.MatchRepository;
import com.picklepro.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VenueService {

    private final VenueRepository venueRepository;
    private final MatchRepository matchRepository;

    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    public Venue createVenue(Venue venue, String userId, String groupId) {
        if (venue.getId() == null) {
            venue.setId(UUID.randomUUID().toString());
        }
        venue.setCreatedByUserId(userId);
        venue.setGroupId(groupId);
        return venueRepository.save(venue);
    }

    @Transactional
    public Venue updateVenue(String id, Venue venue, User currentUser) {
        Venue existing = venueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venue not found"));

        validateOwnership(existing, currentUser);

        existing.setName(venue.getName());
        existing.setLocation(venue.getLocation());
        existing.setCourtCount(venue.getCourtCount());
        return venueRepository.save(existing);
    }

    @Transactional
    public void deleteVenue(String id, User currentUser) {
        Venue existing = venueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venue not found"));

        validateOwnership(existing, currentUser);

        // Mark Matches with (UNKNOWN)
        updateMatchesWithUnknownVenue(id);

        venueRepository.deleteById(id);
    }

    private void validateOwnership(Venue venue, User currentUser) {
        boolean isSystemAdmin = currentUser.getSystemRole() == User.SystemRole.ADMIN;
        boolean isCreator = venue.getCreatedByUserId() != null
                && venue.getCreatedByUserId().equals(currentUser.getId());
        boolean isGroupAdmin = venue.getGroupId() != null
                && currentUser.getMemberships().getOrDefault(venue.getGroupId(), null) == Role.GROUP_ADMIN;

        if (!isSystemAdmin && !isCreator && !isGroupAdmin) {
            throw new RuntimeException(
                    "Unauthorized: You can only manage venues you created or manage as a Group Admin.");
        }
    }

    private void updateMatchesWithUnknownVenue(String venueId) {
        // Optimized: only fetch matches that use this venue
        List<Match> matches = matchRepository.findByVenueId(venueId);
        matches.forEach(m -> {
            m.setVenueId("UNKNOWN");
            matchRepository.save(m);
        });
    }
}
