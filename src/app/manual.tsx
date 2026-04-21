import * as Contacts from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View
} from "react-native";

import { Button, HelperText, Text, TextInput, useTheme } from "react-native-paper";

/* declaring types */
type Person = {
    name: string | null;
    phone: string;
};
type Item = {
    name: string;
    cost: number;
    owners: Person[];
}

export default function Manual() {
    const router = useRouter();
    const theme = useTheme();
    const { temp_bill } = useLocalSearchParams();

    type PeopleModalView = "main" | "manual" | "auto";
    const [peopleModalVisible, setPeopleModalVisible] = useState(false);
    const [view, setView] = useState<PeopleModalView>("main");
    const [people, setPeople] = useState<Person[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    // Load items from temp_bill param if present (coming from scan)
    useEffect(() => {
        if (typeof temp_bill === 'string' && temp_bill.trim() !== "") {
            try {
                const bill = JSON.parse(temp_bill);
                if (bill && Array.isArray(bill.receipt_items)) {
                    setItems(
                        bill.receipt_items.map((item: any) => ({
                            name: item.item_name,
                            cost: item.item_cost,
                            owners: [],
                        }))
                    );
                }
            } catch (e) {
                // ignore parse errors
            }
        }
    }, [temp_bill]);

    /* Contact import state */
    const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>(
        [],
    );
    const [contactSearch, setContactSearch] = useState("");
    const [contactsLoading, setContactsLoading] = useState(false);
    const [contactsError, setContactsError] = useState<string | null>(null);

    /* manual entry vars */
    const [manualName, setManualName] = useState("");
    const [manualPhone, setManualPhone] = useState("");

    const addPersonManual = () => {
        if (!manualPhone.trim()) return; /* phone is required */
        setPeople((prev) => [
            ...prev,
            { name: manualName.trim() || null, phone: manualPhone.trim() },
        ]);
        setManualName(""); /* clear inputs for next entry */
        setManualPhone("");
    };
    const [itemModalVisible, setItemModalVisible] = useState(false);

    const loadContacts = async () => {
        setContactsLoading(true);
        setContactsError(null);
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== "granted") {
            setContactsError("Permission to access contacts was denied.");
            setContactsLoading(false);
            return;
        }
        const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        });
        const withPhone = data.filter(
            (c) => c.phoneNumbers && c.phoneNumbers.length > 0,
        );
        withPhone.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        setContacts(withPhone);
        setFilteredContacts(withPhone);
        setContactsLoading(false);
    };
    const [itemName, setItemName] = useState("");
    const [itemCost, setItemCost] = useState("");
    const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
    const [itemError, setItemError] = useState("");


    const handleContactSearch = (query: string) => {
        setContactSearch(query);
        if (!query.trim()) {
            setFilteredContacts(contacts);
        } else {
            const lower = query.toLowerCase();
            setFilteredContacts(
                contacts.filter((c) => (c.name ?? "").toLowerCase().includes(lower)),
            );
        }
    };

    /* all contacts are added to and stored here */
    const importContact = (contact: Contacts.Contact) => {
        const phone = contact.phoneNumbers?.[0]?.number ?? "";
        setPeople((prev) => [...prev, { name: contact.name ?? null, phone }]);
    };

    const removeContact = (index: number) => {
        setPeople((prev) => prev.filter((_, i) => i !== index));
    };

    const isSelected = (contact: Contacts.Contact) =>
        people.some(
            (p) =>
                p.phone === (contact.phoneNumbers?.[0]?.number ?? "") &&
                p.name === (contact.name ?? null),
        );
    const AddItem = () => {
        setItemError("");

        if (itemName.trim().length < 2 || itemName.trim().length > 50) {
            setItemError("Item name must be 2-50 characters.");
            return;
        }

        const cost = Number(itemCost);

        if (isNaN(cost) || cost <= 0 || cost > 10000) {
            setItemError("Cost must be between $0.01 and $10000.");
            return;
        }

        if (!/^\d+(\.\d{1,2})?$/.test(itemCost)) {
            setItemError("Max two decimal places.");
            return;
        }

        const newItem: Item = {
            name: itemName.trim(),
            cost: cost,
            owners: selectedPeople
        };

        setItems((prev) => [...prev, newItem]);

        Alert.alert("Success", "Item Added");

        setItemName("");
        setItemCost("");
        setSelectedPeople([]);
        setItemModalVisible(false);
    }

    const toggleSelectPerson = (person: Person) => {
        if (selectedPeople.includes(person)) {
            setSelectedPeople(prev =>
                prev.filter(p => p !== person)
            );
        } else {
            setSelectedPeople(prev => [...prev, person]);
        }
    }

    const submitItemGreyedOut = itemName.trim().length < 2 || itemName.trim().length > 50 || itemCost.trim() === "";
    const submitBillGreyedOut = people.length < 2 || items.length === 0 || items.some(item => item.owners.length === 0) || people.some(person => !items.some(item => item.owners.includes(person)));


    return (
        <View
            style={{
                flex: 1,
                padding: 20,
                paddingTop: 40,
                backgroundColor: theme.colors.background,
            }}
        >
            {/* TITLE */}
            <Text style={{ fontSize: 28, marginBottom: 20, color: theme.colors.onBackground }}>
                Manual Bill Entry
            </Text>

            {/* PEOPLE SUMMARY */}
            {people.length > 0 && (
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: theme.colors.outline,
                        padding: 10,
                        marginBottom: 20,
                    }}
                >
                    <Text style={{ marginBottom: 8 }}>
                        People Added ({people.length})
                    </Text>

                    <ScrollView>
                        {people.map((p, index) => (
                            <View
                                key={index}
                                style={{
                                    borderWidth: 1,
                                    borderColor: theme.colors.outlineVariant,
                                    padding: 10,
                                    marginBottom: 6,
                                }}
                            >
                                <Text>
                                    {index + 1}. {p.name ?? "N/A"}
                                </Text>
                                <Text>{p.phone}</Text>

                                <Button onPress={() => removeContact(index)}>
                                    Remove
                                </Button>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* ITEMS LIST */}
            <Text style={{ fontSize: 20, marginBottom: 10 }}>
                Items Added
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
                {items.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Text>No items added yet.</Text>
                    </View>
                ) : (
                    <ScrollView>
                        {items.map((item, index) => (
                            <View
                                key={index}
                                style={{
                                    borderWidth: 1,
                                    borderColor: theme.colors.outlineVariant,
                                    padding: 12,
                                    marginBottom: 10,
                                }}
                            >
                                <Text>{item.name}</Text>
                                <Text>${item.cost.toFixed(2)}</Text>
                                <Text>
                                    Assigned: {item.owners.map(p => p.name).join(", ")}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* ACTION BUTTONS */}
            <Button onPress={() => setPeopleModalVisible(true)}>
                Open People
            </Button>

            <Button
                mode="contained"
                onPress={() => setItemModalVisible(true)}
                style={{ marginBottom: 10 }}
            >
                Add Item
            </Button>

            <Button
                mode="contained"
                disabled={submitBillGreyedOut}
                onPress={() => Alert.alert("Bill Submitted")}
            >
                Submit Bill
            </Button>

            {/* ITEM MODAL */}
            <Modal
                visible={itemModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setItemModalVisible(false)}
            >
                <Pressable
                    onPress={() => setItemModalVisible(false)}
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0,0,0,0.3)",
                    }}
                >
                    <Pressable
                        onPress={() => { }}
                        style={{
                            width: "85%",
                            maxHeight: "85%",
                            backgroundColor: theme.colors.surface,
                            padding: 20,
                            borderRadius: 8,
                        }}
                    >
                        {/* HEADER */}
                        <Text
                            style={{
                                fontSize: 20,
                                marginBottom: 16,
                                color: theme.colors.onSurface,
                            }}
                        >
                            Add Item
                        </Text>

                        {/* ITEM NAME */}
                        <TextInput
                            label="Item Name"
                            value={itemName}
                            onChangeText={setItemName}
                            style={{ marginBottom: 12 }}
                        />

                        {/* ITEM COST */}
                        <TextInput
                            label="Item Cost"
                            value={itemCost}
                            onChangeText={setItemCost}
                            keyboardType="decimal-pad"
                            style={{ marginBottom: 16 }}
                        />

                        {/* ASSIGNEES SECTION HEADER */}
                        <Text
                            style={{
                                fontSize: 16,
                                marginBottom: 8,
                                color: theme.colors.onSurface,
                            }}
                        >
                            Assign People
                        </Text>

                        {/* SELECTED PEOPLE SUMMARY (like auto-import selected contacts) */}
                        {selectedPeople.length > 0 && (
                            <View
                                style={{
                                    borderWidth: 1,
                                    borderColor: theme.colors.outlineVariant,
                                    padding: 8,
                                    marginBottom: 10,
                                    borderRadius: 4,
                                }}
                            >
                                <Text style={{ marginBottom: 4 }}>
                                    Selected ({selectedPeople.length})
                                </Text>

                                {selectedPeople.map((p, i) => (
                                    <Text key={i}>
                                        • {p.name ?? "N/A"} — {p.phone}
                                    </Text>
                                ))}
                            </View>
                        )}

                        {/* PEOPLE LIST (same style as contacts list in people modal) */}
                        <ScrollView style={{ maxHeight: 220 }}>
                            {people.map((person, index) => {
                                const isSelected = selectedPeople.includes(person);

                                return (
                                    <Pressable
                                        key={index}
                                        onPress={() => toggleSelectPerson(person)}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: isSelected
                                                ? theme.colors.primary
                                                : theme.colors.outlineVariant,
                                            backgroundColor: isSelected
                                                ? theme.colors.primaryContainer
                                                : "transparent",
                                            padding: 12,
                                            marginBottom: 6,
                                            borderRadius: 4,
                                        }}
                                    >
                                        <Text style={{ color: theme.colors.onSurface }}>
                                            {index + 1}. {person.name ?? "No Name"}
                                        </Text>
                                        <Text
                                            style={{
                                                color: theme.colors.onSurface,
                                                opacity: 0.6,
                                            }}
                                        >
                                            {person.phone}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        {/* ERROR */}
                        {itemError !== "" && (
                            <HelperText type="error" visible>
                                {itemError}
                            </HelperText>
                        )}

                        {/* ACTION BUTTONS */}
                        <Button
                            mode="contained"
                            onPress={AddItem}
                            disabled={submitItemGreyedOut}
                            style={{ marginTop: 12, marginBottom: 8 }}
                        >
                            Add Item
                        </Button>

                        <Button onPress={() => setItemModalVisible(false)}>
                            Close
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* PEOPLE MODAL */}
            <Modal
                visible={peopleModalVisible}
                transparent
                animationType="fade"
            >
                <Pressable
                    onPress={() => setPeopleModalVisible(false)}
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "rgba(0,0,0,0.3)",
                    }}
                >
                    <Pressable
                        style={{
                            width: "85%",
                            backgroundColor: theme.colors.surface,
                            padding: 20,
                            borderRadius: 8,
                        }}
                    >
                        <Text>Add People</Text>

                        {view === "main" && (
                            <>
                                <Button onPress={() => setView("manual")}>
                                    Manual
                                </Button>
                                <Button onPress={() => setView("auto")}>
                                    Contacts
                                </Button>
                            </>
                        )}

                        {view === "manual" && (
                            <>
                                <TextInput
                                    value={manualName}
                                    onChangeText={setManualName}
                                    placeholder="Name"
                                />
                                <TextInput
                                    value={manualPhone}
                                    onChangeText={setManualPhone}
                                    placeholder="Phone"
                                />

                                <Button
                                    disabled={!manualPhone.trim()}
                                    onPress={addPersonManual}
                                >
                                    Add
                                </Button>

                                <Button onPress={() => setView("main")}>
                                    Back
                                </Button>
                            </>
                        )}

                        {view === "auto" && (
                            <>
                                <Text>Contacts Mode</Text>
                                <Button onPress={loadContacts}>Load</Button>
                                <Button onPress={() => setView("main")}>
                                    Back
                                </Button>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}