import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/src/config/firebase';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // onAuthStateChanged срабатывает при входе/выходе
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const firstSegment = segments[0] as string;
    const inTabsGroup = firstSegment === '(tabs)';
    const isLoginPage = firstSegment === 'login';
    const isIndexPage = firstSegment === 'index' || !firstSegment;

    // Проверяем актуальное состояние из Firebase, а не только из стейта
    // u?.emailVerified может быть устаревшим, поэтому мы опираемся на u
    const isVerified = user?.emailVerified;

    // 1. Если пользователя нет, а он пытается зайти в закрытую зону
    if (!user && inTabsGroup) {
      router.replace('/login');
    } 
    // 2. Если пользователь подтвержден и пытается зайти на логин — пускаем в приложение
    else if (user && isVerified && (isLoginPage || isIndexPage)) {
      router.replace('/(tabs)' as any);
    }
    // 3. Если пользователь в системе, но почта НЕ подтверждена, и он пытается зайти в табы
    // Мы отправляем его на логин, где он увидит наш Alert с кнопкой "Я подтвердил"
    else if (user && !isVerified && inTabsGroup) {
      router.replace('/login');
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#FFB6C1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}