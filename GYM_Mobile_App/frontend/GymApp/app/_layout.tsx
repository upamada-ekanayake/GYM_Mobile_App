import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

const DARK_BG = '#0D0D0D';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: DARK_BG },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen
          name="register"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="blackscreen"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="userregister"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="userpage"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="gympage"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="creategympost"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="coachpage"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="adminpage"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="gymzone"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="coaches"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="supplements"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="createsupplementpost"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="workouts"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="calorietracker"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="watertracker"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="reviews"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="usermanagement"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="gymmanagement"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="coachmanagement"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="adminmanagement"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="liveworkout"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
});
