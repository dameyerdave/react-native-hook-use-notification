import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import { Alert } from 'react-native'
import moment from 'moment'

const askForNotificationPermission = async () => {
  try {
    const settings = await Notifications.getPermissionsAsync()
    if (!settings.granted) {
      notificationPermissions = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true
        }
      })
      return notificationPermissions.ios.allowsAlert && notificationPermissions.ios.allowsDisplayInNotificationCenter
    }
    else {
      return settings.granted
    }
  } catch (err) {
    console.error(err)
    return false
  }
}

const notify = async (identifier = null, title = 'Notification', body = 'Hello', data = {}, trigger = null, sound = true, vibrate = true) => {
  if (!Array.isArray(trigger)) {
    trigger = [trigger]
  }
  for (let _trigger of trigger) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: identifier,
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
      console.error(err)
    }
  }
}

export const getScheduledNotifications = async () => {
  try {
    return Notifications.getAllScheduledNotificationsAsync()
  } catch (err) {
    console.error(err)
  }

}

export const clearScheduledNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch (err) {
    console.error(err)
  }
}

export const useNotification = (onNotification, handler = async () => ({
  shouldShowAlert: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
})) => {
  // const [permission, askForPermission] = Permissions.usePermissions(Permissions.NOTIFICATIONS, { ask: true });
  useEffect(() => {
    askForNotificationPermission()
      .then(granted => {
        if (granted) {
          //////////
          // This is only called if the app is in foreground same as the handler function in setNotificationHandler
          //////////
          // const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
          //   console.log('NotificationReceived', notification);
          // })
          // This is called 
          const notificationResponseReceivedListener = Notifications.addNotificationResponseReceivedListener(response => {
            // console.log('NotificationResponded', response);
            let data = response.notification.request.content.data
            delete data.experienceId
            onNotification(data, response.notification)
          })
          return () => {
            console.log('remove notification listeners')
            notificationReceivedListener.remove()
            notificationResponseReceivedListener.remove()
          }
        } else {
          Alert.alert('Notifications', 'Notifications are not allowed. Please allow notifications to make the app work properly.', [{
            text: "OK",
            style: "cancel",
          }])
        }
      }).catch((err) => {
        console.error(err)
      })
  }, [])


  Notifications.setNotificationHandler({
    handleNotification: handler,
    handleSuccess: (notificationId) => {
      console.log('handleSuccess', notificationId)
    },
    handleError: (notificationId, error) => {
      console.warn('handleError', notificationId, error)
    }
  })

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
                weekday: __dow != '*' ? Number(_dow) + 1 : undefined
              })
            }
          }
        }
      }
    }
  } else {
    console.error('Error in cron_definition of schedule ' + schedule.description + ' (' + schedule.cron_definition + ')')
  }
  return triggers
}