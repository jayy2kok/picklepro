package com.picklepro.dto;

import com.picklepro.model.Match.MatchType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class MatchResponse {
    private String id;
    private Instant date;
    private MatchType type;
    private List<String> teamANames;
    private List<String> teamBNames;
    private int scoreA;
    private int scoreB;
    private String notes;
    private String venueId;
    private Integer courtNumber;
    private String userId;
    private String groupId;
}
