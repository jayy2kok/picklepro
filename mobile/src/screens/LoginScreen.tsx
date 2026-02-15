import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

const LoginScreen: React.FC = () => {
    const { login, isLoading } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Text style={styles.iconText}>⚡</Text>
                </View>

                <Text style={styles.title}>PicklePro Tracker</Text>
                <Text style={styles.subtitle}>
                    Master your game. Track every point. Analyze like a pro.
                </Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color={Colors.lime} style={styles.loader} />
                ) : (
                    <TouchableOpacity style={styles.loginButton} onPress={login} activeOpacity={0.8}>
                        <Image
                            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                            style={styles.googleIcon}
                        />
                        <Text style={styles.loginButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.disclaimer}>
                    Secure authentication powered by Google. By signing in, you agree to our Terms and Privacy Policy.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    card: {
        backgroundColor: Colors.bgCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.lime,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        shadowColor: Colors.lime,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    iconText: {
        fontSize: 40,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '800',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.sm,
        width: '100%',
        justifyContent: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: Spacing.sm,
    },
    loginButtonText: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textDark,
    },
    loader: {
        marginVertical: Spacing.lg,
    },
    disclaimer: {
        marginTop: Spacing.xl,
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 16,
    },
});

export default LoginScreen;
