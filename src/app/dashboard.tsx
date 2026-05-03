import { BottomSheet } from "@/src/components/BottomSheet";
import { ReminderSheet } from "@/src/components/ReminderSheet";
import { Directory, File, Paths } from "expo-file-system/next";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { Button, Divider, FAB, Icon, IconButton, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Person = {
  name: string | null;
  phone: string;
  imageUri?: string;
  settled: boolean;
};

type BillItem = {
  name: string;
  cost: number;
  owners: Person[];
};

type Bill = {
  id: string;
  dateUploaded: string;
  description: string;
  totalAmountPaid: number;
  people: Person[];
  items?: BillItem[];
};

type ReminderBill = {
  description: string;
  totalAmountPaid: number;
};

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
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center", backgroundColor: bgColor }}>
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

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [createBillModalVisible, setCreateBillModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);

  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);
  const [reminderPeople, setReminderPeople] = useState<Person[]>([]);
  const [reminderBill, setReminderBill] = useState<ReminderBill | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadBills = async () => {
        try {
          const folder = new Directory(Paths.document, "NoOwe");
          const billsFile = new File(folder, "bills.json");
          if (billsFile.exists) {
            const text = await billsFile.text();
            const parsed: Bill[] = JSON.parse(text);
            setBills([...parsed].reverse());
          } else {
            setBills([]);
          }
        } catch {
          setBills([]);
        }
      };
      loadBills();
    }, [])
  );

  const totalAmount = bills.reduce(
    (sum, b) =>
      sum +
      b.people
        .filter((_, i) => i !== 0 && !b.people[i].settled)
        .reduce((pSum, p) => pSum + (p.oweAmount ?? 0), 0),
    0
  );
  const openBillModal = (bill: Bill) => setSelectedBill(bill);
  const closeBillModal = () => setSelectedBill(null);

  const togglePersonSettled = (personIndex: number) => {
    if (!selectedBill) return;
    if (personIndex === 0) return; // owner cannot be toggled
    const updatedPeople = selectedBill.people.map((p, i) =>
      i === personIndex ? { ...p, settled: !p.settled } : p
    );
    const updatedBill = { ...selectedBill, people: updatedPeople };
    setSelectedBill(updatedBill);

    // Persist — bills are stored oldest-first (reversed for display)
    const updatedBills = bills.map((b) => (b.id === updatedBill.id ? updatedBill : b));
    setBills(updatedBills);
    try {
      const folder = new Directory(Paths.document, "NoOwe");
      const billsFile = new File(folder, "bills.json");
      billsFile.write(JSON.stringify([...updatedBills].reverse()));
    } catch (e) {
      console.error("Failed to persist settled state", e);
    }
  };

  const deleteBill = () => {
    if (!selectedBill) return;
    const updatedBills = bills.filter((b) => b.id !== selectedBill.id);
    setBills(updatedBills);
    try {
      const folder = new Directory(Paths.document, "NoOwe");
      const billsFile = new File(folder, "bills.json");
      billsFile.write(JSON.stringify([...updatedBills].reverse()));
    } catch (e) {
      console.error("Failed to delete bill", e);
    }
    closeBillModal();
  };

  const openReminderSheet = () => {
    // Only unsettled people get reminders
    const unsettledPeople = (selectedBill?.people ?? []).filter((p) => !p.settled);
    const bill: ReminderBill | null = selectedBill
      ? { description: selectedBill.description, totalAmountPaid: selectedBill.totalAmountPaid }
      : null;

    setReminderPeople(unsettledPeople);
    setReminderBill(bill);
    setSelectedBill(null);

    setTimeout(() => {
      setReminderSheetVisible(true);
    }, 320);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden" }}>
            <Image
              source={require("../assets/logo.png")}
              style={{ width: 32, height: 32 }}
              resizeMode="cover"
            />
          </View>
          <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: "800" }}>
            NoOwe
          </Text>
        </View>
        <IconButton
          icon="cog-outline"
          size={22}
          iconColor={theme.colors.onSurfaceVariant}
          onPress={() => router.push("/settings")}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        {bills.length > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.primaryContainer,
              borderRadius: 20,
              padding: 22,
              marginBottom: 28,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  opacity: 0.65,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 4,
                }}
              >
                Outstanding
              </Text>
              <Text variant="headlineLarge" style={{ color: "white", fontWeight: "800" }}>
                ${totalAmount.toFixed(2)}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onPrimaryContainer, opacity: 0.75, marginTop: 2 }}
              >
                across {bills.length} bill{bills.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "white",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon source="cash-multiple" color={theme.colors.primaryContainer} size={30} />
            </View>
          </View>
        )}

        {/* Section label */}
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 14,
          }}
        >
          Recent Bills
        </Text>

        {bills.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 64 }}>
            <Icon source="receipt-outline" color={theme.colors.onSurfaceVariant} size={52} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No bills yet
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                opacity: 0.55,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Tap + to start picking up some checks!
            </Text>
          </View>
        ) : (
          bills.map((bill) => {
            const billOutstanding = bill.people
              .filter((p, i) => i !== 0 && !p.settled)
              .reduce((sum, p) => sum + (p.oweAmount ?? 0), 0);
            return (
              <Pressable
                key={bill.id}
                onPress={() => openBillModal(bill)}
                style={{ marginBottom: 12 }}
              >
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 16,
                    flexDirection: "row",
                    overflow: "hidden",
                  }}
                >
                  <View style={{ width: 4, backgroundColor: theme.colors.primary }} />
                  <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 16 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text
                        variant="titleMedium"
                        style={{ color: theme.colors.onSurface, fontWeight: "700", flex: 1, marginRight: 8 }}
                      >
                        {bill.description}
                      </Text>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          variant="titleMedium"
                          style={{ color: theme.colors.primary, fontWeight: "800" }}
                        >
                          ${bill.totalAmountPaid.toFixed(2)}
                        </Text>
                        {billOutstanding > 0 ? (
                          <Text style={{ color: theme.colors.error, fontWeight: "600", marginTop: 2, fontSize: 11 }}>
                            ${billOutstanding.toFixed(2)} owed
                          </Text>
                        ) : (
                          <Text variant="bodySmall" style={{ color: theme.colors.primary, fontWeight: "600", marginTop: 2 }}>
                            Settled ✓
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
                    >
                      {bill.dateUploaded} · {bill.people.length}{" "}
                      {bill.people.length === 1 ? "person" : "people"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <FAB
        icon="plus"
        onPress={() => setCreateBillModalVisible(true)}
        style={{ position: "absolute", bottom: insets.bottom + 24, right: 20 }}
      />

      {/* Create Bill — bottom sheet */}
      <BottomSheet
        visible={createBillModalVisible}
        onClose={() => setCreateBillModalVisible(false)}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 28,
          }}
        >
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
          <Text
            variant="titleLarge"
            style={{ color: theme.colors.onSurface, fontWeight: "700", marginBottom: 20 }}
          >
            New Bill
          </Text>

          <Pressable
            onPress={() => {
              setCreateBillModalVisible(false);
              router.push("/scan");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 16,
              padding: 18,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: theme.colors.primaryContainer,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <Icon source="camera-outline" color="white" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                Scan Bill
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Point your camera at a receipt
              </Text>
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 20 }}>›</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setCreateBillModalVisible(false);
              router.push("/manual");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 16,
              padding: 18,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: theme.colors.primaryContainer,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <Icon source="pencil-outline" color="white" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                Enter Manually
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Type in items and amounts yourself
              </Text>
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 20 }}>›</Text>
          </Pressable>

          <Button
            onPress={() => setCreateBillModalVisible(false)}
            textColor={theme.colors.onSurfaceVariant}
          >
            Cancel
          </Button>
        </View>
      </BottomSheet>

      {/* Bill Details — bottom sheet */}
      <BottomSheet visible={selectedBill !== null} onClose={closeBillModal}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 28,
          }}
        >
          {selectedBill && (() => {
            const unsettledCount = selectedBill.people.filter((p) => !p.settled).length;
            // Preserve original order
            const sortedPeople = selectedBill.people;
            return (
              <>
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

                {/* Title + amount */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 4,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      variant="headlineSmall"
                      style={{ color: theme.colors.onSurface, fontWeight: "700" }}
                    >
                      {selectedBill.description}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                    >
                      {selectedBill.dateUploaded}
                    </Text>
                  </View>
                  <Text
                    variant="headlineMedium"
                    style={{ color: theme.colors.primary, fontWeight: "800" }}
                  >
                    ${selectedBill.totalAmountPaid.toFixed(2)}
                  </Text>
                </View>

                <Divider style={{ marginVertical: 18 }} />

                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    marginBottom: 14,
                  }}
                >
                  People ({selectedBill.people.length})
                </Text>

                {/* People rows — tappable to toggle settled */}
                <ScrollView style={{ maxHeight: 240, marginBottom: 24 }} showsVerticalScrollIndicator={false}>
                  {sortedPeople.map((person, sortedIndex) => {
                    // Map back to original index for toggling
                    const originalIndex = selectedBill.people.indexOf(person);
                    const isOwner = originalIndex === 0;
                    return (
                      <Pressable
                        key={sortedIndex}
                        onPress={() => togglePersonSettled(originalIndex)}
                        disabled={isOwner}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          marginBottom: 8,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isOwner ? "transparent" : (!person.settled ? theme.colors.primary : theme.colors.outlineVariant),
                          backgroundColor: !person.settled && !isOwner
                            ? theme.colors.primaryContainer
                            : "transparent",
                        }}
                      >
                        <View style={{ width: 42, height: 42, borderRadius: 21, overflow: "hidden", marginRight: 14 }}>
                          <PersonAvatar
                            imageUri={person.imageUri}
                            name={person.name}
                            size={42}
                            bgColor={!person.settled && !isOwner ? theme.colors.primary : theme.colors.primaryContainer}
                            textColor={!person.settled && !isOwner ? theme.colors.onPrimary : theme.colors.primary}
                          />
                        </View>

                        {/* Name + status */}
                        <View style={{ flex: 1 }}>
                          <Text
                            variant="bodyMedium"
                            style={{
                              color: person.settled ? theme.colors.outline : theme.colors.onPrimaryContainer,
                              fontWeight: "600",
                              textDecorationLine: person.settled ? "line-through" : "none",
                            }}
                          >
                            {person.name ?? "Unknown"}
                            {isOwner ? "  (you)" : ""}
                          </Text>
                          <Text variant="bodySmall" style={{ color: person.settled ? theme.colors.outline : theme.colors.onPrimaryContainer }}>
                            {person.settled ? "Settled ✓" : `Owes $${person.oweAmount?.toFixed(2) ?? "—"}`}
                          </Text>
                        </View>


                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Button disabled and shows count of who will receive reminders */}
                <Button
                  mode="contained"
                  onPress={openReminderSheet}
                  disabled={unsettledCount === 0}
                  style={{ marginBottom: 10 }}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  {unsettledCount === 0
                    ? "Everyone Settled Up 🎉"
                    : `Send Reminder${unsettledCount !== 1 ? "s" : ""} (${unsettledCount})`}
                </Button>
                <Button
                  mode="outlined"
                  textColor={theme.colors.error}
                  onPress={deleteBill}
                >
                  Delete Bill
                </Button>
              </>
            );
          })()}
        </View>
      </BottomSheet>

      {/* Reminder sheet — opened after bill details sheet is fully closed */}
      <ReminderSheet
        visible={reminderSheetVisible}
        onClose={() => setReminderSheetVisible(false)}
        bill={reminderBill}
        selectedPeople={reminderPeople}
      />
    </View>
  );
}