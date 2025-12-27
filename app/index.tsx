import { Redirect } from 'expo-router';
import { auth } from '@/src/config/firebase';

export default function Index() {
  // Если пользователь авторизован — отправляем в табы
  if (auth.currentUser) {
    // Используем as any, чтобы TS не ругался на "несуществующий" путь
    return <Redirect href={"/(tabs)" as any} />;
  }
  
  // Если нет — на логин
  return <Redirect href="/login" />;
}