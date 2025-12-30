import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { calculateMatrix } from './MatrixCalculation';

const celebritiesData = [
  { name: "Мэрилин Монро", birthDate: "01.06.1926" },
  { name: "Киану Ривз", birthDate: "02.09.1964" },
  { name: "Шакира", birthDate: "02.02.1977" },
  { name: "Принцесса Диана", birthDate: "01.07.1961" },
  { name: "Бенедикт Камбербэтч", birthDate: "19.07.1976" },
  { name: "Анджелина Джоли", birthDate: "04.06.1975" },
  { name: "Адель", birthDate: "05.05.1988" },
  { name: "Илон Маск", birthDate: "28.06.1971" },
  { name: "Стив Джобс", birthDate: "24.02.1955" },
  { name: "Джордж Клуни", birthDate: "06.05.1961" },
  { name: "Уилл Смит", birthDate: "25.09.1968" },
  { name: "Натали Портман", birthDate: "09.06.1981" },
  { name: "Джонни Депп", birthDate: "09.06.1963" },
  { name: "Павел Дуров", birthDate: "10.10.1984" },
  { name: "Леонардо Ди Каприо", birthDate: "11.11.1974" },
  { name: "Риhanna", birthDate: "20.02.1988" },
  { name: "Райан Гослинг", birthDate: "12.11.1980" },
  { name: "Тейлор Свифт", birthDate: "13.12.1989" },
  { name: "Альберт Эйнштейн", birthDate: "14.03.1879" },
  { name: "Моника Беллуччи", birthDate: "30.09.1964" },
  { name: "Том Харди", birthDate: "15.09.1977" },
  { name: "Мадонна", birthDate: "16.08.1958" },
  { name: "Арнольд Шварценеггер", birthDate: "30.07.1947" },
  { name: "Билли Айлиш", birthDate: "18.12.2001" },
  { name: "Коко Шанель", birthDate: "19.08.1883" },
  { name: "Дэвид Бекхэм", birthDate: "02.05.1975" },
  { name: "Леди Гага", birthDate: "28.03.1986" },
  { name: "Брэд Питт", birthDate: "18.12.1963" },
  { name: "Бейонсе", birthDate: "04.09.1981" },
  { name: "Киллиан Мерфи", birthDate: "25.05.1976" },
  { name: "Джим Керри", birthDate: "17.01.1962" },
  { name: "Марк Цукерберг", birthDate: "14.05.1984" },
  { name: "Квентин Тарантино", birthDate: "27.03.1963" },
  { name: "Криштиану Роналду", birthDate: "05.02.1985" },
  { name: "Канье Уэст", birthDate: "08.06.1977" },
  { name: "Зендея", birthDate: "01.09.1996" },
  { name: "Скарлетт Йоханссон", birthDate: "22.11.1984" },
  { name: "Джаред Лето", birthDate: "26.12.1971" },
  { name: "Одри Хепберн", birthDate: "04.05.1929" },
  { name: "Эминем", birthDate: "17.10.1972" },
  { name: "Мэттью Макконахи", birthDate: "04.11.1969" }
];

export const seedCelebrities = async () => {
  try {
    const celebRef = collection(db, "celebrities");
    const snapshot = await getDocs(query(celebRef, limit(1)));

    if (snapshot.empty) {
      console.log("Начинаем автоматический расчет и загрузку звезд...");
      
      for (const celeb of celebritiesData) {
        const [d, m, y] = celeb.birthDate.split('.');
        const isoDate = `${y}-${m}-${d}`;
        
        const result = calculateMatrix(isoDate);
        const autoArcana = result.personal.center; 

        await addDoc(celebRef, {
          name: celeb.name,
          birthDate: celeb.birthDate,
          mainArcana: autoArcana 
        });
      }
      console.log("Готово! Все звезды загружены с правильными арканами.");
    } else {
      console.log("База уже заполнена.");
    }
  } catch (error) {
    console.error("Ошибка при сидировании:", error);
  }
};