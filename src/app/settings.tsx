import { useAppTheme } from "@/src/context/ThemeContext";
import { Directory, File, Paths } from "expo-file-system/next";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, Switch, View } from "react-native";
import {
  Button,
  Checkbox,
  Divider,
  HelperText,
  Menu,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PaymentMethod = {
  service: string;
  user: string;
};

type Profile = {
  first_name: string;
  last_name: string | null;
  payment_methods: PaymentMethod[];
};

const paymentOptions = [
  { label: "Venmo", value: "venmo" },
  { label: "PayPal", value: "paypal" },
  { label: "Zelle", value: "zelle" },
  { label: "Cash App", value: "cashapp" },
  { label: "Other", value: "other" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { mode, toggleMode } = useAppTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [paymentUsernames, setPaymentUsernames] = useState<Record<string, string>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialProfileString, setInitialProfileString] = useState("");
  const [loaded, setLoaded] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const getSettingsFile = () => {
    const nooweFolderPath = new Directory(Paths.document, "NoOwe");
    if (!nooweFolderPath.exists) nooweFolderPath.create();
    const settingsJson = new File(nooweFolderPath, "settings.json");
    if (!settingsJson.exists) {
      settingsJson.create();
      settingsJson.write(
        JSON.stringify({ first_name: "", last_name: null, payment_methods: [] })
      );
    }
    return settingsJson;
  };

  const buildProfileObject = (): Profile => ({
    first_name: firstName.trim(),
    last_name: lastName.trim().length === 0 ? null : lastName.trim(),
    payment_methods: selectedMethods.map((method) => ({
      service: method,
      user: (paymentUsernames[method] || "").trim(),
    })),
  });

  const validateProfile = () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (trimmedFirst.length < 2 || trimmedFirst.length > 25)
      throw new Error("First name must be between 2 and 25 characters.");
    if (trimmedLast.length > 0 && (trimmedLast.length < 2 || trimmedLast.length > 25))
      throw new Error("Last name must be between 2 and 25 characters when provided.");
    if (selectedMethods.length === 0)
      throw new Error("Please select at least one payment method.");
    for (let i = 0; i < selectedMethods.length; i++) {
      const method = selectedMethods[i];
      const username = (paymentUsernames[method] || "").trim();
      if (method === "zelle") {
        const phone = username.replace(/\D/g, "");
        if (phone.length < 10 || phone.length > 11)
          throw new Error("Zelle must be a valid phone number.");
      }
      if (username.length === 0)
        throw new Error("Each selected payment method must have a username.");
      if (username.length > 40)
        throw new Error("Payment usernames must be 40 characters or fewer.");
    }
  };

  const loadSettings = useCallback(() => {
    try {
      setError(null);
      const settingsJson = getSettingsFile();
      const rawText = settingsJson.textSync();
      let parsed: Profile = { first_name: "", last_name: null, payment_methods: [] };
      if (rawText && rawText.trim().length > 0) parsed = JSON.parse(rawText);
      const loadedFirstName = typeof parsed.first_name === "string" ? parsed.first_name : "";
      const loadedLastName = typeof parsed.last_name === "string" ? parsed.last_name : "";
      const loadedPayments = Array.isArray(parsed.payment_methods) ? parsed.payment_methods : [];
      const loadedSelectedMethods: string[] = [];
      const loadedPaymentUsernames: Record<string, string> = {};
      for (let i = 0; i < loadedPayments.length; i++) {
        const payment = loadedPayments[i];
        if (payment && typeof payment.service === "string" && typeof payment.user === "string") {
          loadedSelectedMethods.push(payment.service);
          loadedPaymentUsernames[payment.service] = payment.user;
        }
      }
      setFirstName(loadedFirstName);
      setLastName(loadedLastName);
      setSelectedMethods(loadedSelectedMethods);
      setPaymentUsernames(loadedPaymentUsernames);
      const profileString = JSON.stringify({
        first_name: loadedFirstName.trim(),
        last_name: loadedLastName.trim().length === 0 ? null : loadedLastName.trim(),
        payment_methods: loadedSelectedMethods.map((method) => ({
          service: method,
          user: (loadedPaymentUsernames[method] || "").trim(),
        })),
      }, null, 2);
      setInitialProfileString(profileString);
      setLoaded(true);
    } catch (e: any) {
      setError(e.message || "Failed to load settings.");
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadSettings(); }, [loadSettings]));

  const togglePayment = (value: string) => {
    setSelectedMethods((prev) => {
      if (prev.includes(value)) {
        const updated = prev.filter((method) => method !== value);
        setPaymentUsernames((usernames) => {
          const copy = { ...usernames };
          delete copy[value];
          return copy;
        });
        return updated;
      }
      return [...prev, value];
    });
  };

  const currentProfileString = useMemo(
    () => JSON.stringify(buildProfileObject(), null, 2),
    [firstName, lastName, selectedMethods, paymentUsernames]
  );

  const hasUnsavedChanges = loaded && currentProfileString !== initialProfileString;

  const saveGreyedOut = useMemo(() => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (trimmedFirst.length < 2 || trimmedFirst.length > 25) return true;
    if (trimmedLast.length > 0 && (trimmedLast.length < 2 || trimmedLast.length > 25)) return true;
    if (selectedMethods.length === 0) return true;
    for (let i = 0; i < selectedMethods.length; i++) {
      const method = selectedMethods[i];
      const username = (paymentUsernames[method] || "").trim();
      if (username.length === 0 || username.length > 40) return true;
    }
    if (!hasUnsavedChanges) return true;
    return false;
  }, [firstName, lastName, selectedMethods, paymentUsernames, hasUnsavedChanges]);

  const handleSave = () => {
    try {
      setError(null);
      validateProfile();
      const settingsJson = getSettingsFile();
      const profile = buildProfileObject();
      settingsJson.write(JSON.stringify(profile, null, 2));
      setInitialProfileString(JSON.stringify(profile, null, 2));
      Alert.alert("Success", "Your settings were updated successfully.", [
        { text: "OK", onPress: () => router.push("/dashboard") },
      ]);
    } catch (e: any) {
      setError(e.message || "Failed to save settings.");
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. If you leave now, they will be lost.",
        [
          { text: "Stay", style: "cancel" },
          { text: "Leave", style: "destructive", onPress: () => router.push("/dashboard") },
        ]
      );
      return;
    }
    router.push("/dashboard");
  };

  const initials =
    [firstName.charAt(0), lastName.charAt(0)]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Your Profile";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Profile avatar header */}
      <View
        style={{
          alignItems: "center",
          paddingTop: insets.top + 24,
          paddingBottom: 32,
          backgroundColor: theme.colors.surface,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          marginBottom: 28,
        }}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: theme.colors.primaryContainer,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 14,
            borderWidth: 3,
            borderColor: theme.colors.primary,
          }}
        >
          <Text style={{ fontSize: 30, fontWeight: "800", color: theme.colors.primary }}>
            {initials}
          </Text>
        </View>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
          {displayName}
        </Text>
        {hasUnsavedChanges && (
          <View
            style={{
              backgroundColor: theme.colors.errorContainer,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginTop: 10,
            }}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.error }}>
              Unsaved changes
            </Text>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 24 }}>
        {/* Profile section */}
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 10,
          }}
        >
          Profile
        </Text>
        <Divider style={{ marginBottom: 16 }} />

        <TextInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          style={{ marginBottom: 4 }}
        />
        <HelperText type="info" visible style={{ marginBottom: 10 }}>
          2 to 25 characters
        </HelperText>

        <TextInput
          label="Last Name (Optional)"
          value={lastName}
          onChangeText={setLastName}
          style={{ marginBottom: 4 }}
        />
        <HelperText type="info" visible style={{ marginBottom: 24 }}>
          Leave blank for null, otherwise 2 to 25 characters
        </HelperText>

        {/* Payment Methods section */}
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 10,
          }}
        >
          Payment Methods
        </Text>
        <Divider style={{ marginBottom: 16 }} />

        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <TextInput
              label="Payment Method"
              value={
                selectedMethods.length > 0
                  ? selectedMethods
                      .map((m) => paymentOptions.find((o) => o.value === m)?.label || m)
                      .join(", ")
                  : ""
              }
              editable={false}
              onPressIn={openMenu}
              right={<TextInput.Icon icon="menu-down" onPress={openMenu} />}
              style={{ marginBottom: 16 }}
            />
          }
        >
          {paymentOptions.map((method) => (
            <Menu.Item
              key={method.value}
              onPress={() => togglePayment(method.value)}
              title={method.label}
              leadingIcon={() => (
                <Checkbox
                  status={selectedMethods.includes(method.value) ? "checked" : "unchecked"}
                  onPress={() => togglePayment(method.value)}
                />
              )}
            />
          ))}
        </Menu>

        {selectedMethods.map((method) => {
          const label = paymentOptions.find((o) => o.value === method)?.label || method;
          return (
            <View key={method}>
              <TextInput
                label={method === "zelle" ? "Zelle Number" : `${label} Username`}
                value={paymentUsernames[method] || ""}
                onChangeText={(text) =>
                  setPaymentUsernames((prev) => ({ ...prev, [method]: text }))
                }
                style={{ marginBottom: 12 }}
              />
            </View>
          );
        })}

        {error && (
          <HelperText type="error" visible={!!error} style={{ marginBottom: 8 }}>
            {error}
          </HelperText>
        )}

        {/* Appearance section */}
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 10,
            marginTop: 28,
          }}
        >
          Appearance
        </Text>
        <Divider style={{ marginBottom: 16 }} />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 8,
          }}
        >
          <Text variant="bodyLarge" style={{ color: theme.colors.onBackground, fontWeight: "600" }}>
            {mode === "light" ? "Light Mode" : "Dark Mode"}
          </Text>
          <Switch
            value={mode === "light"}
            onValueChange={toggleMode}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primaryContainer }}
            thumbColor={mode === "light" ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        </View>

        {/* Actions */}
        <View style={{ marginTop: 28, gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              mode="outlined"
              onPress={handleBack}
              style={{ flex: 1 }}
            >
              Back
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={saveGreyedOut}
              style={{ flex: 1 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Save
            </Button>
          </View>

          <Divider style={{ marginVertical: 8 }} />

          <Button
            mode="outlined"
            textColor={theme.colors.error}
            onPress={() => {
              const folder = new Directory(Paths.document, "NoOwe");
              const file = new File(folder, "settings.json");
              if (file.exists) { file.delete(); console.log("settings.json deleted"); }
              if (folder.exists) { folder.delete(); console.log("NoOwe folder deleted"); }
              router.replace("/");
            }}
          >
            Reset App
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
