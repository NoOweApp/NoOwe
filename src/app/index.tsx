import React, { useState } from "react";
import { View } from "react-native";
import { Text, TextInput, Button, Menu } from "react-native-paper";

export default function HomeLogin() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const selectPayment = (value: string) => {
    setPaymentMethod(value);
    closeMenu();
  };

  const handleLogin = () => {
    console.log({
      firstName,
      lastName,
      paymentMethod,
    });
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 28, textAlign: "center", marginBottom: 20 }}>
        Login
      </Text>

      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={{ marginBottom: 12 }}
      />

      <TextInput
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={{ marginBottom: 12 }}
      />

      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        anchor={
          <TextInput
            label="Payment Method"
            value={paymentMethod}
            editable={false}
            onPressIn={openMenu}
            right={<TextInput.Icon icon="menu-down" onPress={openMenu} />}
            style={{ marginBottom: 20 }}
          />
        }
      >
        <Menu.Item onPress={() => selectPayment("Venmo")} title="Venmo" />
        <Menu.Item onPress={() => selectPayment("PayPal")} title="PayPal" />
        <Menu.Item onPress={() => selectPayment("Zelle")} title="Zelle" />
        <Menu.Item onPress={() => selectPayment("Cash App")} title="Cash App" />
      </Menu>

      <Button mode="contained" onPress={handleLogin}>
        Submit
      </Button>
    </View>
  );
}