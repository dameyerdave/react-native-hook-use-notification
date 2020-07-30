import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNotification, getScheduledNotifications, clearScheduledNotifications, cronTrigger, dailyTrigger, intervalTrigger } from './src/index'

export default function App() {
  const notify = useNotification((notification) => {
    console.log('onNotification', notification)
  })

  clearScheduledNotifications().then(() => {
    notify('mytitle', 'mybody', { myIntput: 'myData' }, cronTrigger('* * * * *')).then(() => {
      getScheduledNotifications().then((notifications) => {
        console.log('notifications', notifications)
      })
    })
  })

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
