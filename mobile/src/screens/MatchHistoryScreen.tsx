import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import { Match } from '../types';
import { matchesApi } from '../api';
import { useAuth } from '../context/AuthContext';

const MatchHistoryScreen: React.FC = () => {
    const { user } = useAuth();
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadMatches();
    }, []);

    const loadMatches = async () => {
        try {
            const data = await matchesApi.getAll();
            // Sort by date descending
            const sorted = (data || []).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setMatches(sorted);
        } catch (err) {
            console.error('Failed to load matches:', err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadMatches();
    }, []);

    const handleDelete = (id: string) => {
        Alert.alert('Delete Match', 'Are you sure you want to delete this match?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await matchesApi.delete(id);
                        setMatches(matches.filter(m => m.id !== id));
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete match');
                    }
                },
            },
        ]);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const renderMatch = ({ item }: { item: Match }) => {
        const teamANames = item.teamANames || item.teamA;
        const teamBNames = item.teamBNames || item.teamB;
        const aWon = item.scoreA > item.scoreB;

        return (
            <TouchableOpacity
                style={styles.matchCard}
                onLongPress={() => handleDelete(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.matchHeader}>
                    <Text style={styles.matchType}>{item.type}</Text>
                    <Text style={styles.matchDate}>{formatDate(item.date)}</Text>
                </View>

                <View style={styles.matchBody}>
                    <View style={[styles.teamContainer, aWon && styles.winnerContainer]}>
                        <Text style={[styles.teamNames, aWon && styles.winnerText]}>
                            {teamANames.join(' & ')}
                        </Text>
                        {aWon && <Text style={styles.winBadge}>W</Text>}
                    </View>

                    <View style={styles.scoreContainer}>
                        <Text style={[styles.score, aWon && styles.scoreWinner]}>{item.scoreA}</Text>
                        <Text style={styles.scoreSeparator}>-</Text>
                        <Text style={[styles.score, !aWon && styles.scoreWinner]}>{item.scoreB}</Text>
                    </View>

                    <View style={[styles.teamContainer, styles.teamRight, !aWon && styles.winnerContainer]}>
                        {!aWon && <Text style={styles.winBadge}>W</Text>}
                        <Text style={[styles.teamNames, styles.teamNamesRight, !aWon && styles.winnerText]}>
                            {teamBNames.join(' & ')}
                        </Text>
                    </View>
                </View>

                {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
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
                data={matches}
                renderItem={renderMatch}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.lime} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No matches yet</Text>
                        <Text style={styles.emptySubtext}>Record your first match to see it here</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgDark },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgDark },
    list: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    matchCard: {
        backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
        padding: Spacing.md, marginBottom: Spacing.sm,
        borderWidth: 1, borderColor: Colors.border,
    },
    matchHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    matchType: { fontSize: FontSize.xs, color: Colors.lime, fontWeight: '600', textTransform: 'uppercase' },
    matchDate: { fontSize: FontSize.xs, color: Colors.textMuted },
    matchBody: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    teamContainer: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    },
    teamRight: { justifyContent: 'flex-end' },
    winnerContainer: {},
    teamNames: { fontSize: FontSize.sm, color: Colors.textSecondary, flexShrink: 1 },
    teamNamesRight: { textAlign: 'right' },
    winnerText: { color: Colors.textPrimary, fontWeight: '700' },
    winBadge: {
        fontSize: FontSize.xs, color: Colors.lime, fontWeight: '700',
        backgroundColor: 'rgba(132, 204, 22, 0.15)',
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    scoreContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md },
    score: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textSecondary },
    scoreWinner: { color: Colors.lime },
    scoreSeparator: { fontSize: FontSize.lg, color: Colors.textMuted, marginHorizontal: Spacing.xs },
    notes: {
        marginTop: Spacing.sm, fontSize: FontSize.xs, color: Colors.textMuted,
        fontStyle: 'italic', borderTopWidth: 1, borderTopColor: Colors.border,
        paddingTop: Spacing.xs,
    },
    emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl * 2 },
    emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
    emptyText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
    emptySubtext: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
});

export default MatchHistoryScreen;
