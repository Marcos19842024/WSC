import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import Toast from 'react-native-toast-message';
import { stylesmainMenu } from 'src/styles/mainMenu';
import { ScreenNavigationProp } from 'src/types/navigation';

export const MainMenuScreen = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const [hasUpdate, setHasUpdate] = useState(false);

  const menuItems = [
    {
      id: 'dailyEntry',
      title: 'Entrada Diaria',
      description: 'Registra y gestiona entradas diarias',
      icon: 'checklist',
      color: '#4CAF50',
      route: 'DailyEntry',
    },
    {
      id: 'driveFiles',
      title: 'Administrador de Documentos',
      description: 'Gestiona tus archivos',
      icon: 'folder',
      color: '#05aaca',
      route: 'DriveFiles',
    },
    {
      id: 'export',
      title: 'Exportar Datos',
      description: 'Exporta los datos registrados',
      icon: 'file-download',
      color: '#FF9800',
      route: 'Export',
    },
    {
      id: 'studentList',
      title: 'Lista de Estudiantes',
      description: 'Administra la lista de estudiantes',
      icon: 'people',
      color: '#2196F3',
      route: 'StudentList',
    }
  ];

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        setHasUpdate(update.isAvailable);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleMenuItemPress = (route: string) => {

    switch (route) {
      case'DailyEntry':
        navigation.navigate('DailyEntry');
        break;

      case'DriveFiles':
        navigation.navigate('DriveFiles');
        break;

      case'Export':
        navigation.navigate('Export');
        break;

      case'StudentList':
        navigation.navigate('StudentList');
        break;

      default:
        break;
    };
  };

  return (
    <View style={stylesmainMenu.container}>
      {/* Header */}
      <View style={stylesmainMenu.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={stylesmainMenu.logo}
        />
        <View style={stylesmainMenu.headerText}>
          <View style={stylesmainMenu.nameVersion}>
            <Text style={stylesmainMenu.appName}>Wen Scrap Confort</Text>
            <Text style={stylesmainMenu.appVersion}>Versión 1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Menu Grid */}
      <ScrollView style={stylesmainMenu.menuContainer}>
        <View style={stylesmainMenu.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={stylesmainMenu.menuCard}
              onPress={() => handleMenuItemPress(item.route)}
              activeOpacity={0.7}
            >
              <View style={[stylesmainMenu.iconContainer, { backgroundColor: item.color }]}>
                <Icon name={item.icon} size={32} color="#fff" />
              </View>
              <Text style={stylesmainMenu.menuTitle}>{item.title}</Text>
              <Text style={stylesmainMenu.menuDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={stylesmainMenu.footer}>
        <Text style={stylesmainMenu.footerText}>
          © 2026 WSC Wen Scrap Confort - Todos los derechos reservados
        </Text>
      </View>
  
      <Toast />
    </View>
  );
};