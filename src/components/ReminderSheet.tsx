import { BottomSheet } from "@/src/components/BottomSheet";
import { SmsResult, useSmsReminder } from "@/src/hooks/useSmsReminder";
import { Directory, File, Paths } from "expo-file-system/next";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
  View,
} from "react-native";
import {
  Button,
  Checkbox,
  Divider,
  Icon,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PaymentMethod = {
  service: string;
  user: string;
};

type Person = {
  name: string | null;
  phone: string;
  imageUri?: string;
  settled: boolean;
  oweAmount: number;
};

type Bill = {
  description: string;
  totalAmountPaid: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  bill: Bill | null;
  selectedPeople: Person[];
};

const SERVICE_LABELS: Record<string, string> = {
  venmo: "Venmo",
  paypal: "PayPal",
  zelle: "Zelle",
  cashapp: "Cash App",
  other: "Other",
};

function buildDefaultMessage(billDescription: string): string {
  return 'Hey! Just a reminder that you still owe ${oweAmount} for "' + billDescription + '". Let me know when you\'ve settled up! 🙏';
}

function loadPaymentMethodsFromDisk(): PaymentMethod[] {
  try {
    const folder = new Directory(Paths.document, "NoOwe");
    const file = new File(folder, "settings.json");
    if (!file.exists) return [];
    const raw = file.textSync();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.payment_methods) ? parsed.payment_methods : [];
  } catch {
    return [];
  }
}

function PersonAvatar({
  imageUri,
  name,
  size,
  bgColor,
  textColor,
}: {
  imageUri?: string;
  name: string | null;
  size: number;
  bgColor: string;
  textColor: string;
}) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const initial = name ? name[0].toUpperCase() : "?";
  const fontSize = Math.round(size * 0.38);
  const showImage = !!imageUri && !imgFailed;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: bgColor,
      }}
    >
      {showImage ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, position: "absolute", top: 0, left: 0 }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Text style={{ color: textColor, fontWeight: "700", fontSize }}>{initial}</Text>
      )}
    </View>
  );
}

type SheetScreen = "compose" | "sending" | "results";

export function ReminderSheet({ visible, onClose, bill, selectedPeople }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { sendReminders } = useSmsReminder();

  const [screen, setScreen] = useState<SheetScreen>("compose");
  const [message, setMessage] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ index: number; total: number; name: string }>({
    index: 0,
    total: 0,
    name: "",
  });
  const [results, setResults] = useState<SmsResult[]>([]);

  // Tracks which unsettled people the user wants to remind.
  // Defaults to ALL unsettled on open — user can deselect individuals.
  const [selectedRecipients, setSelectedRecipients] = useState<Person[]>([]);

  const unsettledPeople = selectedPeople.filter((p) => !p.settled);
  const settledPeople = selectedPeople.filter((p) => p.settled);

  useEffect(() => {
    if (visible && bill) {
      setScreen("compose");
      setMessage(buildDefaultMessage(bill.description));
      setSelectedServices(new Set());
      setResults([]);
      setPaymentMethods(loadPaymentMethodsFromDisk());
      // Pre-select all unsettled people by default
      setSelectedRecipients(unsettledPeople);
    }
  }, [visible]);

  const toggleRecipient = (person: Person) => {
    // Settled people cannot be toggled
    if (person.settled) return;
    setSelectedRecipients((prev) =>
      prev.includes(person)
        ? prev.filter((p) => p !== person)
        : [...prev, person]
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(service) ? next.delete(service) : next.add(service);
      return next;
    });
  };

  const handleSend = async () => {
    if (!bill || selectedRecipients.length === 0) return;
    setScreen("sending");

    const chosenMethods = paymentMethods.filter((pm) => selectedServices.has(pm.service));

    await sendReminders({
      people: selectedRecipients,
      billDescription: bill.description,
      messageBody: message,
      selectedPaymentMethods: chosenMethods,
      onProgress: (index, total, person) => {
        setProgress({ index, total, name: person.name ?? person.phone });
      },
      onComplete: (res) => {
        setResults(res);
        setScreen("results");
      },
    });
  };

  const canSend = selectedRecipients.length > 0 && message.trim().length > 0;

  // Render unsettled first (selectable), settled at the bottom (locked/greyed)
  const sortedPeople = [...unsettledPeople, ...settledPeople];

  return (
    <BottomSheet visible={visible} onClose={screen === "sending" ? () => {} : onClose}>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 12,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 28,
          maxHeight: "92%",
        }}
      >
        {/* Drag handle */}
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.outlineVariant,
            alignSelf: "center",
            marginBottom: 22,
          }}
        />

        {/* ─── COMPOSE ─── */}
        {screen === "compose" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 4 }}
            >
              Send Reminders
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}
            >
              {selectedRecipients.length} of {unsettledPeople.length} selected
            </Text>

            {/* ── Selectable people list (matches manual.tsx item assignment style) ── */}
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textTransform: "uppercase",
                letterSpacing: 1.1,
                marginBottom: 10,
              }}
            >
              Recipients
            </Text>

            {sortedPeople.map((person, index) => {
              const isSelected = selectedRecipients.includes(person);
              const isSettled = person.settled;

              return (
                <Pressable
                  key={index}
                  onPress={() => toggleRecipient(person)}
                  disabled={isSettled}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isSettled
                      ? theme.colors.outlineVariant
                      : isSelected
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                    backgroundColor: isSettled
                      ? "transparent"
                      : isSelected
                      ? theme.colors.primaryContainer
                      : "transparent",
                    opacity: isSettled ? 0.38 : 1,
                  }}
                >
                  {/* Avatar */}
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      marginRight: 12,
                      overflow: "hidden",
                    }}
                  >
                    <PersonAvatar
                      imageUri={person.imageUri}
                      name={person.name}
                      size={38}
                      bgColor={
                        isSettled
                          ? theme.colors.surfaceVariant
                          : isSelected
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant
                      }
                      textColor={
                        isSelected && !isSettled
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                  </View>

                  {/* Name + phone */}
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                    >
                      {person.name ?? "No Name"}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {isSettled ? "Settled up ✓" : person.phone}
                    </Text>
                  </View>

                  {/* Checkmark — only for selected unsettled */}
                  {isSelected && !isSettled && (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: theme.colors.primary,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.onPrimary,
                          fontSize: 13,
                          fontWeight: "800",
                          lineHeight: 16,
                        }}
                      >
                        ✓
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            <Divider style={{ marginTop: 4, marginBottom: 20 }} />

            {/* Message editor */}
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textTransform: "uppercase",
                letterSpacing: 1.1,
                marginBottom: 10,
              }}
            >
              Message
            </Text>
            <RNTextInput
              value={message}
              onChangeText={setMessage}
              multiline
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 12,
                padding: 14,
                color: theme.colors.onSurface,
                minHeight: 110,
                textAlignVertical: "top",
                marginBottom: 24,
                fontSize: 14,
                lineHeight: 21,
              }}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />

            {/* Payment method toggles */}
            {paymentMethods.length > 0 && (
              <>
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textTransform: "uppercase",
                    letterSpacing: 1.1,
                    marginBottom: 12,
                  }}
                >
                  Include Payment Links (optional)
                </Text>
                {paymentMethods.map((pm) => (
                  <Pressable
                    key={pm.service}
                    onPress={() => toggleService(pm.service)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Checkbox
                      status={selectedServices.has(pm.service) ? "checked" : "unchecked"}
                      onPress={() => toggleService(pm.service)}
                      color={theme.colors.primary}
                    />
                    <View style={{ marginLeft: 10 }}>
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                      >
                        {SERVICE_LABELS[pm.service] ?? pm.service}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {pm.user}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                <Divider style={{ marginVertical: 8, marginBottom: 20 }} />
              </>
            )}

            <Button
              mode="contained"
              onPress={handleSend}
              disabled={!canSend}
              contentStyle={{ paddingVertical: 4 }}
              style={{ marginBottom: 10 }}
            >
              Send {selectedRecipients.length} Reminder
              {selectedRecipients.length !== 1 ? "s" : ""}
            </Button>
            <Button onPress={onClose} textColor={theme.colors.onSurfaceVariant}>
              Cancel
            </Button>
          </ScrollView>
        )}

        {/* ─── SENDING ─── */}
        {screen === "sending" && (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, fontWeight: "700", marginTop: 24 }}
            >
              {progress.index + 1} of {progress.total}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
            >
              {progress.name}
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 16,
                textAlign: "center",
                opacity: 0.65,
                paddingHorizontal: 16,
              }}
            >
              Send or dismiss each message to continue to the next person.
            </Text>
          </View>
        )}

        {/* ─── RESULTS ─── */}
        {screen === "results" && (
          <>
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 20 }}
            >
              Done!
            </Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }} contentContainerStyle={{ paddingBottom: 14 }}>
              {results.map((r, i) => {
                const sent = r.result === "sent";
                return (
                  <View
                    key={i}
                    style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}
                  >
                    <Icon
                      source={sent ? "check-circle" : "close-circle"}
                      color={sent ? theme.colors.primary : theme.colors.error}
                      size={22}
                    />
                    <View style={{ marginLeft: 12 }}>
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                      >
                        {r.person.name ?? r.person.phone}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {r.result === "sent"
                          ? "Reminder sent"
                          : r.result === "cancelled"
                          ? "Skipped"
                          : "Failed to send"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <Button mode="contained" onPress={onClose} contentStyle={{ paddingVertical: 4 }}>
              Done
            </Button>
          </>
        )}
      </View>
    </BottomSheet>
  );
}