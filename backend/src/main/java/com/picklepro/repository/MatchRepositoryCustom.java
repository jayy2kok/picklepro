package com.picklepro.repository;

import com.picklepro.dto.MatchResponse;
import java.util.List;

public interface MatchRepositoryCustom {
    List<MatchResponse> findAllMatchesWithPlayerNames();
}
