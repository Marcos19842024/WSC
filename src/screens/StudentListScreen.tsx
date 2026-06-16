import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  List,
  IconButton,
  Title,
  Portal,
  Dialog,
  Text,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@students';

export const StudentListScreen = () => {
  const [students, setStudents] = useState([]);
  const [newName, setNewName] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      setStudents(JSON.parse(stored));
    }
  };

  const saveStudents = async (newStudents) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStudents));
    setStudents(newStudents);
  };

  const addStudent = () => {
    if (!newName.trim()) return;
    const newStudent = {
      id: Date.now().toString(),
      name: newName.trim(),
    };
    saveStudents([...students, newStudent]);
    setNewName('');
  };

  const deleteStudent = (id) => {
    Alert.alert('Confirmar', '¿Eliminar estudiante?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const filtered = students.filter((s) => s.id !== id);
          saveStudents(filtered);
        },
      },
    ]);
  };

  const openEditDialog = (student) => {
    setEditingId(student.id);
    setEditingName(student.name);
    setDialogVisible(true);
  };

  const saveEdit = () => {
    if (!editingName.trim()) return;
    const updated = students.map((s) =>
      s.id === editingId ? { ...s, name: editingName.trim() } : s
    );
    saveStudents(updated);
    setDialogVisible(false);
    setEditingId(null);
    setEditingName('');
  };

  const renderItem = ({ item, index }) => (
    <List.Item
      title={`${index + 1}. ${item.name}`}
      left={() => <List.Icon icon="account" />}
      right={() => (
        <View style={styles.rowActions}>
          <IconButton icon="pencil" onPress={() => openEditDialog(item)} />
          <IconButton icon="delete" onPress={() => deleteStudent(item.id)} />
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Lista de Estudiantes</Title>
      <View style={styles.inputRow}>
        <TextInput
          label="Nombre completo"
          value={newName}
          onChangeText={setNewName}
          style={styles.input}
          mode="outlined"
        />
        <Button mode="contained" onPress={addStudent} style={styles.addBtn}>
          Agregar
        </Button>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No hay estudiantes. Agrega uno.</Text>}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Editar estudiante</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre"
              value={editingName}
              onChangeText={setEditingName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
            <Button onPress={saveEdit}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { marginBottom: 16, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: { flex: 1, marginRight: 8 },
  addBtn: { height: 50, justifyContent: 'center' },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 20, color: 'gray' },
});