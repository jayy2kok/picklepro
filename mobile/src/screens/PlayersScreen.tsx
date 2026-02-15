import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import { Player, Role } from '../types';
import { playersApi, groupsApi } from '../api';
import { useAuth } from '../context/AuthContext';

const PlayersScreen: React.FC = () => {
    const { user } = useAuth();
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newContact, setNewContact] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [p, g] = await Promise.all([playersApi.getAll(), groupsApi.getAll()]);
            setPlayers(p || []);
            if (g && g.length > 0) setActiveGroupId(g[0].id);
        } catch (err) {
            console.error('Failed to load players:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    const handleAddPlayer = async () => {
        if (!newName.trim()) {
            Alert.alert('Error', 'Player name is required');
            return;
        }

        setIsSaving(true);
        try {
            const player = await playersApi.create(
                { name: newName.trim(), email: newEmail.trim() || undefined, contactNumber: newContact.trim() || undefined },
                activeGroupId || undefined,
                'VIEWER' as Role
            );
            setPlayers([...players, player]);
            setShowAddModal(false);
            setNewName('');
            setNewEmail('');
            setNewContact('');
        } catch (err) {
            Alert.alert('Error', 'Failed to add player');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeletePlayer = (player: Player) => {
        Alert.alert('Remove Player', `Remove ${player.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await playersApi.delete(player.id);
                        setPlayers(players.filter(p => p.id !== player.id));
                    } catch (err) {
                        Alert.alert('Error', 'Failed to remove player');
                    }
                },
            },
        ]);
    };

    const getRoleBadge = (player: Player) => {
        if (!activeGroupId || !player.memberships) return null;
        const role = player.memberships[activeGroupId];
        if (role === 'GROUP_ADMIN') return { text: 'Admin', color: Colors.warning };
        return null;
    };

    const renderPlayer = ({ item }: { item: Player }) => {
        const badge = getRoleBadge(item);
        return (
            <TouchableOpacity
                style={styles.playerCard}
                onLongPress={() => handleDeletePlayer(item)}
                activeOpacity={0.7}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.playerInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.playerName}>{item.name}</Text>
                        {badge && (
                            <View style={[styles.roleBadge, { backgroundColor: `${badge.color}20` }]}>
                                <Text style={[styles.roleBadgeText, { color: badge.color }]}>{badge.text}</Text>
                            </View>
                        )}
                    </View>
                    {item.email && <Text style={styles.playerEmail}>{item.email}</Text>}
                    {item.rating !== undefined && item.rating !== null && (
                        <Text style={styles.playerRating}>Rating: {item.rating}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.lime} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={players}
                renderItem={renderPlayer}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.lime} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyText}>No players yet</Text>
                        <Text style={styles.emptySubtext}>Tap + to add your first player</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Add Player Modal */}
            <Modal visible={showAddModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Player</Text>

                        <TextInput
                            style={styles.input}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Player name *"
                            placeholderTextColor={Colors.textMuted}
                        />
                        <TextInput
                            style={styles.input}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="Email (optional)"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            value={newContact}
                            onChangeText={setNewContact}
                            placeholder="Contact number (optional)"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="phone-pad"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.addButton, isSaving && styles.addButtonDisabled]}
                                onPress={handleAddPlayer}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color={Colors.white} size="small" />
                                ) : (
                                    <Text style={styles.addButtonText}>Add</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgDark },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgDark },
    list: { padding: Spacing.md, paddingBottom: 100 },
    playerCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard,
        borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: Colors.border,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.lime,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
    playerInfo: { flex: 1, marginLeft: Spacing.md },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    playerName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
    playerEmail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    playerRating: { fontSize: FontSize.xs, color: Colors.lime, marginTop: 2 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    roleBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
    fab: {
        position: 'absolute', bottom: Spacing.lg, right: Spacing.lg,
        width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.lime,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: Colors.lime, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
    },
    fabText: { fontSize: 28, fontWeight: '600', color: Colors.white, marginTop: -2 },
    modalOverlay: {
        flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
    input: {
        backgroundColor: Colors.bgDark, borderRadius: BorderRadius.md,
        padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
        marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
    },
    modalButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    cancelButton: {
        flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
    },
    cancelButtonText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
    addButton: {
        flex: 1, backgroundColor: Colors.lime, paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md, alignItems: 'center',
    },
    addButtonDisabled: { opacity: 0.6 },
    addButtonText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
    emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl * 2 },
    emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
    emptyText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
    emptySubtext: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
});

export default PlayersScreen;
