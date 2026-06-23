import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Title, DataTable, Text, Card, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';

const STUDENTS_KEY = '@students';
const RECORDS_KEY = '@daily_records';

export const ExportScreen = () => {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

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

  // === FUNCIÓN PARA IMPORTAR EXCEL (formato específico) ===
  const importFromExcel = async () => {
    setImportLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setImportLoading(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const workbook = XLSX.read(fileContent, { type: 'base64' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      // Buscar en qué columna está "NOMBRE DEL ALUMNO"
      let nameColumnIndex = -1;
      let startRow = -1;

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any[];
        if (!row) continue;

        // Buscar la fila que contiene "NOMBRE DEL ALUMNO"
        for (let j = 0; j < row.length; j++) {
          if (typeof row[j] === 'string' &&
              row[j].toUpperCase().includes('NOMBRE DEL ALUMNO')) {
            nameColumnIndex = j;
            // La siguiente fila (i+1) contiene el número de estudiante
            // Los nombres empiezan en la fila siguiente a la que tiene "No | NOMBRE DEL ALUMNO"
            startRow = i + 1;
            break;
          }
        }
        if (nameColumnIndex !== -1) break;
      }

      // Si no encontró "NOMBRE DEL ALUMNO", buscar en formato alternativo
      if (nameColumnIndex === -1) {
        // Buscar "NOMBRE DEL ALUMNO" en la fila con "No"
        for (let i = 0; i < data.length; i++) {
          const row = data[i] as any[];
          if (!row) continue;
          for (let j = 0; j < row.length; j++) {
            if (typeof row[j] === 'string' &&
                row[j].toUpperCase().includes('NOMBRE DEL ALUMNO')) {
              nameColumnIndex = j;
              startRow = i + 1;
              break;
            }
          }
          if (nameColumnIndex !== -1) break;
        }
      }

      // Si aún no encontró, usar columna B (índice 1) como predeterminada
      if (nameColumnIndex === -1) {
        nameColumnIndex = 1;
        // Buscar la primera fila con datos (después de la fila 10 que tiene el encabezado)
        for (let i = 10; i < data.length; i++) {
          const row = data[i] as any[];
          if (row && row[nameColumnIndex] && row[nameColumnIndex].toString().trim() !== '') {
            startRow = i;
            break;
          }
        }
      }

      // Extraer nombres desde la fila startRow
      const importedNames = [];
      for (let i = startRow; i < data.length; i++) {
        const row = data[i] as any[];
        if (row && row[nameColumnIndex]) {
          const name = row[nameColumnIndex].toString().trim();
          // Saltar filas vacías o que contienen "PROMEDIO FINAL" o "ALUMNOS APROBADOS"
          if (name && 
              name !== '' &&
              !name.toUpperCase().includes('PROMEDIO') &&
              !name.toUpperCase().includes('ALUMNOS') &&
              !name.toUpperCase().includes('PORCENTAJE') &&
              !name.toUpperCase().includes('REPROBADOS')) {
            importedNames.push(name);
          }
        }
      }

      if (importedNames.length === 0) {
        Alert.alert('Error', 'No se encontraron nombres en el archivo.\nAsegúrate de que tenga una columna "NOMBRE DEL ALUMNO".');
        setImportLoading(false);
        return;
      }

      // Guardar los nombres importados
      const newStudents = importedNames.map((name, index) => ({
        id: Date.now().toString() + index.toString(),
        name: name,
      }));

      await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(newStudents));
      setStudents(newStudents);
      
      Alert.alert(
        'Éxito', 
        `Se importaron ${newStudents.length} estudiantes correctamente`
      );

      loadDataAndCompute();

    } catch (error) {
      console.error('Error al importar:', error);
      Alert.alert('Error', 'No se pudo importar el archivo: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  // === FUNCIÓN PARA EXPORTAR EXCEL (formato exacto de tu muestra) ===
  const exportToExcel = async () => {
    if (students.length === 0) {
      Alert.alert('Error', 'No hay estudiantes registrados');
      return;
    }

    setLoading(true);
    try {
      const storedRecords = await AsyncStorage.getItem(RECORDS_KEY);
      const records = storedRecords ? JSON.parse(storedRecords) : {};
      const storedStudents = await AsyncStorage.getItem(STUDENTS_KEY);
      const studentsList = storedStudents ? JSON.parse(storedStudents) : [];

      // Obtener fechas ordenadas
      const dates = Object.keys(records).sort();

      // Preparar encabezados
      const headers = ['No.', 'NOMBRE DEL ALUMNO'];
      
      // Agregar columnas por cada fecha (con formato legible)
      dates.forEach(date => {
        const dateObj = new Date(date + 'T00:00:00');
        headers.push(dateObj.toLocaleDateString());
      });
      
      // Agregar columnas de resumen
      headers.push('FALTAS (f)');
      headers.push('JUSTIFICADAS (j)');
      headers.push('PROMEDIO FINAL');

      // Preparar datos
      const wsData = [headers];

      studentsList.forEach((student, idx) => {
        const row = [idx + 1, student.name];
        let totalF = 0;
        let totalJ = 0;
        let totalNumeric = 0;
        let numericCount = 0;

        dates.forEach(date => {
          const dayRecords = records[date] || {};
          const val = dayRecords[student.id] || '';
          row.push(val);
          
          if (val === 'f') totalF++;
          else if (val === 'j') totalJ++;
          else if (val !== '.' && val !== '' && !isNaN(parseFloat(val))) {
            const grade = parseFloat(val);
            if (grade >= 0 && grade <= 10) {
              totalNumeric += grade;
              numericCount++;
            }
          }
        });

        const average = numericCount > 0 ? (totalNumeric / numericCount).toFixed(2) : 'N/A';
        row.push(totalF);
        row.push(totalJ);
        row.push(average);
        wsData.push(row);
      });

      // Agregar estadísticas finales (como en tu formato)
      wsData.push([]);
      wsData.push(['RESUMEN GENERAL:']);
      wsData.push(['Total de estudiantes:', String(studentsList.length)]);
      wsData.push(['Total de días registrados:', String(dates.length)]);
      
      // Calcular promedios generales
      let totalAverage = 0;
      let avgCount = 0;
      summary.forEach(s => {
        if (s.average !== 'N/A') {
          totalAverage += parseFloat(s.average);
          avgCount++;
        }
      });
      const generalAvg = avgCount > 0 ? (totalAverage / avgCount).toFixed(2) : 'N/A';
      wsData.push(['Promedio general del grupo:', generalAvg]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');

      // Ajustar ancho de columnas automáticamente
      const colWidths = headers.map((h, idx) => ({
        wch: Math.max(h.length, 15)
      }));
      ws['!cols'] = colWidths;

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const uri = FileSystem.cacheDirectory + 'calificaciones_completas.xlsx';
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
      Alert.alert('Error', 'No se pudo generar el archivo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Importar / Exportar Excel</Title>

      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={importFromExcel}
            loading={importLoading}
            disabled={importLoading}
            style={[styles.btn, styles.importBtn]}
            icon="file-import"
          >
            Importar Lista desde Excel
          </Button>
          <Text style={styles.note}>
            El archivo debe tener una columna con "NOMBRE DEL ALUMNO"
          </Text>
          <Text style={styles.noteSmall}>
            Formato compatible: .xlsx con encabezados en filas 9-10
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={exportToExcel}
            loading={loading}
            disabled={loading || students.length === 0}
            style={[styles.btn, styles.exportBtn]}
            icon="file-export"
          >
            Exportar Todo a Excel
          </Button>
          <Text style={styles.note}>
            Exporta todas las calificaciones, faltas y justificadas
          </Text>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      <Title style={styles.subtitle}>Resumen Actual</Title>

      {summary.length > 0 ? (
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
      ) : (
        <Text style={styles.emptyText}>No hay estudiantes registrados</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { marginBottom: 16, textAlign: 'center', fontSize: 24 },
  subtitle: { marginTop: 16, marginBottom: 8, fontSize: 18 },
  card: { marginBottom: 16 },
  btn: { paddingVertical: 8 },
  importBtn: { backgroundColor: '#1976d2' },
  exportBtn: { backgroundColor: '#1e6f3f' },
  note: { marginTop: 8, fontSize: 12, color: 'gray', textAlign: 'center' },
  noteSmall: { fontSize: 10, color: 'gray', textAlign: 'center' },
  divider: { marginVertical: 16 },
  table: { marginTop: 8 },
  emptyText: { textAlign: 'center', marginTop: 20, color: 'gray' },
});