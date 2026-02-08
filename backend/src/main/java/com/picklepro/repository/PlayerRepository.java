package com.picklepro.repository;

import com.picklepro.model.Player;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerRepository extends MongoRepository<Player, String> {

    List<Player> findByUserId(String userId);

    java.util.Optional<Player> findByEmail(String email);

    void deleteByIdAndUserId(String id, String userId);
}
