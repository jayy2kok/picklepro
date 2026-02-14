package com.picklepro.controller;

import com.picklepro.model.Group;
import com.picklepro.model.Role;
import com.picklepro.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<List<Group>> getGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        Group created = groupService.createGroup(group);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{groupId}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> addMember(@PathVariable String groupId,
            @PathVariable String userId,
            @RequestParam Role role) {
        groupService.addMember(groupId, userId, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeMember(@PathVariable String groupId,
            @PathVariable String userId) {
        groupService.removeMember(groupId, userId);
        return ResponseEntity.noContent().build();
    }
}
