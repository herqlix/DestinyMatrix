import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList,
  Dimensions, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView,
  Platform, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router'; 
import { calculateCompatibility } from '@/src/utils/CompatibilityCalculation';
import MatrixGraphic from '@/src/components/MatrixGraphic';
import { db, auth } from '@/src/config/firebase';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

interface HistoryItem {
  id: string;
  personName: string;
  birthDate: string;
}

export default function CompatibilityScreen() {
  const params = useLocalSearchParams(); 
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [isManualModalVisible, setManualModalVisible] = useState(false);
  
  const [manualDate, setManualDate] = useState('');
  const [manualName, setManualName] = useState('');

  const [partner1, setPartner1] = useState<HistoryItem | null>(null);
  const [partner2, setPartner2] = useState<HistoryItem | null>(null);
  const [selectingFor, setSelectingFor] = useState<1 | 2>(1);
  const [result, setResult] = useState<any>(null);

  // Сброс состояния
  const handleReset = () => {
    setPartner1(null);
    setPartner2(null);
    setResult(null);
    setIsSaved(false);
  };

  // Проверка на дубликаты в истории
  const checkIfSaved = async (d1?: string, d2?: string) => {
    const user = auth.currentUser;
    const dateA = d1 || partner1?.birthDate;
    const dateB = d2 || partner2?.birthDate;
    if (!user || !dateA || !dateB) { setIsSaved(false); return; }
    const pairId = [dateA, dateB].sort().join('_');
    try {
      const q = query(collection(db, "compatibility_history"), where("userId", "==", user.uid), where("pairId", "==", pairId));
      const snap = await getDocs(q);
      setIsSaved(!snap.empty);
    } catch (e) { console.error(e); }
  };

  // Обработка входящих параметров (если переход из истории)
  useEffect(() => {
    if (params.date1 && params.date2) {
      const d1 = String(params.date1);
      const d2 = String(params.date2);
      setPartner1({ id: 'temp-1', personName: (params.name1 as string) || 'Гость', birthDate: d1 });
      setPartner2({ id: 'temp-2', personName: (params.name2 as string) || 'Гость', birthDate: d2 });
      const formatToIso = (dateStr: string) => dateStr.split('.').reverse().join('-');
      try {
        const res = calculateCompatibility(formatToIso(d1), formatToIso(d2));
        setResult(res);
        checkIfSaved(d1, d2);
      } catch (e) { console.error(e); }
    }
  }, [params.date1, params.date2]);

  const fetchHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "history"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })) as HistoryItem[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openPicker = (slot: 1 | 2) => {
    setSelectingFor(slot);
    setModalVisible(true);
    fetchHistory();
  };

  const selectUser = (item: HistoryItem) => {
    if (selectingFor === 1) setPartner1(item);
    else setPartner2(item);
    setModalVisible(false);
    setResult(null); 
    setIsSaved(false);
  };

  const handleManualSubmit = () => {
    if (manualDate.length === 10) {
      const newItem = { id: 'man-'+Date.now(), personName: manualName.trim() || 'Гость', birthDate: manualDate };
      selectUser(newItem);
      setManualModalVisible(false);
    } else { Alert.alert("Ошибка", "Введите дату полностью"); }
  };

  const handleCalculate = () => {
    if (partner1?.birthDate && partner2?.birthDate) {
      const formatToIso = (s: string) => s.split('.').reverse().join('-');
      const res = calculateCompatibility(formatToIso(partner1.birthDate), formatToIso(partner2.birthDate));
      setResult(res);
      checkIfSaved();
    } else {
      Alert.alert("Внимание", "Выберите обоих партнеров");
    }
  };

  const toggleSaveCompatibility = async () => {
    const user = auth.currentUser;
    if (!user || !result || !partner1 || !partner2) return;
    setSaveLoading(true);
    const pairId = [partner1.birthDate, partner2.birthDate].sort().join('_');
    try {
      await addDoc(collection(db, "compatibility_history"), {
        userId: user.uid,
        pairId,
        pairNames: `${partner1.personName} + ${partner2.personName}`,
        dates: `${partner1.birthDate} & ${partner2.birthDate}`,
        matrixData: result,
        createdAt: serverTimestamp(),
      });
      setIsSaved(true);
      Alert.alert("Успех", "Совместимость сохранена");
    } catch (e) { Alert.alert("Ошибка", "Действие не удалось"); }
    finally { setSaveLoading(false); }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 60 }} 
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topSparkle}>
        <Ionicons name="sparkles-outline" size={32} color="#FFB6C1" />
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.header}>
          {result ? "Совместимость" : "Союз Душ"}
        </Text>
        {(partner1 || partner2) && (
          <TouchableOpacity onPress={handleReset} style={styles.clearIcon}>
            <Ionicons name="refresh-outline" size={24} color="#FFB6C1" />
          </TouchableOpacity>
        )}
      </View>

      {!result && (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles-outline" size={100} color="#FFF0F5" style={styles.bigSparkle} />
          <Text style={styles.emptyText}>Выберите партнеров, чтобы раскрыть потенциал союза</Text>
        </View>
      )}

      {/* КАРТОЧКА ВВОДА (как в arcana-calculate) */}
      <View style={styles.inputCard}>
        <View style={styles.pairRow}>
          {/* Партнер 1 */}
          <TouchableOpacity style={styles.partnerPicker} onPress={() => openPicker(1)}>
            <View style={[styles.avatar, partner1 && styles.avatarActive]}>
              <Ionicons name="person" size={24} color={partner1 ? "white" : "#FFB6C1"} />
            </View>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partner1 ? partner1.personName : "Партнер 1"}
            </Text>
            <Text style={styles.partnerDate}>{partner1 ? partner1.birthDate : "Выбрать"}</Text>
          </TouchableOpacity>

          <Ionicons name="heart" size={30} color="#FFB6C1" style={{ marginHorizontal: 10 }} />

          {/* Партнер 2 */}
          <TouchableOpacity style={styles.partnerPicker} onPress={() => openPicker(2)}>
            <View style={[styles.avatar, partner2 && styles.avatarActive]}>
              <Ionicons name="person" size={24} color={partner2 ? "white" : "#FFB6C1"} />
            </View>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partner2 ? partner2.personName : "Партнер 2"}
            </Text>
            <Text style={styles.partnerDate}>{partner2 ? partner2.birthDate : "Выбрать"}</Text>
          </TouchableOpacity>
        </View>

        {!result && (
          <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
            <Text style={styles.calcBtnText}>Рассчитать союз</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* РЕЗУЛЬТАТ (МАТРИЦА) */}
      {result && (
        <View style={styles.resultContainer}>
          <MatrixGraphic matrixData={result} onPointPress={() => {}} />
          
          <TouchableOpacity 
            style={[styles.saveBtn, isSaved && styles.saveBtnActive]} 
            onPress={toggleSaveCompatibility}
            disabled={saveLoading || isSaved}
          >
            {saveLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name={isSaved ? "checkmark-circle" : "bookmark-outline"} size={20} color="white" />
                <Text style={styles.saveBtnText}>{isSaved ? " Сохранено в историю" : " Сохранить результат"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* МОДАЛКИ (Выбор из истории) */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalLine} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите из истории</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.manualEntryBtn} onPress={() => { setModalVisible(false); setManualModalVisible(true); }}>
              <Ionicons name="create-outline" size={20} color="#FFB6C1" />
              <Text style={styles.manualEntryText}>Ввести новые данные вручную</Text>
            </TouchableOpacity>

            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.historyItem} onPress={() => selectUser(item)}>
                  <View>
                    <Text style={styles.historyName}>{item.personName}</Text>
                    <Text style={styles.historyDate}>{item.birthDate}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFB6C1" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ВВОД ВРУЧНУЮ */}
      <Modal visible={isManualModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{width: '100%'}}>
              <View style={[styles.modalContent, { height: 'auto', paddingBottom: 40 }]}>
                <View style={styles.modalLine} />
                <Text style={styles.modalTitle}>Новые данные</Text>
                <TextInput style={styles.input} placeholder="Имя" value={manualName} onChangeText={setManualName} />
                <TextInput 
                    style={styles.input} 
                    placeholder="ДД.ММ.ГГГГ" 
                    placeholderTextColor="#D0D0D0" 
                    value={manualDate} 
                    onChangeText={(t) => {
                        let c = t.replace(/\D/g, '');
                        let f = c;
                        if (c.length > 2) f = c.slice(0, 2) + '.' + c.slice(2);
                        if (c.length > 4) f = f.slice(0, 5) + '.' + f.slice(5, 9);
                        setManualDate(f);
                    }} 
                    keyboardType="numeric" 
                    maxLength={10} 
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.calcBtn, { width: '48%', backgroundColor: '#EEE' }]} onPress={() => setManualModalVisible(false)}>
                    <Text style={{ color: '#888' }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.calcBtn, { width: '48%' }]} onPress={handleManualSubmit}>
                    <Text style={styles.calcBtnText}>Готово</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20 },
  topSparkle: { alignItems: 'center', marginTop: 50, marginBottom: 10 },
  headerRow: { marginBottom: 25, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 26, fontWeight: '300', color: '#333', letterSpacing: 1 },
  clearIcon: { position: 'absolute', right: 0 },
  
  emptyState: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  bigSparkle: { marginBottom: 20, opacity: 0.5 },
  emptyText: { textAlign: 'center', color: '#AAA', fontSize: 16, lineHeight: 24, paddingHorizontal: 40, fontWeight: '300' },

  // СТИЛЬ КАРТОЧКИ КАК В ARCANA
  inputCard: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 30, 
    elevation: 5, 
    shadowColor: '#FFB6C1', 
    shadowOpacity: 0.1, 
    shadowRadius: 20,
    marginBottom: 10
  },
  pairRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  partnerPicker: { flex: 1, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF5F7', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#FDF2F4' },
  avatarActive: { backgroundColor: '#FFB6C1' },
  partnerName: { fontSize: 14, fontWeight: '600', color: '#333' },
  partnerDate: { fontSize: 12, color: '#AAA', marginTop: 2 },

  calcBtn: { backgroundColor: '#FFB6C1', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  calcBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  resultContainer: { marginTop: 20 },
  
  saveBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#FFB6C1', 
    padding: 16, 
    borderRadius: 15, 
    marginTop: 25, 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#FFB6C1',
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  saveBtnActive: { backgroundColor: '#FF8DA1', opacity: 0.9 },
  saveBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },

  // МОДАЛЬНЫЕ ОКНА
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, height: '80%' },
  modalLine: { width: 40, height: 5, backgroundColor: '#EEE', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  manualEntryBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF5F7', borderRadius: 15, marginBottom: 20 },
  manualEntryText: { color: '#FFB6C1', fontWeight: '600', marginLeft: 10 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', alignItems: 'center' },
  historyName: { fontWeight: '600', color: '#333' },
  historyDate: { fontSize: 12, color: '#AAA' },
  input: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 15, marginBottom: 15, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }
});