import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  Image, Alert, ScrollView, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '@/src/config/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setLoading(true);
    setPhotoURL(user.photoURL);

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setName(userData.name || user.displayName || '');
        setBirthDate(userData.birthDate || '');
        if (userData.photoURL) setPhotoURL(userData.photoURL);
      } else {
        setName(user.displayName || '');
      }
    } catch (e) {
      console.log("Ошибка загрузки данных пользователя", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 8)}`;
    }
    setBirthDate(formatted);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужен доступ к галерее для загрузки фото');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!name || !birthDate) {
      Alert.alert("Ошибка", "Имя и дата рождения не могут быть пустыми");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(user, {
        displayName: name,
        photoURL: photoURL
      });

      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        name: name,
        birthDate: birthDate,
        photoURL: photoURL,
        updatedAt: new Date().toISOString()
      });

      Alert.alert("Успех", "Профиль обновлен");
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось сохранить данные");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Удаление аккаунта",
      "Вы уверены? Все ваши данные будут безвозвратно удалены.",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Удалить", 
          style: "destructive", 
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
              await deleteDoc(doc(db, "users", user.uid));
              await deleteUser(user);
            } catch (e: any) {
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert("Ошибка", "Для удаления аккаунта нужно перезайти в приложение.");
              } else {
                Alert.alert("Ошибка", "Не удалось удалить аккаунт.");
              }
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFB6C1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Мой профиль</Text>

      <TouchableOpacity style={styles.photoContainer} onPress={pickImage} activeOpacity={0.8}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={40} color="#FFB6C1" />
          </View>
        )}
        <View style={styles.editBadge}>
          <Ionicons name="pencil" size={14} color="white" />
        </View>
      </TouchableOpacity>

      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ваше имя"
            placeholderTextColor="#C0C0C0"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Дата рождения</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={handleDateChange}
            placeholder="ДД.ММ.ГГГГ"
            placeholderTextColor="#C0C0C0"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveBtnText}>Сохранить изменения</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dangerZone}>
        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => auth.signOut()}
        >
          <Ionicons name="log-out-outline" size={20} color="#888" style={{ marginRight: 10 }} />
          <Text style={styles.secondaryBtnText}>Выйти из аккаунта</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.dangerBtn} 
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" style={{ marginRight: 10 }} />
          <Text style={styles.dangerBtnText}>Удалить аккаунт</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { alignItems: 'center', paddingHorizontal: 25, paddingTop: 60, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: '300', color: '#333', marginBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoContainer: { marginBottom: 30, position: 'relative' },
  photo: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#FFF0F5' },
  photoPlaceholder: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: '#F9F9F9', justifyContent: 'center', 
    alignItems: 'center', borderWidth: 1, borderColor: '#FFF0F5' 
  },
  editBadge: { 
    position: 'absolute', bottom: 5, right: 5, 
    backgroundColor: '#FFB6C1', width: 30, height: 30, 
    borderRadius: 15, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'white'
  },
  inputSection: { width: '100%', marginBottom: 30 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 14, color: '#999', marginBottom: 8, marginLeft: 5 },
  input: { 
    backgroundColor: '#F9F9F9', padding: 15, borderRadius: 20, 
    fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#FFF0F5' 
  },
  saveBtn: { 
    backgroundColor: '#FFB6C1', width: '100%', padding: 18, 
    borderRadius: 25, alignItems: 'center', elevation: 2,
    shadowColor: '#FFB6C1', shadowOpacity: 0.3, shadowRadius: 10
  },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  dangerZone: { width: '100%', marginTop: 30 },
  secondaryBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#EEE', 
    marginBottom: 12 
  },
  secondaryBtnText: { color: '#888', fontSize: 15, fontWeight: '500' },
  dangerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 15, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#FFE5E5' 
  },
  dangerBtnText: { color: '#FF6B6B', fontSize: 15, fontWeight: '500' }
});