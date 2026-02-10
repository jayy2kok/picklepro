package com.picklepro.repository;

import com.picklepro.model.Match;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchRepository extends MongoRepository<Match, String>, MatchRepositoryCustom {

    List<Match> findByUserId(String userId);

    List<Match> findByUserIdOrderByDateDesc(String userId);

    List<Match> findAllByOrderByDateDesc();

    void deleteByIdAndUserId(String id, String userId);
}
