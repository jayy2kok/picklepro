package com.picklepro.service;

import com.picklepro.model.Group;
import com.picklepro.model.Role;
import com.picklepro.model.User;
import com.picklepro.repository.GroupRepository;
import com.picklepro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public List<Group> getAllGroups() {
        return groupRepository.findAll();
    }

    public Group createGroup(Group group) {
        group.setId(UUID.randomUUID().toString());
        return groupRepository.save(group);
    }

    @Transactional
    public void addMember(String groupId, String userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (role == Role.GROUP_ADMIN && (user.getEmail() == null || user.getEmail().isBlank())) {
            throw new RuntimeException("Group Admin must have a valid email address");
        }

        user.getMemberships().put(groupId, role);
        userRepository.save(user);
    }

    @Transactional
    public void removeMember(String groupId, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.getMemberships().remove(groupId);
        userRepository.save(user);
    }
}
