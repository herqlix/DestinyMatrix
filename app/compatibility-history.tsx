import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '@/src/config/firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useRouter, useFocusEffect } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

export default function CompatibilityHistory() {
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<any[]>([]);
  const router = useRouter();

  const fetchPairs = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(collection(db, "compatibility_history"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPairs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchPairs(); }, []));

  const deletePair = async (id: string) => {
    try {
      await deleteDoc(doc(db, "compatibility_history", id));
      setPairs(prev => prev.filter(p => p.id !== id));
    } catch (e) { Alert.alert("Ошибка", "Не удалось удалить"); }
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity 
      style={styles.deleteBtn} 
      onPress={() => Alert.alert("Удаление", "Удалить этот союз?", [
        {text: "Отмена", style: "cancel"},
        {text: "Удалить", style: "destructive", onPress: () => deletePair(id)}
      ])}
    >
      <Ionicons name="trash" size={24} color="#FFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>История союзов</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <FlatList
        data={pairs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => {
                const [d1, d2] = item.dates.split(' & ');
                const [n1, n2] = item.pairNames.split(' + ');
                router.replace({
                  pathname: "/(tabs)/compatibility", 
                  params: { date1: d1, date2: d2, name1: n1, name2: n2, refresh: Date.now() }
                });
              }}
            >
              <View style={styles.cardInfo}>
                <View style={styles.iconCircle}><Ionicons name="heart" size={20} color="#FFB6C1" /></View>
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={styles.names} numberOfLines={1}>{item.pairNames}</Text>
                  <Text style={styles.dates}>{item.dates}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          </Swipeable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5F7', alignItems: 'center', justifyContent: 'center' },
  names: { fontSize: 14, fontWeight: '600' },
  dates: { fontSize: 11, color: '#AAA' },
  deleteBtn: { backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%' }
});