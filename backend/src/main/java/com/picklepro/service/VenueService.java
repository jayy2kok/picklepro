package com.picklepro.service;

import com.picklepro.model.Venue;
import com.picklepro.repository.VenueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VenueService {

    private final VenueRepository venueRepository;

    public List<Venue> getAllVenues() {
        return venueRepository.findAll();
    }

    public Venue createVenue(Venue venue) {
        if (venue.getId() == null) {
            venue.setId(UUID.randomUUID().toString());
        }
        return venueRepository.save(venue);
    }

    public Venue updateVenue(String id, Venue venue) {
        Venue existing = venueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venue not found"));
        existing.setName(venue.getName());
        existing.setLocation(venue.getLocation());
        existing.setCourtCount(venue.getCourtCount());
        return venueRepository.save(existing);
    }

    public void deleteVenue(String id) {
        venueRepository.deleteById(id);
    }
}
