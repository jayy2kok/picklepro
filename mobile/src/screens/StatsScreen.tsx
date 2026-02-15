import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import { Match, Player, PlayerStats } from '../types';
import { matchesApi, playersApi } from '../api';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const StatsScreen: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<PlayerStats[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [m, p] = await Promise.all([matchesApi.getAll(), playersApi.getAll()]);
            setMatches(m || []);
            setPlayers(p || []);
            calculateStats(m || [], p || []);
        } catch (err) {
            console.error('Failed to load stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (matchList: Match[], playerList: Player[]) => {
        const playerMap = new Map<string, PlayerStats>();

        playerList.forEach(p => {
            playerMap.set(p.id, {
                name: p.name,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                winRate: 0,
                avgPointsFor: 0,
                avgPointsAgainst: 0,
            });
        });

        matchList.forEach(match => {
            const aWon = match.scoreA > match.scoreB;

            match.teamA.forEach(id => {
                const s = playerMap.get(id);
                if (s) {
                    s.matchesPlayed++;
                    if (aWon) s.wins++;
                    else s.losses++;
                    s.avgPointsFor += match.scoreA;
                    s.avgPointsAgainst += match.scoreB;
                }
            });

            match.teamB.forEach(id => {
                const s = playerMap.get(id);
                if (s) {
                    s.matchesPlayed++;
                    if (!aWon) s.wins++;
                    else s.losses++;
                    s.avgPointsFor += match.scoreB;
                    s.avgPointsAgainst += match.scoreA;
                }
            });
        });

        const result = Array.from(playerMap.values())
            .filter(s => s.matchesPlayed > 0)
            .map(s => ({
                ...s,
                winRate: Math.round((s.wins / s.matchesPlayed) * 100),
                avgPointsFor: Math.round((s.avgPointsFor / s.matchesPlayed) * 10) / 10,
                avgPointsAgainst: Math.round((s.avgPointsAgainst / s.matchesPlayed) * 10) / 10,
            }))
            .sort((a, b) => b.winRate - a.winRate);

        setStats(result);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.lime} />
            </View>
        );
    }

    const topPlayers = stats.slice(0, 6);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{matches.length}</Text>
                    <Text style={styles.summaryLabel}>Matches</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{stats.length}</Text>
                    <Text style={styles.summaryLabel}>Active Players</Text>
                </View>
            </View>

            {/* Win Rate Chart */}
            {topPlayers.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Win Rate (%)</Text>
                    <View style={styles.chartContainer}>
                        <BarChart
                            data={{
                                labels: topPlayers.map(p => p.name.split(' ')[0]),
                                datasets: [{ data: topPlayers.map(p => p.winRate) }],
                            }}
                            width={screenWidth - Spacing.md * 4}
                            height={200}
                            yAxisSuffix="%"
                            yAxisLabel=""
                            chartConfig={{
                                backgroundColor: Colors.bgCard,
                                backgroundGradientFrom: Colors.bgCard,
                                backgroundGradientTo: Colors.bgCard,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(132, 204, 22, ${opacity})`,
                                labelColor: () => Colors.textSecondary,
                                barPercentage: 0.6,
                            }}
                            style={styles.chart}
                        />
                    </View>
                </View>
            )}

            {/* Leaderboard */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Leaderboard</Text>
                {stats.map((player, index) => (
                    <View key={player.name} style={styles.leaderRow}>
                        <View style={styles.leaderRank}>
                            <Text style={[styles.rankText, index < 3 && styles.rankTop3]}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </Text>
                        </View>
                        <View style={styles.leaderInfo}>
                            <Text style={styles.leaderName}>{player.name}</Text>
                            <Text style={styles.leaderSubtext}>
                                {player.matchesPlayed} matches · {player.wins}W / {player.losses}L
                            </Text>
                        </View>
                        <View style={styles.leaderWinRate}>
                            <Text style={styles.winRateText}>{player.winRate}%</Text>
                            <View style={styles.winRateBar}>
                                <View style={[styles.winRateFill, { width: `${player.winRate}%` }]} />
                            </View>
                        </View>
                    </View>
                ))}

                {stats.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No stats yet</Text>
                        <Text style={styles.emptySubtext}>Play some matches to see stats</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgDark },
    content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgDark },
    summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    summaryCard: {
        flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
        padding: Spacing.lg, alignItems: 'center',
        borderWidth: 1, borderColor: Colors.border,
    },
    summaryValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.lime },
    summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
    chartContainer: {
        backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
        padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
        alignItems: 'center',
    },
    chart: { borderRadius: BorderRadius.md },
    leaderRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard,
        borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs,
        borderWidth: 1, borderColor: Colors.border,
    },
    leaderRank: { width: 36, alignItems: 'center' },
    rankText: { fontSize: FontSize.md, color: Colors.textMuted },
    rankTop3: { fontSize: FontSize.lg },
    leaderInfo: { flex: 1, marginLeft: Spacing.sm },
    leaderName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
    leaderSubtext: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    leaderWinRate: { alignItems: 'flex-end', width: 60 },
    winRateText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.lime },
    winRateBar: {
        width: 60, height: 4, backgroundColor: Colors.border,
        borderRadius: 2, marginTop: 4, overflow: 'hidden',
    },
    winRateFill: { height: '100%', backgroundColor: Colors.lime, borderRadius: 2 },
    emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl },
    emptyText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
    emptySubtext: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
});

export default StatsScreen;
