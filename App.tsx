import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  MainMenuScreen, 
  DailyEntryScreen,
  DriveFilesScreen,
  ExportScreen,
} from './src/screens';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="MainMenu"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#white',
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            },
            headerTintColor: '#05aaca',
            headerTitleStyle: {
              fontWeight: 'bold',
            }
          }}
        >
          <Stack.Screen 
            name="MainMenu" 
            component={MainMenuScreen}
            options={{
              title: 'Inicio'
            }}
          />
          <Stack.Screen 
            name="DailyEntry" 
            component={DailyEntryScreen}
            options={{
              title: 'Entrada Diaria'
            }}
          />
          <Stack.Screen 
            name="DriveFiles" 
            component={DriveFilesScreen}
            options={{
              title: 'Administrador de Documentos'
            }}
          />
          <Stack.Screen 
            name="Export" 
            component={ExportScreen}
            options={{
              title: 'Exportar Datos'
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
);
}