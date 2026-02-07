package com.picklepro.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "matches")
public class Match {

    @Id
    private String id;

    @NotNull(message = "Match date is required")
    private Instant date;

    @NotNull(message = "Match type is required")
    private MatchType type;

    @NotNull(message = "Team A is required")
    private List<String> teamA;

    @NotNull(message = "Team B is required")
    private List<String> teamB;

    @Min(value = 0, message = "Score must be non-negative")
    private int scoreA;

    @Min(value = 0, message = "Score must be non-negative")
    private int scoreB;

    private String location;

    private String notes;

    @Indexed
    private String userId;

    public enum MatchType {
        Singles, Doubles
    }
}
