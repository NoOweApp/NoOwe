import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View } from "react-native";

const Stack = createNativeStackNavigator();

function Placeholder({ name }: { name: string }) {
  return (
    <View>
      <Text>{name}</Text>
    </View>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Intro">
          {() => <Placeholder name="Intro Screen" />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
