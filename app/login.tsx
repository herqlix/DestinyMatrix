import { auth, db } from '@/src/config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { 
  KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, 
  TouchableOpacity, View, Alert, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleDateChange = (text: string) => {
    let cleaned = text.replace(/\D/g, ''); 
    let formatted = cleaned;
    
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '.' + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.slice(0, 5) + '.' + cleaned.slice(4, 8);
    }
    setBirthDate(formatted);
  };

  const isValidDate = (dateStr: string) => {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return false;
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    const now = new Date();
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      date < now &&
      year > 1900
    );
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Внимание", "Введите Email, чтобы получить ссылку для сброса пароля.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Успех", "Письмо со ссылкой для сброса пароля отправлено на вашу почту.");
    } catch (error: any) {
      Alert.alert("Ошибка", getErrorMessage(error));
    }
  };

  const getErrorMessage = (error: any) => {
    const code = error.code;
    switch (code) {
      case 'auth/user-not-found': return 'Пользователь с таким Email не найден.';
      case 'auth/wrong-password': return 'Неверный пароль.';
      case 'auth/email-already-in-use': return 'Эта почта уже занята.';
      case 'auth/invalid-email': return 'Некорректный формат Email.';
      case 'auth/weak-password': return 'Пароль должен быть не менее 6 символов.';
      case 'auth/too-many-requests': return 'Слишком много попыток. Попробуйте позже.';
      default: return 'Произошла ошибка: ' + error.message;
    }
  };

  const handleAuth = async () => {
    if (!email || !password || (isRegistering && (!name || !birthDate))) {
      Alert.alert("Ошибка", "Заполните все поля");
      return;
    }

    if (isRegistering && !isValidDate(birthDate)) {
      Alert.alert("Ошибка", "Введите реальную дату рождения (ДД.ММ.ГГГГ)");
      return;
    }

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: name,
          birthDate: birthDate,
          email: email,
          createdAt: new Date().toISOString(),
        });

        Alert.alert(
          "Подтвердите почту", 
          "Мы отправили письмо на ваш Email. Пожалуйста, подтвердите его перед входом."
        );
        setIsRegistering(false); 
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        await userCredential.user.reload();
        const user = auth.currentUser;

        if (user && !user.emailVerified) {
          Alert.alert(
            "Почта не подтверждена",
            "Вы подтвердили почту по ссылке в письме? Если нет, мы можем отправить письмо еще раз.",
            [
              {
                text: "Я подтвердил",
                onPress: async () => {
                   await user.reload();
                   if (auth.currentUser?.emailVerified) {
                    } else {
                     Alert.alert("Ошибка", "Статус всё еще 'не подтверждено'. Подождите пару секунд и попробуйте войти снова.");
                   }
                }
              },
              {
                text: "Отправить письмо еще раз",
                onPress: async () => {
                  await sendEmailVerification(user);
                  await auth.signOut();
                  Alert.alert("Отправлено", "Новое письмо отправлено. Проверьте почту.");
                }
              },
              {
                text: "Отмена",
                onPress: async () => await auth.signOut(),
                style: "cancel"
              },
            ]
          );
        }
      }
    } catch (error: any) {
      Alert.alert("Ошибка", getErrorMessage(error));
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inner}>
          <Text style={styles.title}>{isRegistering ? 'Создать аккаунт' : 'Добро пожаловать'}</Text>
          
          {isRegistering && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Имя</Text>
                <TextInput style={styles.input} placeholder="Как вас зовут?" placeholderTextColor="#D0D0D0" value={name} onChangeText={setName} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Дата рождения</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="ДД.ММ.ГГГГ" 
                  placeholderTextColor="#D0D0D0" 
                  value={birthDate} 
                  onChangeText={handleDateChange} 
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="mail@example.com"
              placeholderTextColor="#D0D0D0" 
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Пароль</Text>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={[styles.input, { flex: 1, borderBottomWidth: 0 }]} 
                placeholder="••••••••" 
                placeholderTextColor="#D0D0D0" 
                secureTextEntry={!showPassword} 
                value={password} 
                onChangeText={setPassword} 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          {!isRegistering && (
            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Забыли пароль?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.mainBtn} onPress={handleAuth}>
            <Text style={styles.btnText}>{isRegistering ? "Зарегистрироваться" : "Войти"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.subBtn} onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.subBtnText}>
              {isRegistering ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Создать"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  inner: { padding: 40 },
  title: { fontSize: 28, fontWeight: '200', color: '#333', textAlign: 'center', marginBottom: 40 },
  field: { marginBottom: 20 },
  label: { color: '#999', marginBottom: 5, fontSize: 12 },
  input: { borderBottomWidth: 1, borderBottomColor: '#f8d9e4ff', paddingVertical: 8, fontSize: 16, color: '#333' },
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f8d9e4ff' 
  },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -10, marginBottom: 15 },
  forgotText: { color: '#FFB6C1', fontSize: 13, textDecorationLine: 'underline' },
  mainBtn: { backgroundColor: '#FFB6C1', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
  subBtn: { marginTop: 25, alignItems: 'center' },
  subBtnText: { color: '#D0D0D0', fontSize: 14, textDecorationLine: 'underline' }
});