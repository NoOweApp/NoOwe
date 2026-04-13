import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Text } from "react-native-paper";

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
  const [createBillModalVisible, setCreateBillModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // hard coded bills, will update later
  let bills: Bill[] = [
    {
      id: "1",
      dateUploaded: "2026-04-10",
      description: "Dinner at Turning Point With the Big Kirk",
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
      }}
    >
      <Text style={{ fontSize: 28, marginBottom: 20 }}>Dashboard</Text>

      <Text style={{ fontSize: 20, marginBottom: 10 }}>All Bills</Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          height: 300,
          marginBottom: 20,
        }}
      >
        {bills.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text>Time to start picking up some checks!</Text>
          </View>
        ) : (
          <ScrollView>
            {bills.map((bill) => (
              <TouchableOpacity
                key={bill.id}
                onPress={() => openBillModal(bill)}
                style={{
                  borderWidth: 1,
                  borderColor: "#aaa",
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text>Date Uploaded: {bill.dateUploaded}</Text>
                <Text>Description: {bill.description}</Text>
                <Text>
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

      <Button mode="outlined" onPress={() => console.log("Settings pressed")}>
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
              backgroundColor: "white",
              padding: 20,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 20, marginBottom: 20 }}>Create Bill</Text>

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
              backgroundColor: "white",
              padding: 20,
              borderRadius: 8,
            }}
          >
            {selectedBill && (
              <>
                <Text style={{ fontSize: 20, marginBottom: 12 }}>
                  Bill Details
                </Text>
                <Text>Date Uploaded: {selectedBill.dateUploaded}</Text>
                <Text>Description: {selectedBill.description}</Text>
                <Text>
                  Total Amount Paid: ${selectedBill.totalAmountPaid.toFixed(2)}
                </Text>
                <Text>
                  Number of People Involved: {selectedBill.people.length}
                </Text>

                <Text style={{ marginTop: 12, marginBottom: 8 }}>
                  Specific People Involved:
                </Text>

                {selectedBill.people.map((person, index) => (
                  <View key={index} style={{ marginBottom: 6 }}>
                    <Text>Name: {person.name ? person.name : "N/A"}</Text>
                    <Text>Phone Number: {person.phone}</Text>
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
