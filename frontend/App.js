import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AboutScreen from './src/screens/AboutScreen';
import DeveloperScreen from './src/screens/DeveloperScreen';
import FabricAnalyzerInputScreen from './src/screens/FabricAnalyzerInputScreen';
import FabricAnalyzerResultScreen from './src/screens/FabricAnalyzerResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import InputScreen from './src/screens/InputScreen';
import LandingScreen from './src/screens/LandingScreen';
import ResultScreen from './src/screens/ResultScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Input"
            component={InputScreen}
            options={{ title: 'New Cost Sheet' }}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ title: 'Cost Breakdown' }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: 'Calculation History' }}
          />
          <Stack.Screen
            name="FabricAnalyzerInput"
            component={FabricAnalyzerInputScreen}
            options={{ title: 'Fabric Analyzer' }}
          />
          <Stack.Screen
            name="FabricAnalyzerResult"
            component={FabricAnalyzerResultScreen}
            options={{ title: 'Analysis Results' }}
          />
          <Stack.Screen
            name="Developer"
            component={DeveloperScreen}
            options={{ title: 'Developer Info' }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ title: 'About MerchMate' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

