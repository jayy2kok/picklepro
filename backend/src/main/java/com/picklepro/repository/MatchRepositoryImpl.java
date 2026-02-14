package com.picklepro.repository;

import com.picklepro.dto.MatchResponse;
import com.picklepro.model.Match;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.LookupOperation;
import org.springframework.data.mongodb.core.aggregation.ProjectionOperation;
import org.springframework.stereotype.Repository;

import java.util.List;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Repository
@RequiredArgsConstructor
public class MatchRepositoryImpl implements MatchRepositoryCustom {

        private final MongoTemplate mongoTemplate;

        @Override
        public List<MatchResponse> findAllMatchesWithPlayerNames() {
                // Lookup for Team A players
                LookupOperation lookupTeamA = LookupOperation.newLookup()
                                .from("players")
                                .localField("teamA")
                                .foreignField("_id")
                                .as("teamAPlayers");

                // Lookup for Team B players
                LookupOperation lookupTeamB = LookupOperation.newLookup()
                                .from("players")
                                .localField("teamB")
                                .foreignField("_id")
                                .as("teamBPlayers");

                // Project fields to match MatchResponse
                ProjectionOperation project = project()
                                .and("id").as("id")
                                .and("date").as("date")
                                .and("type").as("type")
                                .and("scoreA").as("scoreA")
                                .and("scoreB").as("scoreB")
                                .and("notes").as("notes")
                                .and("venueId").as("venueId")
                                .and("courtNumber").as("courtNumber")
                                .and("userId").as("userId")
                                .and("groupId").as("groupId")
                                .and("teamAPlayers.name").as("teamANames")
                                .and("teamBPlayers.name").as("teamBNames");

                Aggregation aggregation = newAggregation(
                                sort(org.springframework.data.domain.Sort.Direction.DESC, "date"),
                                lookupTeamA,
                                lookupTeamB,
                                project);

                return mongoTemplate.aggregate(aggregation, Match.class, MatchResponse.class).getMappedResults();
        }
}
