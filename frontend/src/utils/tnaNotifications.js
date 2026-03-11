import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { addDays, isBefore, startOfDay } from 'date-fns';

const isExpoGoAndroid =
    Platform.OS === 'android' && Constants.executionEnvironment === 'storeClient';

let notificationHandlerConfigured = false;

const getNotificationsModule = async () => {
    if (isExpoGoAndroid) {
        return null;
    }

    const Notifications = require('expo-notifications');

    if (!notificationHandlerConfigured) {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
        notificationHandlerConfigured = true;
    }

    return Notifications;
};

export const areTNANotificationsSupported = () => !isExpoGoAndroid;

export const getTNANotificationSupportMessage = () => {
    if (!isExpoGoAndroid) {
        return null;
    }

    return 'TNA reminders are disabled in Expo Go on Android. Use a development build or installed APK to test notifications.';
};

export const requestNotificationPermissions = async () => {
    try {
        const Notifications = await getNotificationsModule();
        if (!Notifications) {
            return false;
        }

        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
};

const buildNotificationId = (tnaId, milestoneId, type) =>
    `tna_${tnaId}_${milestoneId}_${type}`;

export const scheduleTNANotifications = async (tna) => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
        return { scheduled: false, supported: false };
    }

    // Cancel all existing notifications for this TNA first
    await cancelTNANotifications(tna.id, tna.milestones);

    const now = new Date();

    for (const milestone of tna.milestones) {
        // Skip completed milestones
        if (milestone.completedAt) continue;

        const dueDate = startOfDay(new Date(milestone.dueDate));

        // 3 days before due date
        const threeDaysBefore = addDays(dueDate, -3);
        if (isBefore(now, threeDaysBefore)) {
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Milestone Due Soon',
                        body: `⚠️ ${milestone.name} for ${tna.orderNo} is due in 3 days`,
                        data: { tnaId: tna.id, milestoneId: milestone.id },
                    },
                    trigger: { date: threeDaysBefore },
                    identifier: buildNotificationId(tna.id, milestone.id, '3day'),
                });
            } catch (e) {
                // Silently skip if trigger date is in the past
            }
        }

        // On due date
        if (isBefore(now, dueDate)) {
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Milestone Due Today',
                        body: `📅 ${milestone.name} for ${tna.orderNo} is due TODAY`,
                        data: { tnaId: tna.id, milestoneId: milestone.id },
                    },
                    trigger: { date: dueDate },
                    identifier: buildNotificationId(tna.id, milestone.id, 'due'),
                });
            } catch (e) {
                // Silently skip
            }
        }

        // 1 day after due date (overdue)
        const oneDayAfter = addDays(dueDate, 1);
        if (isBefore(now, oneDayAfter)) {
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Milestone Overdue',
                        body: `🔴 ${milestone.name} for ${tna.orderNo} is OVERDUE`,
                        data: { tnaId: tna.id, milestoneId: milestone.id },
                    },
                    trigger: { date: oneDayAfter },
                    identifier: buildNotificationId(tna.id, milestone.id, 'overdue'),
                });
            } catch (e) {
                // Silently skip
            }
        }
    }

    return { scheduled: true, supported: true };
};

export const cancelTNANotifications = async (tnaId, milestones) => {
    const Notifications = await getNotificationsModule();
    if (!Notifications || !milestones) return;

    const types = ['3day', 'due', 'overdue'];
    for (const milestone of milestones) {
        for (const type of types) {
            try {
                await Notifications.cancelScheduledNotificationAsync(
                    buildNotificationId(tnaId, milestone.id, type)
                );
            } catch (e) {
                // Notification may not exist, ignore
            }
        }
    }
};

export const cancelMilestoneNotifications = async (tnaId, milestoneId) => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    const types = ['3day', 'due', 'overdue'];
    for (const type of types) {
        try {
            await Notifications.cancelScheduledNotificationAsync(
                buildNotificationId(tnaId, milestoneId, type)
            );
        } catch (e) {
            // Ignore
        }
    }
};
