package com.picklepro.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Map;
import java.util.HashMap;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "players")
public class Player {

    @Id
    private String id;

    @NotBlank(message = "Player name is required")
    private String name;

    @Indexed(unique = true, sparse = true)
    private String email;

    private String contactNumber;

    private Map<String, String> socialMedia;

    @CreatedDate
    private Instant joinedDate;

    @Indexed
    private String userId;

    @Builder.Default
    private Double rating = 1200.0;

    @Builder.Default
    private User.SystemRole systemRole = User.SystemRole.USER;

    @Builder.Default
    private Map<String, Role> memberships = new HashMap<>();
}
