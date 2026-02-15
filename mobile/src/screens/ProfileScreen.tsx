import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
                {user?.picture ? (
                    <Image source={{ uri: user.picture }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
                <Text style={styles.name}>{user?.name || 'Unknown'}</Text>
                <Text style={styles.email}>{user?.email || ''}</Text>
                {user?.systemRole === 'ADMIN' && (
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                )}
            </View>

            {/* Info Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role</Text>
                    <Text style={styles.infoValue}>{user?.systemRole || 'USER'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Groups</Text>
                    <Text style={styles.infoValue}>
                        {user?.memberships ? Object.keys(user.memberships).length : 0}
                    </Text>
                </View>
            </View>

            {/* App Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Version</Text>
                    <Text style={styles.infoValue}>{APP_VERSION}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Platform</Text>
                    <Text style={styles.infoValue}>React Native (Expo)</Text>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgDark },
    content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    profileCard: {
        backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl,
        padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg,
        borderWidth: 1, borderColor: Colors.border,
    },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: Spacing.md },
    avatarPlaceholder: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.lime,
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    },
    avatarText: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.white },
    name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
    email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
    adminBadge: {
        marginTop: Spacing.sm, backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full,
    },
    adminBadgeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.warning },
    section: { marginBottom: Spacing.lg },
    sectionTitle: {
        fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary,
        marginBottom: Spacing.sm,
    },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
        padding: Spacing.md, marginBottom: Spacing.xs,
        borderWidth: 1, borderColor: Colors.border,
    },
    infoLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
    infoValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
    logoutButton: {
        backgroundColor: Colors.error, borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
    },
    logoutText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});

export default ProfileScreen;
