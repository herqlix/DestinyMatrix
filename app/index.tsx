import { Redirect } from 'expo-router';
import { auth } from '@/src/config/firebase';

export default function Index() {
  if (auth.currentUser) {
    return <Redirect href={"/(tabs)" as any} />;
  }
  
  return <Redirect href="/login" />;
}