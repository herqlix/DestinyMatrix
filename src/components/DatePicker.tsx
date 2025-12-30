import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DatePicker = ({ onChangeDate }: { onChangeDate: (date: Date) => void }) => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const onChange = (event: any, selectedDate: Date | undefined) => {
    setShow(false);
    if (selectedDate) {
      setDate(selectedDate);
      onChangeDate(selectedDate);
    }
  };

  return (
    <View>
      <Text>Выберите дату рождения:</Text>
      <Text>{date.toDateString()}</Text>
      <Button title="Выбрать дату" onPress={() => setShow(true)} />

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};

export default DatePicker;
