import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, FontSize } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import NewMatchScreen from '../screens/NewMatchScreen';
import MatchHistoryScreen from '../screens/MatchHistoryScreen';
import StatsScreen from '../screens/StatsScreen';
import PlayersScreen from '../screens/PlayersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const DarkTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: Colors.bgDark,
        card: Colors.bgCard,
        text: Colors.textPrimary,
        border: Colors.border,
        primary: Colors.lime,
    },
};

const TabIcon: React.FC<{ label: string; focused: boolean }> = ({ label, focused }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{label}</Text>
);

const AppNavigator: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.lime} />
            </View>
        );
    }

    if (!user) {
        return (
            <NavigationContainer theme={DarkTheme}>
                <LoginScreen />
            </NavigationContainer>
        );
    }

    return (
        <NavigationContainer theme={DarkTheme}>
            <Tab.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: Colors.bgCard },
                    headerTintColor: Colors.textPrimary,
                    headerTitleStyle: { fontWeight: '700' },
                    tabBarStyle: {
                        backgroundColor: Colors.bgCard,
                        borderTopColor: Colors.border,
                        height: 60,
                        paddingBottom: 8,
                    },
                    tabBarActiveTintColor: Colors.lime,
                    tabBarInactiveTintColor: Colors.textMuted,
                    tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600' },
                }}
            >
                <Tab.Screen
                    name="Match"
                    component={NewMatchScreen}
                    options={{
                        title: 'New Match',
                        headerTitle: '🏸 New Match',
                        tabBarIcon: ({ focused }) => <TabIcon label="🏸" focused={focused} />,
                    }}
                />
                <Tab.Screen
                    name="History"
                    component={MatchHistoryScreen}
                    options={{
                        title: 'History',
                        headerTitle: '📋 Match History',
                        tabBarIcon: ({ focused }) => <TabIcon label="📋" focused={focused} />,
                    }}
                />
                <Tab.Screen
                    name="Stats"
                    component={StatsScreen}
                    options={{
                        title: 'Stats',
                        headerTitle: '📊 Stats',
                        tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />,
                    }}
                />
                <Tab.Screen
                    name="Players"
                    component={PlayersScreen}
                    options={{
                        title: 'Players',
                        headerTitle: '👥 Players',
                        tabBarIcon: ({ focused }) => <TabIcon label="👥" focused={focused} />,
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={ProfileScreen}
                    options={{
                        title: 'Settings',
                        headerTitle: '⚙️ Settings',
                        tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.bgDark,
    },
});

export default AppNavigator;
