import * as FileSystem from "expo-file-system";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentService = "venmo" | "zelle" | "cashapp" | "paypal" | "other";

interface PaymentMethod {
  service: PaymentService;
  user: string;
}

const PAYMENT_OPTIONS: {
  service: PaymentService;
  label: string;
  color: string;
}[] = [
  { service: "venmo", label: "Venmo", color: "#00C4FF" },
  { service: "zelle", label: "Zelle", color: "#6D1ED4" },
  { service: "cashapp", label: "Cash App", color: "#00C244" },
  { service: "paypal", label: "PayPal", color: "#003087" },
  { service: "other", label: "Other", color: "#888780" },
];

// ─── Validation helpers ────────────────────────────────────────────────────────

function validateName(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return "Required";
  if (v.length < 2) return "At least 2 characters";
  if (v.length > 25) return "Max 25 characters";
  if (typeof v !== "string") return "Must be a string";
  return null;
}

function validateOptionalName(value: string): string | null {
  const v = value.trim();
  if (v.length === 0) return null; // optional — empty is fine
  if (v.length < 2) return "At least 2 characters";
  if (v.length > 25) return "Max 25 characters";
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignupScreen({ navigation }: any) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [payments, setPayments] = useState<PaymentMethod[]>([]);

  // Dropdown state
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [pendingService, setPendingService] = useState<PaymentService | null>(
    null,
  );
  const [pendingUsername, setPendingUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // Touched state for inline validation
  const [firstTouched, setFirstTouched] = useState(false);
  const [lastTouched, setLastTouched] = useState(false);

  const firstError = firstTouched ? validateName(firstName) : null;
  const lastError = lastTouched ? validateOptionalName(lastName) : null;
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = useMemo(() => {
    return (
      validateName(firstName) === null &&
      validateOptionalName(lastName) === null
    );
  }, [firstName, lastName]);

  // ── Payment helpers ──────────────────────────────────────────────────────────

  function openDropdown(service: PaymentService) {
    setPendingService(service);
    setPendingUsername("");
    setUsernameError("");
  }

  function confirmPayment() {
    if (!pendingService) return;
    const u = pendingUsername.trim();
    if (!u) {
      setUsernameError("Enter your username");
      return;
    }
    setPayments((prev) => [
      ...prev.filter((p) => p.service !== pendingService),
      { service: pendingService, user: u },
    ]);
    setPendingService(null);
    setPendingUsername("");
  }

  function removePayment(service: PaymentService) {
    setPayments((prev) => prev.filter((p) => p.service !== service));
  }

  // ── Submission ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!isFormValid) return;

    const settings = {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      payment_methods: payments,
    };

    try {
      const dir = `${FileSystem.Paths.document ?? ""}NoOwe/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }

      await FileSystem.writeAsStringAsync(
        `${dir}settings.json`,
        JSON.stringify(settings, null, 2),
      );

      Alert.alert("Account created!", "Your profile has been saved.", [
        { text: "Continue", onPress: () => navigation.navigate("dashboard") },
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not save your profile. Please try again.");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Set up your NoOwe profile</Text>

        {/* First name */}
        <View style={styles.field}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={[styles.input, firstError ? styles.inputError : null]}
            placeholder="Owen"
            placeholderTextColor="#AEACAA"
            value={firstName}
            onChangeText={setFirstName}
            onBlur={() => setFirstTouched(true)}
            maxLength={25}
            autoCorrect={false}
          />
          {firstError ? (
            <Text style={styles.errorText}>{firstError}</Text>
          ) : null}
        </View>

        {/* Last name */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Last name</Text>
            <Text style={styles.optionalBadge}>optional</Text>
          </View>
          <TextInput
            style={[styles.input, lastError ? styles.inputError : null]}
            placeholder="Ungaro"
            placeholderTextColor="#AEACAA"
            value={lastName}
            onChangeText={setLastName}
            onBlur={() => setLastTouched(true)}
            maxLength={25}
            autoCorrect={false}
          />
          {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
        </View>

        {/* Payment methods */}
        <View style={styles.field}>
          <Text style={styles.label}>Payment methods</Text>

          {/* Added payment tags */}
          {payments.length > 0 && (
            <View style={styles.tagsWrap}>
              {payments.map((pm) => {
                const opt = PAYMENT_OPTIONS.find(
                  (o) => o.service === pm.service,
                )!;
                return (
                  <TouchableOpacity
                    key={pm.service}
                    style={styles.tag}
                    onPress={() => removePayment(pm.service)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.tagDot, { backgroundColor: opt.color }]}
                    />
                    <Text style={styles.tagText}>
                      {opt.label} · {pm.user}
                    </Text>
                    <Text style={styles.tagRemove}>×</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Add button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setDropdownVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonPlus}>+</Text>
            <Text style={styles.addButtonText}>
              {payments.length === 0 ? "Add payment method" : "Add another"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.submitText,
              !isFormValid && styles.submitTextDisabled,
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => navigation.navigate("login")}>
          <Text style={styles.link}>
            Already have an account?{" "}
            <Text style={styles.linkAccent}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Service picker modal ─────────────────────────────────────────────── */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setDropdownVisible(false);
            setPendingService(null);
          }}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {pendingService ? "Enter username" : "Choose service"}
            </Text>

            {!pendingService ? (
              /* Service list */
              PAYMENT_OPTIONS.filter(
                (o) => !payments.find((p) => p.service === o.service),
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.service}
                  style={styles.serviceRow}
                  onPress={() => openDropdown(opt.service)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.serviceDot, { backgroundColor: opt.color }]}
                  />
                  <Text style={styles.serviceLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))
            ) : (
              /* Username input */
              <View>
                <Text style={styles.serviceHint}>
                  {
                    PAYMENT_OPTIONS.find((o) => o.service === pendingService)
                      ?.label
                  }{" "}
                  username
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    usernameError ? styles.inputError : null,
                    { marginBottom: 4 },
                  ]}
                  placeholder="@username"
                  placeholderTextColor="#AEACAA"
                  value={pendingUsername}
                  onChangeText={(v) => {
                    setPendingUsername(v);
                    setUsernameError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {usernameError ? (
                  <Text style={[styles.errorText, { marginBottom: 12 }]}>
                    {usernameError}
                  </Text>
                ) : (
                  <View style={{ height: 16 }} />
                )}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={confirmPayment}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: 12 }}
                  onPress={() => setPendingService(null)}
                >
                  <Text style={[styles.link, { textAlign: "center" }]}>
                    ← Back
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#2C2C2A",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#888780",
    textAlign: "center",
    marginBottom: 36,
  },
  field: { marginBottom: 18 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#5F5E5A",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  optionalBadge: {
    fontSize: 11,
    color: "#AEACAA",
    marginLeft: 6,
    fontWeight: "400",
  },
  input: {
    borderWidth: 0.5,
    borderColor: "#D3D1C7",
    backgroundColor: "#F1EFE8",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    color: "#2C2C2A",
  },
  inputError: { borderColor: "#E24B4A" },
  errorText: { fontSize: 12, color: "#E24B4A", marginTop: 4 },

  // Tags
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#D3D1C7",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  tagDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  tagText: { fontSize: 13, color: "#2C2C2A" },
  tagRemove: { fontSize: 15, color: "#AEACAA", marginLeft: 6 },

  // Add button
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderStyle: "dashed",
    borderColor: "#B4B2A9",
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  addButtonPlus: {
    fontSize: 18,
    color: "#888780",
    marginRight: 8,
    lineHeight: 20,
  },
  addButtonText: { fontSize: 14, color: "#888780" },

  // Submit
  submitButton: {
    backgroundColor: "#7F77DD",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#F1EFE8",
    borderWidth: 0.5,
    borderColor: "#D3D1C7",
  },
  submitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  submitTextDisabled: { color: "#AEACAA" },

  // Footer link
  link: { fontSize: 14, color: "#888780", textAlign: "center" },
  linkAccent: { color: "#7F77DD", fontWeight: "500" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D3D1C7",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "500",
    color: "#2C2C2A",
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1EFE8",
  },
  serviceDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  serviceLabel: { fontSize: 15, color: "#2C2C2A" },
  serviceHint: { fontSize: 13, color: "#888780", marginBottom: 8 },
});
