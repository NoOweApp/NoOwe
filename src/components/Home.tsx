// Imports
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

// Temp data storage
import billsData from "../data/bills.json";
import settings from "../data/settings.json";

// Data organization
type PaymentMethod = {
  service: string;
  user: string;
};
type Settings = {
  first_name: string;
  last_name?: string | null;
  payment_methods: PaymentMethod[];
};
const userSettings = settings as Settings;

type ReceiptItem = {
  item_name: string;
  item_cost: number;
  owner: string;
};
type Bill = {
  receipt_id: string;
  receipt_date: string;
  receipt_items: ReceiptItem[];
  Tax: number;
  tip: number;
};
const userBills = billsData as Bill[];


function Home() {
  // Inst Vars
  const firstName = userSettings.first_name?.trim() || "User";
  const [createBillModalVisible, setCreateBillModalVisible] = useState(false);
  const bills = userBills ?? [];
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Nav placeholders
  const handleScanBill = () => {
    setCreateBillModalVisible(false);
    console.log("Navigate to 4. Scan Bill Section");
  };

  const handleEnterBillManually = () => {
    setCreateBillModalVisible(false);
    console.log("Navigate to 5. Manual Bill Entry Screen");
  };

  const handleOpenSettings = () => {
    console.log("Navigate to 7. Settings Page");
  };
  
  // Other placeholders
  const handleDeleteBill = (receiptId: string) => {
    console.log("Delete bill:", receiptId);
    setSelectedBill(null);
  };
  const handleSendReminder = (bill: Bill) => {
    console.log("Send reminder for bill:", bill.receipt_id);
  };

  // Helper Functions
   const getItemList = (bill: Bill) => {
    if (bill.receipt_items.length === 0) return "No items";

    const items = bill.receipt_items.map((item) => item.item_name);
    const uniqueItems = [...new Set(items)];

    // Apples
    if (uniqueItems.length === 1) {
      return uniqueItems[0];
    }

    // Apples and Oranges
    if (uniqueItems.length === 2) {
      return `${uniqueItems[0]} and ${uniqueItems[1]}`;
    }

    // Apples, Oranges + 1 more
    return `${uniqueItems[0]}, ${uniqueItems[1]} +${uniqueItems.length - 2} more`;
  };
  const getBillTotal = (bill: Bill) => {
    let sum = 0;
    for (const item of bill.receipt_items)
      sum += item.item_cost;

    return sum + bill.Tax + bill.tip;
  };

  const getPeopleInvolved = (bill: Bill) => {
    return [...new Set(bill.receipt_items.map((item) => item.owner))];
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Greeting */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}!</Text>
          </View>
        </View>



        <View style={styles.billsPanel}>
          <Text style={styles.sectionTitle}>All Bills</Text>

          {bills.length === 0 ? ( 
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}> {/* Placeholder text +  */}
                Time to start picking up some checks!
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, width: "100%" }}>
            <ScrollView
              style={styles.billScroll}
              contentContainerStyle={styles.billsList}
              showsVerticalScrollIndicator={false}
            >
              {bills.map((bill) => (
                <Pressable
                  key={bill.receipt_id}
                  style={styles.billBubble}
                  onPress={() => setSelectedBill(bill)}
                >
                  <Text style={styles.billDate}>{bill.receipt_date}</Text>
                  <Text style={styles.billDescription}>{getItemList(bill)}</Text>
                  <Text style={styles.billAmount}>
                    Total Paid: ${getBillTotal(bill).toFixed(2)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            </View>
          )}
        </View>




<Modal
          transparent
          animationType="fade"
          visible={selectedBill !== null}
          onRequestClose={() => setSelectedBill(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedBill(null)}
          >
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Bill Details</Text>
                <Pressable onPress={() => setSelectedBill(null)}>
                  <Text style={styles.closeButton}>✕</Text>
                </Pressable>
              </View>

              {selectedBill && (
                <>
                  <Text style={styles.modalLabel}>
                    Date Uploaded:{" "}
                    <Text style={styles.modalValue}>
                      {selectedBill.receipt_date}
                    </Text>
                  </Text>

                  <Text style={styles.modalLabel}>
                    Description:{" "}
                    <Text style={styles.modalValue}>
                      {getItemList(selectedBill)}
                    </Text>
                  </Text>

                  <Text style={styles.modalLabel}>
                    Total Amount Paid:{" "}
                    <Text style={styles.modalValue}>
                      ${getBillTotal(selectedBill).toFixed(2)}
                    </Text>
                  </Text>

                  <Text style={styles.modalLabel}>
                    Number of People Involved:{" "}
                    <Text style={styles.modalValue}>
                      {getPeopleInvolved(selectedBill).length}
                    </Text>
                  </Text>

                  <Text style={[styles.modalLabel, styles.peopleHeader]}>
                    Specific People Involved
                  </Text>

                  <ScrollView
                    style={styles.peopleList}
                    contentContainerStyle={styles.peopleListContent}
                  >
                    {getPeopleInvolved(selectedBill).map((phoneNumber, index) => (
                      <View key={index} style={styles.personCard}>
                        <Text style={styles.personText}>Name: N/A</Text>
                        <Text style={styles.personText}>
                          Phone Number: {phoneNumber}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.itemsSection}>
                    <Text style={[styles.modalLabel, { marginBottom: 10 }]}>
                      Items
                    </Text>

                    {selectedBill.receipt_items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <View>
                          <Text style={styles.itemName}>{item.item_name}</Text>
                          <Text style={styles.itemOwner}>{item.owner}</Text>
                        </View>
                        <Text style={styles.itemCost}>
                          ${item.item_cost.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryText}>
                      Tax: ${selectedBill.Tax.toFixed(2)}
                    </Text>
                    <Text style={styles.summaryText}>
                      Tip: ${selectedBill.tip.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.modalActions}>
                    <Pressable
                      style={styles.reminderButton}
                      onPress={() => handleSendReminder(selectedBill)}
                    >
                      <Text style={styles.reminderButtonText}>
                        Send Reminder
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteBill(selectedBill.receipt_id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete Bill</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>











        {/* Create Bill Button */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.createBillButton} onPress={() => setCreateBillModalVisible(true)}>
            <Text style={styles.createBillButtonText}>Create Bill</Text>
          </Pressable>
        </View>

        {/* Create Bill Model */}
        <Modal
          transparent
          animationType="fade"
          visible={createBillModalVisible}
          onRequestClose={() => setCreateBillModalVisible(false)}
        >
          {/* Hides model if pressed outside of modal */}
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setCreateBillModalVisible(false)}
          > 
           {/* Hides model on x */}
            <Pressable style={styles.createModalCard} onPress={() => { }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Bill</Text>
                <Pressable onPress={() => setCreateBillModalVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </Pressable>
              </View>

              {/* Nav to 4 */}
              <Pressable style={styles.optionButton} onPress={handleScanBill}>
                <Text style={styles.optionButtonText}>Scan Bill</Text>
              </Pressable>

              {/* Nav to 5 */}
              <Pressable
                style={styles.optionButton}
                onPress={handleEnterBillManually}
              > 
                <Text style={styles.optionButtonText}>Enter Bill Manually</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>


        {/* Settings Button */}
        <Pressable style={styles.settingsButton} onPress={handleOpenSettings}>
          <Text style={styles.settingsButtonText}>Settings</Text>
        </Pressable>


      </View>
    </SafeAreaView>
  );
}

export default Home;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FB",
    width: "100%", 
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    width: "100%", 
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  settingsButton: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  actionsRow: {
    marginBottom: 18,
  },
  createBillButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  createBillButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  billsPanel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    elevation: 2,
    width: "100%", 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    width: "100%",
    alignSelf: 'stretch',
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  billScroll: {
    flex: 1,
  },
  billsList: {
    flexGrow: 1,
    paddingBottom: 8,
    gap: 12,
  },
  billBubble: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 16,
    width: "100%",
  },
  billDate: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  billDescription: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  billAmount: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },
  createModalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  closeButton: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6B7280",
  },
  modalLabel: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 10,
    fontWeight: "700",
  },
  modalValue: {
    fontWeight: "400",
    color: "#111827",
  },
  peopleHeader: {
    marginTop: 6,
    marginBottom: 12,
  },
  peopleList: {
    maxHeight: 140,
    marginBottom: 16,
  },
  peopleListContent: {
    gap: 10,
  },
  personCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 12,
  },
  personText: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 4,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemRow: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textTransform: "capitalize",
  },
  itemOwner: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  itemCost: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  summaryBox: {
    marginBottom: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 12,
  },
  summaryText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  reminderButton: {
    flex: 1,
    backgroundColor: "#E0E7FF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  reminderButtonText: {
    color: "#3730A3",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#B91C1C",
    fontSize: 15,
    fontWeight: "700",
  },
  optionButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
});