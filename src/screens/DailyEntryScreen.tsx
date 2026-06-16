import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
} from 'react-native';
import {
  Button,
  Title,
  TextInput as PaperInput,
  IconButton,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const STUDENTS_KEY = '@students';
const RECORDS_KEY = '@daily_records';

export const DailyEntryScreen = () => {
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [entries, setEntries] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      loadEntriesForDate();
    }
  }, [selectedDate, students]);

  const loadStudents = async () => {
    const stored = await AsyncStorage.getItem(STUDENTS_KEY);
    if (stored) setStudents(JSON.parse(stored));
  };

  const loadEntriesForDate = async () => {
    const stored = await AsyncStorage.getItem(RECORDS_KEY);
    const allRecords = stored ? JSON.parse(stored) : {};
    const dateKey = selectedDate.toISOString().split('T')[0];
    const dayEntries = allRecords[dateKey] || {};
    setEntries(dayEntries);
  };

  const saveCurrentEntries = async () => {
    const stored = await AsyncStorage.getItem(RECORDS_KEY);
    const allRecords = stored ? JSON.parse(stored) : {};
    const dateKey = selectedDate.toISOString().split('T')[0];
    allRecords[dateKey] = entries;
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
  };

  const updateEntry = (studentId, value) => {
    const newEntries = { ...entries, [studentId]: value };
    setEntries(newEntries);
  };

  const openModal = (student) => {
    setCurrentStudent(student);
    const existing = entries[student.id] || '';
    setTempValue(existing);
    setModalVisible(true);
  };

  const saveModalValue = () => {
    if (currentStudent) {
      updateEntry(currentStudent.id, tempValue);
    }
    setModalVisible(false);
    setCurrentStudent(null);
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const renderStudentItem = ({ item }) => {
    const value = entries[item.id] || '';
    let displayValue = value === '' ? '—' : value;

    return (
      <TouchableOpacity style={styles.studentRow} onPress={() => openModal(item)}>
        <Text style={styles.studentName}>{item.name}</Text>
        <View style={styles.valueBadge}>
          <Text style={styles.valueText}>{displayValue}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Registro Diario</Title>

      <View style={styles.dateRow}>
        <Button mode="outlined" onPress={() => setShowDatePicker(true)}>
          {selectedDate.toLocaleDateString()}
        </Button>
        <IconButton icon="content-save" onPress={saveCurrentEntries} />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderStudentItem}
        ListEmptyComponent={<Text style={styles.empty}>Agrega estudiantes primero</Text>}
      />

      {/* Modal para asignar calificación / f / j / . */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentStudent?.name}
            </Text>
            <ScrollView>
              <View style={styles.gradeGrid}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.gradeButton}
                    onPress={() => setTempValue(num.toString())}
                  >
                    <Text style={styles.gradeText}>{num}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.gradeButton, { backgroundColor: '#ff9800' }]}
                  onPress={() => setTempValue('f')}
                >
                  <Text style={styles.gradeText}>f</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.gradeButton, { backgroundColor: '#4caf50' }]}
                  onPress={() => setTempValue('j')}
                >
                  <Text style={styles.gradeText}>j</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.gradeButton, { backgroundColor: '#9e9e9e' }]}
                  onPress={() => setTempValue('.')}
                >
                  <Text style={styles.gradeText}>.</Text>
                </TouchableOpacity>
              </View>

              <PaperInput
                label="Personalizado (ej: 8.5, f, j, .)"
                value={tempValue}
                onChangeText={setTempValue}
                mode="outlined"
                style={styles.customInput}
              />

              <View style={styles.modalActions}>
                <Button onPress={() => setModalVisible(false)}>Cancelar</Button>
                <Button mode="contained" onPress={saveModalValue}>
                  Guardar
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { marginBottom: 16, textAlign: 'center' },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
  },
  studentName: { fontSize: 16, flex: 1 },
  valueBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  valueText: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gradeButton: {
    width: 70,
    height: 70,
    backgroundColor: '#2196f3',
    margin: 6,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  customInput: { marginBottom: 16 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  empty: { textAlign: 'center', marginTop: 20, color: 'gray' },
});