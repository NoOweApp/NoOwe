import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

// declaring types
type BillPerson = {
  name: string | null;
  phone: string;
};

type Bill = {
  id: string;
  dateUploaded: string;
  description: string;
  totalAmountPaid: number;
  people: BillPerson[];
};

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();

  const [createBillModalVisible, setCreateBillModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  let bills: Bill[] = [
    {
      id: "1",
      dateUploaded: "2026-04-10",
      description: "Dinner",
      totalAmountPaid: 64.82,
      people: [
        { name: "Owen", phone: "201-555-1111" },
        { name: "Adi", phone: "201-555-2222" },
        { name: null, phone: "201-555-3333" },
      ],
    },
    {
      id: "2",
      dateUploaded: "2026-04-08",
      description: "Bowling Night",
      totalAmountPaid: 91.5,
      people: [
        { name: "Owen", phone: "201-555-1111" },
        { name: "Jacob", phone: "201-555-4444" },
      ],
    },
  ];

  const openBillModal = (bill: Bill) => {
    setSelectedBill(bill);
  };

  const closeBillModal = () => {
    setSelectedBill(null);
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 40,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text style={{ fontSize: 28, marginBottom: 20, color: theme.colors.onBackground }}>
        Dashboard
      </Text>

      <Text style={{ fontSize: 20, marginBottom: 10, color: theme.colors.onBackground }}>
        All Bills
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.outline,
          padding: 10,
          height: 300,
          marginBottom: 20,
        }}
      >
        {bills.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: theme.colors.onSurface }}>
              Time to start picking up some checks!
            </Text>
          </View>
        ) : (
          <ScrollView>
            {bills.map((bill) => (
              <TouchableOpacity
                key={bill.id}
                onPress={() => openBillModal(bill)}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: theme.colors.onSurface }}>
                  Date Uploaded: {bill.dateUploaded}
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Description: {bill.description}
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Total Amount Paid: ${bill.totalAmountPaid.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Button
        mode="contained"
        onPress={() => setCreateBillModalVisible(true)}
        style={{ marginBottom: 10 }}
      >
        Create Bill
      </Button>

      <Button mode="outlined" onPress={() => router.push("/settings")}>
        Settings
      </Button>

      <Modal
        visible={createBillModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateBillModalVisible(false)}
      >
        <Pressable
          onPress={() => setCreateBillModalVisible(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              width: "80%",
              backgroundColor: theme.colors.surface,
              padding: 20,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 20, marginBottom: 20, color: theme.colors.onSurface }}>
              Create Bill
            </Text>

            <Button
              mode="contained"
              onPress={() => console.log("Scan Bill pressed")}
              style={{ marginBottom: 10 }}
            >
              Scan Bill
            </Button>

            <Button
              mode="contained"
              onPress={() => console.log("Enter Bill Manually pressed")}
              style={{ marginBottom: 10 }}
            >
              Enter Bill Manually
            </Button>

            <Button onPress={() => setCreateBillModalVisible(false)}>
              Close
            </Button>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={selectedBill !== null}
        transparent
        animationType="fade"
        onRequestClose={closeBillModal}
      >
        <Pressable
          onPress={closeBillModal}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              width: "85%",
              backgroundColor: theme.colors.surface,
              padding: 20,
              borderRadius: 8,
            }}
          >
            {selectedBill && (
              <>
                <Text style={{ fontSize: 20, marginBottom: 12, color: theme.colors.onSurface }}>
                  Bill Details
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Date Uploaded: {selectedBill.dateUploaded}
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Description: {selectedBill.description}
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Total Amount Paid: ${selectedBill.totalAmountPaid.toFixed(2)}
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Number of People Involved: {selectedBill.people.length}
                </Text>

                <Text style={{ marginTop: 12, marginBottom: 8, color: theme.colors.onSurface }}>
                  Specific People Involved:
                </Text>

                {selectedBill.people.map((person, index) => (
                  <View key={index} style={{ marginBottom: 6 }}>
                    <Text style={{ color: theme.colors.onSurface }}>
                      Name: {person.name ? person.name : "N/A"}
                    </Text>
                    <Text style={{ color: theme.colors.onSurface }}>
                      Phone Number: {person.phone}
                    </Text>
                  </View>
                ))}

                <Button
                  mode="contained"
                  onPress={() => console.log("Delete bill pressed")}
                  style={{ marginTop: 12, marginBottom: 8 }}
                >
                  Delete Bill
                </Button>

                <Button
                  mode="contained"
                  onPress={() => console.log("Send reminder pressed")}
                  style={{ marginBottom: 8 }}
                >
                  Send Reminder
                </Button>

                <Button onPress={closeBillModal}>Close</Button>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}