import { validateLogin } from "@/validation/helpers";
import { Directory, File, Paths } from "expo-file-system";
import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import {
  Button,
  Checkbox,
  HelperText,
  Menu,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const payment_options = ["Venmo", "PayPal", "Zelle", "Cash App"]; //all the payment methods we have

export default function HomeLogin() {
  const router = useRouter(); //router to navigate btwn pages
  const theme = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [selectedMethods, setSelectedMethods] = useState<string[]>([]); //initialized as an empty array of strings
  const [paymentUsernames, setPaymentUsernames] = useState<
    Record<string, string>
  >({}); //initialized as a dictionary where key and val are strings

  //The "menu" is just the dropdown for our payment options
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  //state to render errors
  const [error, setError] = useState<string | null>(null);

  const nooweFolderPath = new Directory(Paths.document, "NoOwe");
  const settingsJson = new File(nooweFolderPath, "settings.json");

  if (settingsJson.exists) {
    return <Redirect href="/dashboard" />;
  }

  //Logic for toggling and untoggling payment methods
  const togglePayment = (value: string) => {
    setSelectedMethods((prev) => {
      if (prev.includes(value)) {
        const updated = prev.filter((m) => m !== value);
        setPaymentUsernames((usernames) => {
          const copy = { ...usernames };
          delete copy[value];
          return copy;
        });
        return updated;
      } else {
        return [...prev, value];
      }
    });
  };

  //boolean to see if submit button should be greyed out
  const submitGreyedOut =
    firstName.trim().length === 0 ||
    selectedMethods.length === 0 ||
    selectedMethods.some(
      (m) => !paymentUsernames[m] || paymentUsernames[m].trim().length === 0,
    );

  const handleLogin = () => {
    setError(null);

    try {
      for (let i = 0; i < selectedMethods.length; i++) {
        const method = selectedMethods[i];
        const value = (paymentUsernames[method] || "").trim();

        if (method === "Zelle") {
          const phone = value.replace(/\D/g, "");

          if (phone.length < 10 || phone.length > 11) {
            throw new Error("Zelle must be a valid phone number.");
          }
        }
      }

      const paymentMethods = selectedMethods.map((method) => ({
        service: method.toLowerCase().trim(),
        user: paymentUsernames[method] || "",
      }));

      //creation of the JSON as outlined in the design document
      const profile = validateLogin(
        firstName,
        lastName.trim().length === 0 ? null : lastName,
        paymentMethods,
      );

      if (!nooweFolderPath.exists) {
        nooweFolderPath.create();
        console.log("Folder created"); //To ensure that it was made.
      }

      console.log("Folder check complete"); //to ensure that the check was made

      if (!settingsJson.exists) {
        settingsJson.create();
      }

      console.log(settingsJson.uri); //TESTING
      settingsJson.write(JSON.stringify(profile));

      console.log("Write complete");

      //after json is created, go to dashboard
      router.push("/dashboard");

      console.log(JSON.stringify(profile, null, 2));
    } catch (e: any) {
      setError(e.message);
    }
  };

  //rendered UI components
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          textAlign: "center",
          marginBottom: 20,
          color: theme.colors.onBackground,
        }}
      >
        Welcome to NoOwe!
      </Text>

      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={{ marginBottom: 12 }}
      />

      <TextInput
        label="Last Name (Optional)"
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
            value={selectedMethods.length > 0 ? selectedMethods.join(", ") : ""}
            editable={false}
            onPressIn={openMenu}
            right={<TextInput.Icon icon="menu-down" onPress={openMenu} />}
            style={{ marginBottom: 20 }}
          />
        }
      >
        {payment_options.map((method) => (
          <Menu.Item
            key={method}
            onPress={() => togglePayment(method)}
            title={method}
            leadingIcon={() => (
              <Checkbox
                status={
                  selectedMethods.includes(method) ? "checked" : "unchecked"
                }
                onPress={() => togglePayment(method)}
              />
            )}
          />
        ))}
      </Menu>

      {selectedMethods.map((method) => (
        <View key={method}>
          <TextInput
            label={method === "Zelle" ? "Zelle Number" : `${method} Username`}
            value={paymentUsernames[method] || ""}
            onChangeText={(text) =>
              setPaymentUsernames((prev) => ({ ...prev, [method]: text }))
            }
            keyboardType={method === "Zelle" ? "phone-pad" : "default"}
            style={{ marginBottom: 12 }}
          />
        </View>
      ))}

      {error && (
        <HelperText type="error" visible={!!error} style={{ marginBottom: 8 }}>
          {error}
        </HelperText>
      )}

      <Button mode="contained" onPress={handleLogin} disabled={submitGreyedOut}>
        Submit
      </Button>
    </View>
  );
}
