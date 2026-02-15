import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Match, MatchType, Player, Venue, Group } from '../types';
import { playersApi, venuesApi, matchesApi, groupsApi } from '../api';

const NewMatchScreen: React.FC = () => {
    const { user } = useAuth();
    const [matchType, setMatchType] = useState<MatchType>('Doubles');
    const [players, setPlayers] = useState<Player[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Match form state
    const [teamA, setTeamA] = useState<string[]>([]);
    const [teamB, setTeamB] = useState<string[]>([]);
    const [scoreA, setScoreA] = useState('');
    const [scoreB, setScoreB] = useState('');
    const [selectedVenue, setSelectedVenue] = useState<string>('');
    const [courtNumber, setCourtNumber] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [p, v, g] = await Promise.all([
                playersApi.getAll(),
                venuesApi.getAll(),
                groupsApi.getAll(),
            ]);
            setPlayers(p || []);
            setVenues(v || []);
            setGroups(g || []);
            if (g && g.length > 0) setActiveGroupId(g[0].id);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const maxPlayers = matchType === 'Singles' ? 1 : 2;

    const togglePlayer = (playerId: string, team: 'A' | 'B') => {
        if (team === 'A') {
            if (teamA.includes(playerId)) {
                setTeamA(teamA.filter(id => id !== playerId));
            } else if (teamA.length < maxPlayers) {
                setTeamB(teamB.filter(id => id !== playerId));
                setTeamA([...teamA, playerId]);
            }
        } else {
            if (teamB.includes(playerId)) {
                setTeamB(teamB.filter(id => id !== playerId));
            } else if (teamB.length < maxPlayers) {
                setTeamA(teamA.filter(id => id !== playerId));
                setTeamB([...teamB, playerId]);
            }
        }
    };

    const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || 'Unknown';

    const handleSave = async () => {
        if (teamA.length !== maxPlayers || teamB.length !== maxPlayers) {
            Alert.alert('Error', `Select ${maxPlayers} player(s) per team`);
            return;
        }
        if (!scoreA || !scoreB) {
            Alert.alert('Error', 'Enter scores for both teams');
            return;
        }

        setIsSaving(true);
        try {
            await matchesApi.create({
                date: new Date().toISOString().split('T')[0],
                type: matchType,
                teamA,
                teamB,
                scoreA: parseInt(scoreA),
                scoreB: parseInt(scoreB),
                venueId: selectedVenue || undefined,
                courtNumber: courtNumber ? parseInt(courtNumber) : undefined,
                notes: notes || undefined,
                groupId: activeGroupId || undefined,
            });
            Alert.alert('Success', 'Match saved!');
            // Reset form
            setTeamA([]);
            setTeamB([]);
            setScoreA('');
            setScoreB('');
            setNotes('');
            setCourtNumber('');
        } catch (err) {
            Alert.alert('Error', 'Failed to save match');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.lime} />
            </View>
        );
    }

    const availablePlayers = players.filter(
        p => activeGroupId && p.memberships && p.memberships[activeGroupId]
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Match Type Toggle */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Match Type</Text>
                <View style={styles.toggleRow}>
                    {(['Singles', 'Doubles'] as MatchType[]).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.toggleButton, matchType === type && styles.toggleActive]}
                            onPress={() => {
                                setMatchType(type);
                                setTeamA([]);
                                setTeamB([]);
                            }}
                        >
                            <Text style={[styles.toggleText, matchType === type && styles.toggleTextActive]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Team Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Team A {teamA.length}/{maxPlayers}
                </Text>
                <View style={styles.playerGrid}>
                    {availablePlayers.map(player => {
                        const inA = teamA.includes(player.id);
                        const inB = teamB.includes(player.id);
                        return (
                            <TouchableOpacity
                                key={player.id}
                                style={[styles.playerChip, inA && styles.playerChipA, inB && styles.playerChipInactive]}
                                onPress={() => togglePlayer(player.id, 'A')}
                            >
                                <Text style={[styles.playerChipText, inA && styles.playerChipTextActive]}>
                                    {player.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Team B {teamB.length}/{maxPlayers}
                </Text>
                <View style={styles.playerGrid}>
                    {availablePlayers.map(player => {
                        const inA = teamA.includes(player.id);
                        const inB = teamB.includes(player.id);
                        return (
                            <TouchableOpacity
                                key={player.id}
                                style={[styles.playerChip, inB && styles.playerChipB, inA && styles.playerChipInactive]}
                                onPress={() => togglePlayer(player.id, 'B')}
                            >
                                <Text style={[styles.playerChipText, inB && styles.playerChipTextActive]}>
                                    {player.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Scores */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Score</Text>
                <View style={styles.scoreRow}>
                    <View style={styles.scoreInputContainer}>
                        <Text style={styles.scoreLabel}>
                            {teamA.map(id => getPlayerName(id)).join(' & ') || 'Team A'}
                        </Text>
                        <TextInput
                            style={styles.scoreInput}
                            value={scoreA}
                            onChangeText={setScoreA}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>
                    <Text style={styles.vs}>VS</Text>
                    <View style={styles.scoreInputContainer}>
                        <Text style={styles.scoreLabel}>
                            {teamB.map(id => getPlayerName(id)).join(' & ') || 'Team B'}
                        </Text>
                        <TextInput
                            style={styles.scoreInput}
                            value={scoreB}
                            onChangeText={setScoreB}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor={Colors.textMuted}
                        />
                    </View>
                </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes (optional)</Text>
                <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add match notes..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
            >
                {isSaving ? (
                    <ActivityIndicator color={Colors.white} />
                ) : (
                    <Text style={styles.saveButtonText}>Save Match</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgDark },
    content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgDark },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
    toggleRow: { flexDirection: 'row', gap: Spacing.sm },
    toggleButton: {
        flex: 1, paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard,
        alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    },
    toggleActive: { backgroundColor: Colors.lime, borderColor: Colors.lime },
    toggleText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
    toggleTextActive: { color: Colors.white },
    playerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    playerChip: {
        paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full, backgroundColor: Colors.bgCard,
        borderWidth: 1, borderColor: Colors.border,
    },
    playerChipA: { backgroundColor: Colors.lime, borderColor: Colors.lime },
    playerChipB: { backgroundColor: Colors.info, borderColor: Colors.info },
    playerChipInactive: { opacity: 0.4 },
    playerChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    playerChipTextActive: { color: Colors.white, fontWeight: '600' },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    scoreInputContainer: { flex: 1, alignItems: 'center' },
    scoreLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, textAlign: 'center' },
    scoreInput: {
        width: '100%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
        padding: Spacing.md, fontSize: FontSize.xxl, fontWeight: '700',
        color: Colors.textPrimary, textAlign: 'center',
        borderWidth: 1, borderColor: Colors.border,
    },
    vs: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textMuted },
    notesInput: {
        backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
        padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
        borderWidth: 1, borderColor: Colors.border, minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: Colors.lime, borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
        shadowColor: Colors.lime, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});

export default NewMatchScreen;
