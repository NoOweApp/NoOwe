import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/src/context/ThemeContext";
import { Directory, File, Paths } from "expo-file-system/next";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  HelperText,
  Icon,
  IconButton,
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

// Services that live in the picker. Anything stored outside this set is a
// user-entered "Other" service, keyed by its custom name.
const KNOWN_SERVICES = ["venmo", "paypal", "zelle", "cashapp"];

type ServiceMeta = {
  label: string;
  color: string;
  icon: string;
  brand: boolean; // true → render via FontAwesome5 brand glyph
};

// Brand-colored avatar treatment per service. PayPal uses its real logo;
// the others use a representative glyph on the brand color for instant
// recognition without shipping fake/placeholder logos.
const SERVICE_META: Record<string, ServiceMeta> = {
  venmo: { label: "Venmo", color: "#3D95CE", icon: "at", brand: false },
  paypal: { label: "PayPal", color: "#003087", icon: "paypal", brand: true },
  zelle: { label: "Zelle", color: "#6D1ED4", icon: "lightning-bolt", brand: false },
  cashapp: { label: "Cash App", color: "#00C244", icon: "currency-usd", brand: false },
  other: { label: "Other", color: "#5B6472", icon: "wallet-outline", brand: false },
};

const getServiceMeta = (value: string): ServiceMeta =>
  SERVICE_META[value] ?? {
    label: value,
    color: "#5B6472",
    icon: "wallet-outline",
    brand: false,
  };

const getServiceLabel = (value: string) => getServiceMeta(value).label;

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { mode, toggleMode } = useAppTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [paymentUsernames, setPaymentUsernames] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [initialProfileString, setInitialProfileString] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Add / edit payment method modal state
  const [methodDialogVisible, setMethodDialogVisible] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [draftService, setDraftService] = useState<string | null>(null);
  const [otherName, setOtherName] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  const getSettingsFile = () => {
    const nooweFolderPath = new Directory(Paths.document, "NoOwe");
    if (!nooweFolderPath.exists) nooweFolderPath.create();
    const settingsJson = new File(nooweFolderPath, "settings.json");
    if (!settingsJson.exists) {
      settingsJson.create();
      settingsJson.write(
        JSON.stringify({
          first_name: "",
          last_name: null,
          payment_methods: [],
        }),
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
    if (
      trimmedLast.length > 0 &&
      (trimmedLast.length < 2 || trimmedLast.length > 25)
    )
      throw new Error(
        "Last name must be between 2 and 25 characters when provided.",
      );
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

  // Validates a single method as entered in the add/edit modal, including the
  // custom "Other" service name. Mirrors the per-method rules in validateProfile.
  const getMethodDraftError = (
    service: string | null,
    username: string,
    otherNameValue: string,
  ): string | null => {
    if (!service) return "Choose a payment service.";
    if (service === "other") {
      const name = otherNameValue.trim();
      if (name.length < 2 || name.length > 25)
        return "Enter a service name (2 to 25 characters).";
      if (KNOWN_SERVICES.includes(name.toLowerCase()))
        return "Choose that service from the list above.";
      const clash = selectedMethods.some(
        (m) => m.toLowerCase() === name.toLowerCase() && m !== editingService,
      );
      if (clash) return "That service is already added.";
    }
    const trimmed = username.trim();
    if (trimmed.length === 0)
      return service === "zelle"
        ? "Enter your Zelle phone number."
        : "Enter your username.";
    if (service === "zelle") {
      const phone = trimmed.replace(/\D/g, "");
      if (phone.length < 10 || phone.length > 11)
        return "Zelle must be a valid phone number.";
    }
    if (trimmed.length > 40) return "Must be 40 characters or fewer.";
    return null;
  };

  const loadSettings = useCallback(() => {
    try {
      setError(null);
      const settingsJson = getSettingsFile();
      const rawText = settingsJson.textSync();
      let parsed: Profile = {
        first_name: "",
        last_name: null,
        payment_methods: [],
      };
      if (rawText && rawText.trim().length > 0) parsed = JSON.parse(rawText);
      const loadedFirstName =
        typeof parsed.first_name === "string" ? parsed.first_name : "";
      const loadedLastName =
        typeof parsed.last_name === "string" ? parsed.last_name : "";
      const loadedPayments = Array.isArray(parsed.payment_methods)
        ? parsed.payment_methods
        : [];
      const loadedSelectedMethods: string[] = [];
      const loadedPaymentUsernames: Record<string, string> = {};
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
      setFirstName(loadedFirstName);
      setLastName(loadedLastName);
      setSelectedMethods(loadedSelectedMethods);
      setPaymentUsernames(loadedPaymentUsernames);
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

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  const openAddMethod = () => {
    setEditingService(null);
    setDraftService(null);
    setOtherName("");
    setDraftUsername("");
    setDraftError(null);
    setMethodDialogVisible(true);
  };

  const openEditMethod = (service: string) => {
    const known = KNOWN_SERVICES.includes(service);
    setEditingService(service);
    setDraftService(known ? service : "other");
    setOtherName(known ? "" : service);
    setDraftUsername(paymentUsernames[service] || "");
    setDraftError(null);
    setMethodDialogVisible(true);
  };

  const commitMethod = () => {
    const validationError = getMethodDraftError(
      draftService,
      draftUsername,
      otherName,
    );
    if (validationError) {
      setDraftError(validationError);
      return;
    }
    const service =
      draftService === "other" ? otherName.trim() : (draftService as string);
    const value = draftUsername.trim();
    const previous = editingService;
    setSelectedMethods((list) => {
      const next =
        previous && previous !== service
          ? list.filter((m) => m !== previous)
          : list;
      return next.includes(service) ? next : [...next, service];
    });
    setPaymentUsernames((u) => {
      const copy = { ...u };
      if (previous && previous !== service) delete copy[previous];
      copy[service] = value;
      return copy;
    });
    setMethodDialogVisible(false);
  };

  const removeMethod = (service: string) => {
    Alert.alert(
      `Remove ${getServiceLabel(service)}?`,
      "This payment method will be removed from your profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setSelectedMethods((prev) => prev.filter((m) => m !== service));
            setPaymentUsernames((prev) => {
              const copy = { ...prev };
              delete copy[service];
              return copy;
            });
          },
        },
      ],
    );
  };

  // Picker options available when adding: known services not already added,
  // plus "Other" (always available for custom services).
  const availableServices = paymentOptions.filter(
    (o) => o.value === "other" || !selectedMethods.includes(o.value),
  );

  const currentProfileString = useMemo(
    () => JSON.stringify(buildProfileObject(), null, 2),
    [firstName, lastName, selectedMethods, paymentUsernames],
  );

  const hasUnsavedChanges =
    loaded && currentProfileString !== initialProfileString;

  const saveGreyedOut = useMemo(() => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (trimmedFirst.length < 2 || trimmedFirst.length > 25) return true;
    if (
      trimmedLast.length > 0 &&
      (trimmedLast.length < 2 || trimmedLast.length > 25)
    )
      return true;
    if (selectedMethods.length === 0) return true;
    for (let i = 0; i < selectedMethods.length; i++) {
      const method = selectedMethods[i];
      const username = (paymentUsernames[method] || "").trim();
      if (username.length === 0 || username.length > 40) return true;
    }
    if (!hasUnsavedChanges) return true;
    return false;
  }, [
    firstName,
    lastName,
    selectedMethods,
    paymentUsernames,
    hasUnsavedChanges,
  ]);

  const handleSave = () => {
    try {
      setError(null);
      validateProfile();
      const settingsJson = getSettingsFile();
      const profile = buildProfileObject();
      settingsJson.write(JSON.stringify(profile, null, 2));
      setInitialProfileString(JSON.stringify(profile, null, 2));
      Alert.alert("Success", "Your settings were updated successfully.", [
        { text: "OK", onPress: () => router.back() },
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
          { text: "Leave", style: "destructive", onPress: () => router.back() },
        ],
      );
      return;
    }
    router.back();
  };

  const handleReset = () => {
    Alert.alert(
      "Reset App?",
      "This permanently deletes your profile and all saved data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
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
            router.replace("/");
          },
        },
      ],
    );
  };

  const initials =
    [firstName.charAt(0), lastName.charAt(0)]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || "Your Profile";

  const methodDraftError = getMethodDraftError(
    draftService,
    draftUsername,
    otherName,
  );

  // Shared visual tokens for grouped "card" surfaces.
  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Text
      variant="labelSmall"
      style={{
        color: theme.colors.onSurfaceVariant,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );

  const ServiceAvatar = ({
    service,
    size = 44,
  }: {
    service: string;
    size?: number;
  }) => {
    const meta = getServiceMeta(service);
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 3,
          backgroundColor: meta.color,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {meta.brand ? (
          <FontAwesome5
            name={meta.icon as any}
            size={size * 0.5}
            color="#ffffff"
            brand
          />
        ) : (
          <MaterialCommunityIcons
            name={meta.icon as any}
            size={size * 0.55}
            color="#ffffff"
          />
        )}
      </View>
    );
  };

  // Selectable service row used inside the add-method modal. Tapping a
  // selected row again deselects it.
  const ServiceOptionRow = ({
    option,
  }: {
    option: { label: string; value: string };
  }) => {
    const selected = draftService === option.value;
    return (
      <Pressable
        onPress={() => {
          setDraftError(null);
          if (selected) {
            setDraftService(null);
            setDraftUsername("");
            if (option.value === "other") setOtherName("");
          } else {
            setDraftService(option.value);
          }
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          backgroundColor: selected
            ? theme.colors.primaryContainer
            : "transparent",
        }}
      >
        <ServiceAvatar service={option.value} size={40} />
        <Text
          variant="titleSmall"
          style={{
            flex: 1,
            marginLeft: 14,
            color: selected
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurface,
            fontWeight: "700",
          }}
        >
          {option.label}
        </Text>
        <Icon
          source={selected ? "check-circle" : "checkbox-blank-circle-outline"}
          size={24}
          color={selected ? theme.colors.primary : theme.colors.outline}
        />
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Fixed header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 8,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
        }}
      >
        <IconButton
          icon="arrow-left"
          size={22}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={handleBack}
        />
        <Text
          variant="titleLarge"
          style={{ color: theme.colors.onBackground, fontWeight: "700" }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile avatar header */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 24,
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
            <Text
              style={{
                fontSize: 30,
                fontWeight: "800",
                color: theme.colors.primary,
              }}
            >
              {initials}
            </Text>
          </View>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
          >
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

        <View style={{ paddingHorizontal: 20 }}>
          {/* Profile section */}
          <SectionLabel>Profile</SectionLabel>
          <View style={[cardStyle, { padding: 16, marginBottom: 28 }]}>
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={{ marginBottom: 2 }}
            />
            <HelperText type="info" visible style={{ marginBottom: 8 }}>
              2 to 25 characters
            </HelperText>

            <TextInput
              label="Last Name (Optional)"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={{ marginBottom: 2 }}
            />
            <HelperText type="info" visible>
              Optional · 2 to 25 characters
            </HelperText>
          </View>

          {/* Payment Methods section */}
          <SectionLabel>Payment Methods</SectionLabel>

          {selectedMethods.length === 0 ? (
            <View
              style={[
                cardStyle,
                {
                  paddingVertical: 32,
                  paddingHorizontal: 20,
                  alignItems: "center",
                  marginBottom: 14,
                },
              ]}
            >
              <Icon
                source="wallet-outline"
                color={theme.colors.onSurfaceVariant}
                size={40}
              />
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "700",
                  marginTop: 10,
                }}
              >
                No payment methods
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                Add at least one so people know how to pay you back.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginBottom: 14 }}>
              {selectedMethods.map((method) => (
                <View
                  key={method}
                  style={[
                    cardStyle,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingLeft: 14,
                      paddingRight: 4,
                    },
                  ]}
                >
                  <ServiceAvatar service={method} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text
                      variant="titleSmall"
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: "700",
                      }}
                    >
                      {getServiceLabel(method)}
                    </Text>
                    <Text
                      variant="bodySmall"
                      numberOfLines={1}
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginTop: 2,
                      }}
                    >
                      {(paymentUsernames[method] || "").trim() ||
                        "Tap edit to add details"}
                    </Text>
                  </View>
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    iconColor={theme.colors.onSurfaceVariant}
                    onPress={() => openEditMethod(method)}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => removeMethod(method)}
                  />
                </View>
              ))}
            </View>
          )}

          <Button
            mode="outlined"
            icon="plus"
            onPress={openAddMethod}
            contentStyle={{ paddingVertical: 4 }}
          >
            Add payment method
          </Button>

          {error && (
            <HelperText type="error" visible={!!error} style={{ marginTop: 8 }}>
              {error}
            </HelperText>
          )}

          {/* Appearance section */}
          <View style={{ marginTop: 28 }}>
            <SectionLabel>Appearance</SectionLabel>
          </View>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 16,
              padding: 4,
              marginBottom: 28,
            }}
          >
            {(
              [
                { key: "light", label: "Light", icon: "weather-sunny" },
                { key: "dark", label: "Dark", icon: "weather-night" },
              ] as const
            ).map((opt) => {
              const active = mode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    if (mode !== opt.key) toggleMode();
                  }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: active
                      ? theme.colors.primary
                      : "transparent",
                  }}
                >
                  <Icon
                    source={opt.icon}
                    size={18}
                    color={
                      active
                        ? theme.colors.onPrimary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    variant="labelLarge"
                    style={{
                      color: active
                        ? theme.colors.onPrimary
                        : theme.colors.onSurfaceVariant,
                      fontWeight: "700",
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Danger zone */}
          <SectionLabel>Danger Zone</SectionLabel>
          <Button
            mode="outlined"
            icon="delete-outline"
            textColor={theme.colors.error}
            style={{ borderColor: theme.colors.error }}
            onPress={handleReset}
          >
            Reset App
          </Button>
        </View>
      </ScrollView>

      {/* Sticky save bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
          backgroundColor: theme.colors.background,
        }}
      >
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={saveGreyedOut}
          contentStyle={{ paddingVertical: 5 }}
        >
          {hasUnsavedChanges ? "Save Changes" : "Saved"}
        </Button>
      </View>

      {/*
        Add / edit payment method modal. Uses the app's proven centered,
        keyboard-safe pattern (see the item modal in manual.tsx): a core RN
        Modal + a full-screen KeyboardAvoidingView whose centering backdrop
        keeps the card vertically centered and lifts it naturally when the
        keyboard opens — no bottom-anchoring, so it never squishes to the top.
      */}
      <Modal
        visible={methodDialogVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMethodDialogVisible(false)}
      >
        <View style={{ flex: 1 }}>
          {/*
            Persistent full-screen dim backdrop, kept OUTSIDE the
            KeyboardAvoidingView. When the dim lived inside the KAV, opening the
            keyboard shrank it and briefly exposed the bright screen behind the
            modal. As an absoluteFill sibling it always covers everything and is
            unaffected by keyboard layout. Tapping it dismisses the modal.
          */}
          <Pressable
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.backdrop },
            ]}
            onPress={() => setMethodDialogVisible(false)}
          />
          <KeyboardAvoidingView
            style={{
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 20,
            }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            pointerEvents="box-none"
          >
            {/* Inner Pressable swallows taps so the card itself never dismisses */}
            <Pressable onPress={() => {}} style={{ width: "100%" }}>
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 28,
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 20,
                    paddingLeft: 24,
                    paddingRight: 12,
                    paddingBottom: 4,
                  }}
                >
                <Text
                  variant="titleLarge"
                  style={{ color: theme.colors.onSurface, fontWeight: "700" }}
                >
                  {editingService ? "Edit method" : "Add payment method"}
                </Text>
                <IconButton
                  icon="close"
                  size={22}
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={() => setMethodDialogVisible(false)}
                  style={{ margin: 0 }}
                />
              </View>

              <ScrollView
                style={{ maxHeight: windowHeight * 0.5 }}
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingTop: 8,
                  paddingBottom: 24,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Known-service edit: read-only service identity */}
                {editingService && draftService !== "other" && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 18,
                      backgroundColor: theme.colors.surfaceVariant,
                      marginBottom: 24,
                    }}
                  >
                    <ServiceAvatar service={editingService} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="labelSmall"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        Service
                      </Text>
                      <Text
                        variant="titleMedium"
                        style={{
                          color: theme.colors.onSurface,
                          fontWeight: "700",
                        }}
                      >
                        {getServiceLabel(editingService)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Add mode: service picker */}
                {!editingService && (
                  <>
                    <SectionLabel>Choose a service</SectionLabel>
                    <View style={{ gap: 10, marginBottom: 24 }}>
                      {availableServices.map((option) => (
                        <ServiceOptionRow key={option.value} option={option} />
                      ))}
                    </View>
                  </>
                )}

                {/* Custom service name (Other) */}
                {draftService === "other" && (
                  <>
                    <SectionLabel>Service name</SectionLabel>
                    <TextInput
                      label="Service name"
                      mode="outlined"
                      value={otherName}
                      maxLength={25}
                      autoCapitalize="words"
                      placeholder="e.g. Chime, Wise, Cash"
                      onChangeText={(text) => {
                        setOtherName(text);
                        setDraftError(null);
                      }}
                    />
                    <HelperText type="info" visible>
                      The name of the app or service people will pay you on
                    </HelperText>
                  </>
                )}

                {/* Username / phone — revealed once a service is chosen */}
                {draftService && (
                  <>
                    <SectionLabel>
                      {draftService === "zelle" ? "Phone number" : "Username"}
                    </SectionLabel>
                    <TextInput
                      label={
                        draftService === "zelle"
                          ? "Zelle Phone Number"
                          : "Username"
                      }
                      mode="outlined"
                      value={draftUsername}
                      keyboardType={
                        draftService === "zelle" ? "phone-pad" : "default"
                      }
                      autoCapitalize="none"
                      onChangeText={(text) => {
                        setDraftUsername(text);
                        setDraftError(null);
                      }}
                    />
                    <HelperText type={draftError ? "error" : "info"} visible>
                      {draftError ||
                        (draftService === "zelle"
                          ? "10–11 digit phone number"
                          : "Up to 40 characters")}
                    </HelperText>
                  </>
                )}
              </ScrollView>

              {/* Footer — full-width primary action */}
              <View
                style={{
                  paddingHorizontal: 24,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.outlineVariant,
                }}
              >
                <Button
                  mode="contained"
                  onPress={commitMethod}
                  disabled={methodDraftError !== null}
                  contentStyle={{ paddingVertical: 6 }}
                >
                  {editingService ? "Save Changes" : "Add Method"}
                </Button>
              </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
