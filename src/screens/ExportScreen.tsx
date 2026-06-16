import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Title, DataTable, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

const STUDENTS_KEY = '@students';
const RECORDS_KEY = '@daily_records';

export const ExportScreen = () => {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDataAndCompute();
  }, []);

  const loadDataAndCompute = async () => {
    const storedStudents = await AsyncStorage.getItem(STUDENTS_KEY);
    const storedRecords = await AsyncStorage.getItem(RECORDS_KEY);
    const studentsList = storedStudents ? JSON.parse(storedStudents) : [];
    const records = storedRecords ? JSON.parse(storedRecords) : {};

    setStudents(studentsList);
    computeSummary(studentsList, records);
  };

  const computeSummary = (studentsList, records) => {
    const summaryData = studentsList.map((student) => {
      let totalNumeric = 0;
      let numericCount = 0;
      let totalF = 0;
      let totalJ = 0;

      Object.values(records).forEach((dayEntries) => {
        const val = dayEntries[student.id];
        if (val === 'f') totalF++;
        else if (val === 'j') totalJ++;
        else if (val === '.') {
          // ignorar
        } else if (!isNaN(parseFloat(val)) && isFinite(val)) {
          const grade = parseFloat(val);
          if (grade >= 0 && grade <= 10) {
            totalNumeric += grade;
            numericCount++;
          }
        }
      });

      const average = numericCount > 0 ? (totalNumeric / numericCount).toFixed(2) : 'N/A';
      return {
        id: student.id,
        name: student.name,
        average,
        faltas: totalF,
        justificadas: totalJ,
        numGrades: numericCount,
      };
    });
    setSummary(summaryData);
  };

  const exportToExcel = async () => {
    if (students.length === 0) {
      Alert.alert('Error', 'No hay estudiantes registrados');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos de la hoja
      const wsData = [
        ['No.', 'NOMBRE DEL ALUMNO', 'FALTAS (f)', 'JUSTIFICADAS (j)', 'PROMEDIO FINAL'],
      ];
      summary.forEach((s, idx) => {
        wsData.push([idx + 1, s.name, s.faltas, s.justificadas, s.average]);
      });

      // Fila de resumen adicional
      wsData.push([]);
      wsData.push(['Resumen:']);
      wsData.push(['Total de días con registros', '---']);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Resumen Calificaciones');

      // Escribir archivo
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'calificaciones.xlsx';
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Guardar/Compartir Excel',
        });
      } else {
        Alert.alert('Error', 'No se puede compartir en este dispositivo');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo generar el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Exportar a Excel</Title>

      <Button
        mode="contained"
        onPress={exportToExcel}
        loading={loading}
        disabled={loading || students.length === 0}
        style={styles.exportBtn}
      >
        Generar y Compartir Excel
      </Button>

      {summary.length > 0 && (
        <DataTable style={styles.table}>
          <DataTable.Header>
            <DataTable.Title>#</DataTable.Title>
            <DataTable.Title>Estudiante</DataTable.Title>
            <DataTable.Title numeric>F</DataTable.Title>
            <DataTable.Title numeric>J</DataTable.Title>
            <DataTable.Title numeric>Prom</DataTable.Title>
          </DataTable.Header>

          {summary.map((row, idx) => (
            <DataTable.Row key={row.id}>
              <DataTable.Cell>{idx + 1}</DataTable.Cell>
              <DataTable.Cell>{row.name}</DataTable.Cell>
              <DataTable.Cell numeric>{row.faltas}</DataTable.Cell>
              <DataTable.Cell numeric>{row.justificadas}</DataTable.Cell>
              <DataTable.Cell numeric>{row.average}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { marginBottom: 16, textAlign: 'center' },
  exportBtn: { marginBottom: 24, backgroundColor: '#1e6f3f' },
  table: { marginTop: 8 },
});