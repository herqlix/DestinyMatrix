import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { calculateMatrix } from '@/src/utils/MatrixCalculation';
import MatrixGraphic from '@/src/components/MatrixGraphic';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { ARCANA_DESCRIPTIONS } from '@/src/constants/arcanaDescriptions';
import { db, auth } from '@/src/config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function ArcanaCalculateScreen() {
  const { date: paramDate, personName: paramName } = useLocalSearchParams();
  
  const [inputText, setInputText] = useState('');
  const [personName, setPersonName] = useState(''); 
  const [matrixData, setMatrixData] = useState<any>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedArcana, setSelectedArcana] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [celebrityMatches, setCelebrityMatches] = useState<any[]>([]);

  // Проверка, сохранена ли уже эта дата
  const checkIfSaved = async (dateStr: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(collection(db, "history"), where("userId", "==", user.uid), where("birthDate", "==", dateStr));
      const querySnapshot = await getDocs(q);
      setIsSaved(!querySnapshot.empty);
    } catch (e) { console.error(e); }
  };

  const findCelebrityMatches = async (userCenter: number) => {
    try {
      const celebRef = collection(db, "celebrities");
      let q = query(celebRef, where("mainArcana", "==", userCenter));
      let querySnapshot = await getDocs(q);
      let matchedStars = querySnapshot.docs.map(doc => doc.data());
      setCelebrityMatches(matchedStars);
    } catch (e) { console.error(e); }
  };

  // ФУНКЦИЯ СОХРАНЕНИЯ (Внедрена)
  const handleToggleSave = async () => {
    const user = auth.currentUser;
    if (!user || !matrixData) {
      Alert.alert("Внимание", "Необходимо войти в аккаунт");
      return;
    }
    
    setLoading(true);
    try {
      const q = query(
        collection(db, "history"), 
        where("userId", "==", user.uid), 
        where("birthDate", "==", inputText)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setIsSaved(true);
        Alert.alert("Информация", "Эта матрица уже есть в вашей истории");
      } else {
        await addDoc(collection(db, "history"), {
          userId: user.uid,
          personName: personName.trim() || "Без имени",
          birthDate: inputText,
          matrixData: matrixData,
          isFavorite: false,
          createdAt: serverTimestamp(),
        });
        setIsSaved(true);
        Alert.alert("Успех", "Матрица сохранена в историю");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Ошибка", "Не удалось сохранить");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramDate && typeof paramDate === 'string') {
      const [y, m, d] = paramDate.split('-');
      const formatted = `${d}.${m}.${y}`;
      setInputText(formatted);
      const result = calculateMatrix(paramDate);
      setMatrixData(result);
      checkIfSaved(formatted);
      findCelebrityMatches(result.personal.center);
      if (paramName && String(paramName) !== "Без имени") setPersonName(String(paramName));
    }
  }, [paramDate, paramName]);

  const handleCalculate = () => {
    if (inputText.length !== 10) {
      Alert.alert("Ошибка", "Введите дату полностью");
      return;
    }
    const [d, m, y] = inputText.split('.');
    const isoDate = `${y}-${m}-${d}`;
    const result = calculateMatrix(isoDate);
    setMatrixData(result);
    checkIfSaved(inputText);
    findCelebrityMatches(result.personal.center);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      
      <View style={styles.topSparkle}>
        <Ionicons name="sparkles-outline" size={32} color="#FFB6C1" />
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.header}>
          {!matrixData ? "Новый расчет" : (personName.trim() ? personName : "Матрица судьбы")}
        </Text>
        {matrixData && (
          <TouchableOpacity onPress={() => { setMatrixData(null); setInputText(''); setPersonName(''); setIsSaved(false); }} style={styles.clearIcon}>
            <Ionicons name="refresh-outline" size={24} color="#FFB6C1" />
          </TouchableOpacity>
        )}
      </View>

      {!matrixData && (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles-outline" size={100} color="#FFF0F5" style={styles.bigSparkle} />
          <Text style={styles.emptyText}>Введите данные, чтобы раскрыть потенциал души</Text>
        </View>
      )}

      <View style={[styles.inputCard, matrixData && styles.inputCardCompact]}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#FFB6C1" style={styles.inputIcon} />
          <TextInput
            style={styles.dateInput}
            placeholder="Имя (необязательно)"
            placeholderTextColor="#C0C0C0"
            value={personName}
            onChangeText={setPersonName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={20} color="#FFB6C1" style={styles.inputIcon} />
          <TextInput
            style={styles.dateInput}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#C0C0C0"
            keyboardType="numeric"
            maxLength={10}
            value={inputText}
            onChangeText={(text) => {
                let cleaned = text.replace(/\D/g, '');
                let formatted = cleaned;
                if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '.' + cleaned.slice(2);
                if (cleaned.length > 4) formatted = formatted.slice(0, 5) + '.' + formatted.slice(5, 9);
                setInputText(formatted);
                setIsSaved(false);
            }}
          />
          <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
            <Ionicons name="chevron-down-circle-outline" size={24} color="#FFB6C1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
          <Text style={styles.calcBtnText}>Раскрыть матрицу</Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => {
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            setInputText(`${d}.${m}.${date.getFullYear()}`);
            setDatePickerVisibility(false);
            setIsSaved(false);
        }}
        onCancel={() => setDatePickerVisibility(false)}
      />

      {matrixData && (
        <View style={styles.resultContainer}>
          <MatrixGraphic matrixData={matrixData} onPointPress={(num: number) => setSelectedArcana(num)} />
          
          <TouchableOpacity 
            style={[styles.saveBtn, isSaved && styles.saveBtnActive]} 
            onPress={handleToggleSave}
            disabled={loading || isSaved}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name={isSaved ? "checkmark-circle" : "bookmark-outline"} size={20} color="white" />
                <Text style={styles.saveBtnText}>{isSaved ? " Сохранено в историю" : " Сохранить результат"}</Text>
              </>
            )}
          </TouchableOpacity>

          {celebrityMatches.length > 0 && (
            <View style={styles.celebSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={18} color="#FFB6C1" />
                <Text style={styles.celebTitle}> Звездные энергии</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.celebScroll}>
                {celebrityMatches.map((star, index) => (
                  <View key={index} style={styles.celebCard}>
                    <View style={styles.celebAvatar}>
                        <Text style={styles.avatarText}>{star.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.celebName} numberOfLines={2}>{star.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      <Modal visible={selectedArcana !== null} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalLine} />
                  <Text style={styles.modalTitle}>{selectedArcana} Аркан</Text>
                  <ScrollView>
                      {selectedArcana && ARCANA_DESCRIPTIONS[selectedArcana] ? (
                          <View>
                              <Text style={styles.descriptionText}>{ARCANA_DESCRIPTIONS[selectedArcana].description}</Text>
                              <Text style={styles.subHeader}>Проявления в плюсе:</Text>
                              <Text style={styles.descriptionText}>{ARCANA_DESCRIPTIONS[selectedArcana].positive}</Text>
                              <Text style={styles.subHeader}>Проявления в минусе:</Text>
                              <Text style={styles.descriptionText}>{ARCANA_DESCRIPTIONS[selectedArcana].negative}</Text>
                          </View>
                      ) : <Text>Описание готовится...</Text>}
                  </ScrollView>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedArcana(null)}>
                      <Text style={styles.closeBtnText}>Понятно</Text>
                  </TouchableOpacity>
              </View>
          </View>
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
  inputCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 30, elevation: 5, shadowColor: '#FFB6C1', shadowOpacity: 0.1, shadowRadius: 20 },
  inputCardCompact: { padding: 15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 15, paddingHorizontal: 15, marginBottom: 12, height: 55 },
  inputIcon: { marginRight: 10 },
  dateInput: { flex: 1, fontSize: 16, color: '#333' },
  calcBtn: { backgroundColor: '#FFB6C1', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  calcBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  resultContainer: { marginTop: 20 },
  
  // КНОПКА СОХРАНИТЬ (Исправленные стили)
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
  saveBtnActive: { 
    backgroundColor: '#FF8DA1', 
    opacity: 0.9 
  },
  saveBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },

  celebSection: { marginTop: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  celebTitle: { fontSize: 20, fontWeight: '300', color: '#333' },
  celebScroll: { paddingRight: 20 },
  celebCard: { backgroundColor: '#FAFAFA', width: 110, padding: 15, borderRadius: 20, marginRight: 12, alignItems: 'center' },
  celebAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFB6C1', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  celebName: { fontSize: 12, textAlign: 'center', color: '#666', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, height: '80%' },
  modalLine: { width: 40, height: 5, backgroundColor: '#EEE', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFB6C1', textAlign: 'center', marginBottom: 20 },
  subHeader: { fontWeight: 'bold', marginTop: 20, color: '#333', fontSize: 16 },
  descriptionText: { fontSize: 15, lineHeight: 24, color: '#666', marginTop: 8 },
  closeBtn: { marginTop: 30, backgroundColor: '#FFB6C1', padding: 18, borderRadius: 20, alignItems: 'center' },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});