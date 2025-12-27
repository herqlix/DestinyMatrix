import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}> 
      <Tabs screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#FFB6C1', 
        tabBarInactiveTintColor: '#C0C0C0',
        tabBarStyle: { 
          backgroundColor: '#fff', 
          borderTopWidth: 1, 
          borderTopColor: '#F5F5F5',
          height: 60,
          paddingBottom: 8
        }
      }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Главная',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />

        {/* Скрываем этот экран из таб-бара, так как он теперь дублирует index */}
        <Tabs.Screen
          name="arcana-calculate"
          options={{
            href: null, // Это свойство полностью убирает кнопку из нижнего меню
          }}
        />

        <Tabs.Screen
          name="compatibility"
          options={{
            title: 'Совместимость',
            tabBarIcon: ({ color }) => (
              <Ionicons name="heart-half-outline" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: 'История',
            tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Профиль',
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}