import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { Alert, Linking } from 'react-native';

interface VersionInfo {
    version: string;
    apkUrl: string;
    releaseNotes?: string;
}

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const VERSION_URL = Constants.expoConfig?.extra?.versionCheckUrl ||
    'https://picklepro.duckdns.org/app-version.json';

const compareVersions = (current: string, latest: string): boolean => {
    const cur = current.split('.').map(Number);
    const lat = latest.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if ((lat[i] || 0) > (cur[i] || 0)) return true;
        if ((lat[i] || 0) < (cur[i] || 0)) return false;
    }
    return false;
};

export const useUpdateCheck = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

    useEffect(() => {
        checkForUpdate();
    }, []);

    const checkForUpdate = async () => {
        try {
            const response = await fetch(VERSION_URL, { cache: 'no-store' });
            if (!response.ok) return;

            const info: VersionInfo = await response.json();
            if (compareVersions(APP_VERSION, info.version)) {
                setUpdateAvailable(true);
                setVersionInfo(info);
                showUpdateAlert(info);
            }
        } catch (err) {
            // Silently fail — don't block the app if version check fails
            console.log('Version check failed:', err);
        }
    };

    const showUpdateAlert = (info: VersionInfo) => {
        Alert.alert(
            'Update Available',
            `A new version (${info.version}) of PicklePro is available.${info.releaseNotes ? `\n\n${info.releaseNotes}` : ''
            }`,
            [
                { text: 'Later', style: 'cancel' },
                {
                    text: 'Update Now',
                    onPress: () => {
                        if (info.apkUrl) {
                            Linking.openURL(info.apkUrl);
                        }
                    },
                },
            ]
        );
    };

    return { updateAvailable, versionInfo, checkForUpdate };
};
