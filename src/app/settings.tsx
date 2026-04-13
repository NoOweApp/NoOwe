import { Directory, File, Paths } from "expo-file-system";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import {
  Button,
  Checkbox,
  HelperText,
  Menu,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

// simple shape for payment methods (keep it consistent everywhere pls)
type PaymentMethod = {
  service: string;
  user: string;
};

// whole profile object we store in settings.json
type Profile = {
  first_name: string;
  last_name: string | null;
  payment_methods: PaymentMethod[];
};

// dropdown options (value is what actually gets saved)
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

  // basic user info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // selected payment methods + their usernames/numbers
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [paymentUsernames, setPaymentUsernames] = useState<
    Record<string, string>
  >({});

  // dropdown visibility
  const [menuVisible, setMenuVisible] = useState(false);

  // error message (if user messes up)
  const [error, setError] = useState<string | null>(null);

  // used to detect unsaved changes (basically snapshot vs current)
  const [initialProfileString, setInitialProfileString] = useState("");
  const [loaded, setLoaded] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // makes sure folder + file exist (if not we spawn them into existence)
  const getSettingsFile = () => {
    const nooweFolderPath = new Directory(Paths.document, "NoOwe");

    if (!nooweFolderPath.exists) {
      nooweFolderPath.create(); // create folder if missing
    }

    const settingsJson = new File(nooweFolderPath, "settings.json");

    if (!settingsJson.exists) {
      settingsJson.create(); // create file if missing
      settingsJson.write(
        JSON.stringify({
          first_name: "",
          last_name: null,
          payment_methods: [],
        }),
      ); // starter template so nothing explodes later
    }

    return settingsJson;
  };

  // builds the object we actually save to disk
  const buildProfileObject = (): Profile => {
    return {
      first_name: firstName.trim(),
      last_name: lastName.trim().length === 0 ? null : lastName.trim(),
      payment_methods: selectedMethods.map((method) => ({
        service: method,
        user: (paymentUsernames[method] || "").trim(),
      })),
    };
  };

  // validates everything before saving (gatekeeper of truth)
  const validateProfile = () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    // first name rules
    if (trimmedFirst.length < 2 || trimmedFirst.length > 25) {
      throw new Error("First name must be between 2 and 25 characters.");
    }

    // last name rules (optional but still validated if present)
    if (
      trimmedLast.length > 0 &&
      (trimmedLast.length < 2 || trimmedLast.length > 25)
    ) {
      throw new Error(
        "Last name must be between 2 and 25 characters when provided.",
      );
    }

    // need at least one payment method or this app is kinda useless
    if (selectedMethods.length === 0) {
      throw new Error("Please select at least one payment method.");
    }

    // validate each selected method
    for (let i = 0; i < selectedMethods.length; i++) {
      const method = selectedMethods[i];
      const username = (paymentUsernames[method] || "").trim();

      // zelle gets special treatment (phone number check)
      if (method === "zelle") {
        const phone = username.replace(/\D/g, "");

        if (phone.length < 10 || phone.length > 11) {
          throw new Error("Zelle must be a valid phone number.");
        }
      }

      // general checks
      if (username.length === 0) {
        throw new Error("Each selected payment method must have a username.");
      }

      if (username.length > 40) {
        throw new Error("Payment usernames must be 40 characters or fewer.");
      }
    }
  };

  // loads settings from file and hydrates state
  const loadSettings = useCallback(() => {
    try {
      setError(null);

      const settingsJson = getSettingsFile();
      const rawText = settingsJson.textSync(); // grab file contents

      let parsed: Profile = {
        first_name: "",
        last_name: null,
        payment_methods: [],
      };

      // only parse if theres actually something there
      if (rawText && rawText.trim().length > 0) {
        parsed = JSON.parse(rawText);
      }

      // safe extraction (defensive coding so nothing crashes)
      const loadedFirstName =
        typeof parsed.first_name === "string" ? parsed.first_name : "";
      const loadedLastName =
        typeof parsed.last_name === "string" ? parsed.last_name : "";
      const loadedPayments = Array.isArray(parsed.payment_methods)
        ? parsed.payment_methods
        : [];

      const loadedSelectedMethods: string[] = [];
      const loadedPaymentUsernames: Record<string, string> = {};

      // rebuild state from saved data
      for (let i = 0; i < loadedPayments.length; i++) {
        const payment = loadedPayments[i];

        if (
          payment &&
          typeof payment.service === "string" &&
          typeof payment.user === "string"
        ) {
          loadedSelectedMethods.push(payment.service);
          loadedPaymentUsernames[payment.service] = payment.user;
        }
      }

      // push everything into state
      setFirstName(loadedFirstName);
      setLastName(loadedLastName);
      setSelectedMethods(loadedSelectedMethods);
      setPaymentUsernames(loadedPaymentUsernames);

      // snapshot for change detection later
      const profileString = JSON.stringify(
        {
          first_name: loadedFirstName.trim(),
          last_name:
            loadedLastName.trim().length === 0 ? null : loadedLastName.trim(),
          payment_methods: loadedSelectedMethods.map((method) => ({
            service: method,
            user: (loadedPaymentUsernames[method] || "").trim(),
          })),
        },
        null,
        2,
      );

      setInitialProfileString(profileString);
      setLoaded(true);
    } catch (e: any) {
      setError(e.message || "Failed to load settings.");
      setLoaded(true);
    }
  }, []);

  // reload settings whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  // toggles payment methods on/off (and cleans up usernames when removed)
  const togglePayment = (value: string) => {
    setSelectedMethods((prev) => {
      if (prev.includes(value)) {
        const updated = prev.filter((method) => method !== value);

        setPaymentUsernames((usernames) => {
          const copy = { ...usernames };
          delete copy[value]; // remove stale username
          return copy;
        });

        return updated;
      }

      return [...prev, value];
    });
  };

  // recompute profile as string for comparison (cheap diffing trick)
  const currentProfileString = useMemo(() => {
    return JSON.stringify(buildProfileObject(), null, 2);
  }, [firstName, lastName, selectedMethods, paymentUsernames]);

  // detects if user changed anything
  const hasUnsavedChanges =
    loaded && currentProfileString !== initialProfileString;

  // determines if save button should be disabled
  const saveGreyedOut = useMemo(() => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (trimmedFirst.length < 2 || trimmedFirst.length > 25) {
      return true;
    }

    if (
      trimmedLast.length > 0 &&
      (trimmedLast.length < 2 || trimmedLast.length > 25)
    ) {
      return true;
    }

    if (selectedMethods.length === 0) {
      return true;
    }

    for (let i = 0; i < selectedMethods.length; i++) {
      const method = selectedMethods[i];
      const username = (paymentUsernames[method] || "").trim();

      if (username.length === 0 || username.length > 40) {
        return true;
      }
    }

    // dont let them save if nothing changed (no-op save is cringe)
    if (!hasUnsavedChanges) {
      return true;
    }

    return false;
  }, [
    firstName,
    lastName,
    selectedMethods,
    paymentUsernames,
    hasUnsavedChanges,
  ]);

  // saves everything to disk
  const handleSave = () => {
    try {
      setError(null);
      validateProfile();

      const settingsJson = getSettingsFile();
      const profile = buildProfileObject();

      settingsJson.write(JSON.stringify(profile, null, 2));
      setInitialProfileString(JSON.stringify(profile, null, 2)); // update snapshot

      Alert.alert("Success", "Your settings were updated successfully.", [
        {
          text: "OK",
          onPress: () => router.push("/dashboard"),
        },
      ]);
    } catch (e: any) {
      setError(e.message || "Failed to save settings.");
    }
  };

  // back button logic (warn if unsaved changes)
  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. If you leave now, they will be lost.",
        [
          { text: "Stay", style: "cancel" },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => router.push("/dashboard"),
          },
        ],
      );
      return;
    }

    router.push("/dashboard");
  };

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
        Settings
      </Text>

      {/* user info */}
      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={{ marginBottom: 4 }}
      />
      <HelperText type="info" visible={true} style={{ marginBottom: 8 }}>
        2 to 25 characters
      </HelperText>

      <TextInput
        label="Last Name (Optional)"
        value={lastName}
        onChangeText={setLastName}
        style={{ marginBottom: 4 }}
      />
      <HelperText type="info" visible={true} style={{ marginBottom: 8 }}>
        Leave blank for null, otherwise 2 to 25 characters
      </HelperText>

      {/* payment dropdown */}
      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        anchor={
          <TextInput
            label="Payment Method"
            value={
              selectedMethods.length > 0
                ? selectedMethods
                    .map(
                      (method) =>
                        paymentOptions.find((option) => option.value === method)
                          ?.label || method,
                    )
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
                status={
                  selectedMethods.includes(method.value)
                    ? "checked"
                    : "unchecked"
                }
                onPress={() => togglePayment(method.value)}
              />
            )}
          />
        ))}
      </Menu>

      {/* dynamic inputs for each selected payment */}
      {selectedMethods.map((method) => {
        const label =
          paymentOptions.find((option) => option.value === method)?.label ||
          method;

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

      {/* error display */}
      {error && (
        <HelperText type="error" visible={!!error} style={{ marginBottom: 8 }}>
          {error}
        </HelperText>
      )}

      {/* save button */}
      <Button
        mode="contained"
        onPress={handleSave}
        disabled={saveGreyedOut}
        style={{ marginBottom: 10 }}
      >
        Save
      </Button>

      {/* nuclear reset button (bye data 👋) */}
      <Button
        mode="outlined"
        onPress={() => {
          const folder = new Directory(Paths.document, "NoOwe");
          const file = new File(folder, "settings.json");

          if (file.exists) {
            file.delete();
            console.log("settings.json deleted");
          }

          if (folder.exists) {
            folder.delete();
            console.log("NoOwe folder deleted");
          }

          router.replace("/"); //back to login
        }}
      >
        Reset App
      </Button>

      {/* go back (with safety check) */}
      <Button mode="outlined" onPress={handleBack}>
        Back
      </Button>
    </View>
  );
}
