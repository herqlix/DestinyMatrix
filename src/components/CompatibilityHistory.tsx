import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { db, auth } from '@/src/config/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CompatibilityHistory() {
  const [pairs, setPairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPairs = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "compatibility_history"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPairs(docs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPairs();
  }, []);

  const deletePair = (id: string) => {
    Alert.alert("Удаление", "Удалить этот союз из истории?", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "compatibility_history", id));
          setPairs(prev => prev.filter(p => p.id !== id));
      }}
    ]);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.pairNames}>{item.pairNames}</Text>
        <Text style={styles.dates}>{item.dates}</Text>
        <Text style={styles.centerEnergy}>Энергия пары: {item.matrixData?.personal?.center}</Text>
      </View>
      <TouchableOpacity onPress={() => deletePair(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#FFB6C1" />
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#FFB6C1" style={{marginTop: 20}} />;

  return (
    <FlatList
      data={pairs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={<Text style={styles.emptyText}>У вас пока нет сохраненных союзов</Text>}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 25, 
    marginBottom: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF0F5'
  },
  cardInfo: { flex: 1 },
  pairNames: { fontSize: 16, fontWeight: '600', color: '#333' },
  dates: { fontSize: 12, color: '#AAA', marginTop: 4 },
  centerEnergy: { fontSize: 13, color: '#FFB6C1', marginTop: 6, fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#CCC' },
});