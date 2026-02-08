package com.picklepro.repository;

import com.picklepro.model.Venue;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface VenueRepository extends MongoRepository<Venue, String> {
}
