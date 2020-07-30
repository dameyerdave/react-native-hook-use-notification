import { useEffect } from 'react'
import * as Permissions from 'expo-permissions';
import * as Notifications from 'expo-notifications'
import { Alert } from 'react-native'
import moment from 'moment'

const askForNotificationPermission = async () => {
    const { status, permissions } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    return (status === 'granted')
}

const notify = async (title = 'Notification', body = 'Hello', data = {}, trigger = null, sound = true, vibrate = true) => {
    if (!Array.isArray(trigger)) {
        trigger = [trigger]
    }
    for (let _trigger of trigger) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: title,
                    body: body,
                    data: data,
                    sound: sound,
                    vibrate: vibrate,
                    // attachments: [
                    //     {
                    //         // identifier: new Date().getTime().toString(),
                    //         url: 'http://www.clipartbest.com/cliparts/ncB/Mrp/ncBMrpy7i.jpg',
                    //         // type: 'Image'
                    //         // typeHint: 'Image',
                    //         hideThumbnail: false,
                    //         // thumbnailClipArea: { x: 0, y: 0, width: 10, height: 10 }
                    //     }
                    // ]
                },
                trigger: _trigger,
            })
        } catch (err) {
            console.log(err)
        }
    }
}

export const getScheduledNotifications = async () => {
    try {
        return Notifications.getAllScheduledNotificationsAsync()
    } catch (err) {
        console.log(err)
    }

}

export const clearScheduledNotifications = async () => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync()
    } catch (err) {
        console.log(err)
    }
}

export const useNotification = (onNotification, options = { alert: true, sound: true, badge: false }) => {
    useEffect(() => {
        askForNotificationPermission()
            .then((granted) => {
                if (granted) {
                    const subscription = Notifications.addNotificationResponseReceivedListener((notification) => {
                        let data = notification.notification.request.content.data
                        delete data.experienceId
                        onNotification(data)
                    })
                    return () => subscription.remove();
                } else {
                    Alert('Notifications', 'Notifications are not allowed. Please allow notifications to make the app work properly.', [{
                        text: "OK",
                        style: "cancel",
                    },])
                }
            }).catch((err) => {
                console.log(err)
            });
    }, []);

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: options.alert,
            shouldPlaySound: options.sound,
            shouldSetBadge: options.badge,
        }),
    });

    return notify
}

// Triggers

export const intervalTrigger = (seconds, repeats = true) => {
    return {
        repeats: repeats,
        seconds: seconds
    }
}

export const dailyTrigger = (hour, minute) => {
    return {
        repeats: true,
        hour: hour,
        minute: minute
    }
}

export const cronTrigger = (cron) => {
    const now = moment().milliseconds(0)

    let triggers = []
    const cron_parts = cron.split(' ')
    if (cron_parts.length === 5) {
        let [__minute, __hour, __dom, __month, __dow] = cron_parts

        const minute = __minute == '*' ? now.minute().toString() : __minute
        const hour = __hour == '*' ? now.hour().toString() : __hour
        const dom = __dom == '*' ? now.date().toString() : __dom
        const month = __month == '*' ? now.month().toString() : __month.split(',').map(m => m - 1).join(',')
        const dow = __dow 

        for (let _minute of minute.split(',')) {
            for (let _hour of hour.split(',')) {
                for (let _dom of dom.split(',')) {
                    for (let _month of month.split(',')) {
                        for (let _dow of dow.split(',')) {
                            const runtime = moment(now).minute(_minute).hour(_hour).date(_dom).month(_month)
                            triggers.push({
                                repeats: true,
                                second: 0,
                                minute: __minute != '*' ? runtime.minute() : undefined,
                                hour: __hour != '*' ? runtime.hour() : undefined,
                                day: __dom != '*' ? runtime.date() : undefined,
                                month: __month != '*' ? runtime.month() : undefined,
                                weekday: __dow != '*' ? runtime.day() : undefined
                            })
                        }
                    }
                }
            }
        }
    } else {
        console.log('Error in cron_definition of schedule ' + schedule.description + ' (' + schedule.cron_definition + ')')
    }
    return triggers
}