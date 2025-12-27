import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  TextInput,
  Dimensions
} from 'react-native';
import { db, auth } from '@/src/config/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// --- ДОЧЕРНИЙ КОМПОНЕНТ ДЛЯ ИСТОРИИ СОЮЗОВ ---
const CompatibilityHistory = () => {
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
      console.error("Ошибка загрузки союзов:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPairs(); }, []);

  // Функция перехода на вкладку совместимости
  const handleOpenPair = (item: any) => {
    if (!item.dates || !item.pairNames) return;

    const dates = item.dates.split(' & ');
    const names = item.pairNames.split(' + ');

    router.push({
      pathname: '/(tabs)/compatibility',
      params: { 
        date1: dates[0]?.trim(), 
        date2: dates[1]?.trim(), 
        name1: names[0]?.trim(), 
        name2: names[1]?.trim() 
      }
    } as any);
  };

  const deletePair = (id: string) => {
    Alert.alert("Удаление", "Удалить этот союз из истории?", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "compatibility_history", id));
          setPairs(prev => prev.filter(p => p.id !== id));
      }}
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color="#FFB6C1" style={{marginTop: 50}} />;

  return (
    <FlatList
      data={pairs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleOpenPair(item)}>
          <View style={styles.cardInfo}>
            <Text style={styles.nameText}>{item.pairNames}</Text>
            <Text style={styles.subText}>{item.dates}</Text>
            <View style={styles.energyBadge}>
              <Text style={styles.energyText}>Энергия пары: {item.matrixData?.personal?.center || '?'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => deletePair(item.id)} style={{ padding: 5 }}>
            <Ionicons name="trash-outline" size={22} color="#FFB6C1" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>У вас пока нет сохраненных союзов</Text>}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

// --- ОСНОВНОЙ ЭКРАН ИСТОРИИ ---
export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<'personal' | 'partners'>('personal');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (activeTab === 'personal') fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "history"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setHistory(docs);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось загрузить историю");
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const name = (item.personName || "").toLowerCase();
    const date = (item.birthDate || "").toLowerCase();
    const search = searchQuery.toLowerCase();
    return name.includes(search) || date.includes(search);
  });

  const updatePersonName = async (id: string) => {
    try {
      const docRef = doc(db, "history", id);
      await updateDoc(docRef, { personName: tempName.trim() || "Без имени" });
      setHistory(prev => prev.map(item => item.id === id ? { ...item, personName: tempName.trim() } : item));
      setEditingId(null);
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось сохранить имя");
    }
  };

  const deleteItem = (id: string) => {
    Alert.alert("Удаление", "Вы уверены?", [
      { text: "Отмена" },
      { text: "Удалить", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "history", id));
          setHistory(prev => prev.filter(item => item.id !== id));
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={{ width: 24 }} />
        <Text style={styles.header}>История</Text>
        <TouchableOpacity onPress={activeTab === 'personal' ? fetchHistory : undefined}>
          <Ionicons name="refresh" size={24} color="#FFB6C1" />
        </TouchableOpacity>
      </View>

      {/* TABS SWITCHER */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'personal' && styles.tabActive]} 
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>Личное</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'partners' && styles.tabActive]} 
          onPress={() => setActiveTab('partners')}
        >
          <Text style={[styles.tabText, activeTab === 'partners' && styles.tabTextActive]}>Союзы</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'personal' ? (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#D0D0D0" style={{marginRight: 10}} />
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#D0D0D0"
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FFB6C1" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={filteredHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardInfo}>
                    {editingId === item.id ? (
                      <View style={styles.editRow}>
                        <TextInput style={styles.nameInput} value={tempName} onChangeText={setTempName} autoFocus />
                        <TouchableOpacity onPress={() => updatePersonName(item.id)}>
                          <Ionicons name="checkmark-circle" size={28} color="#FFB6C1" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => {
                          const [d, m, y] = item.birthDate.split('.');
                          router.push({ pathname: '/(tabs)/arcana-calculate', params: { date: `${y}-${m}-${d}`, personName: item.personName } } as any);
                        }} 
                        onLongPress={() => { setEditingId(item.id); setTempName(item.personName || ''); }}
                      >
                        <Text style={styles.nameText}>{item.personName || "Без имени"}</Text>
                        <Text style={styles.subText}>{item.birthDate} • Аркан: {item.matrixData?.personal?.center || '?'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => deleteItem(item.id)}><Ionicons name="trash-outline" size={22} color="#FFB6C1" /></TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Ничего не найдено</Text>}
            />
          )}
        </>
      ) : (
        <CompatibilityHistory />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 28, fontWeight: '300', color: '#333', textAlign: 'center', flex: 1 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#F9F9F9', borderRadius: 15, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  tabText: { fontSize: 14, color: '#AAA', fontWeight: '500' },
  tabTextActive: { color: '#FFB6C1' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 20 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 18, borderRadius: 25, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFF0F5' },
  cardInfo: { flex: 1 },
  nameText: { fontSize: 17, fontWeight: '600', color: '#333' },
  subText: { fontSize: 13, color: '#AAA', marginTop: 4 },
  nameInput: { fontSize: 17, borderBottomWidth: 1, borderBottomColor: '#FFB6C1', flex: 1, marginRight: 10 },
  editRow: { flexDirection: 'row', alignItems: 'center' },
  energyBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF5F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  energyText: { fontSize: 12, color: '#FFB6C1', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#D0D0D0' },
});