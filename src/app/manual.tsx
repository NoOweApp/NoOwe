import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Button, Searchbar, Text, useTheme } from "react-native-paper";
    Alert,
    Modal,
    ScrollView,
    View
} from "react-native";
import { Button, Checkbox, HelperText, Text, TextInput, useTheme } from "react-native-paper";

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

  type PeopleModalView = "main" | "manual" | "auto";
  const [peopleModalVisible, setPeopleModalVisible] = useState(false);
  const [view, setView] = useState<PeopleModalView>("main");
  const [people, setPeople] = useState<Person[]>([]);
  const [items, setItems] = useState<Item[]>([]);

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
    type PeopleModalView = "main" | "manual" | "auto";
    const [peopleModalVisible, setPeopleModalVisible] = useState(false);
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [view, setView] = useState<PeopleModalView>("main");

  const addPersonAuto = () => {};

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

    const addPersonManual = () => {

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

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 40,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          marginBottom: 20,
          color: theme.colors.onBackground,
        }}
      >
        Manual Bill Entry
      </Text>

      {/* Selected people list */}
      {people.length > 0 && (
        <View
          style={{
            borderWidth: 1,
            borderColor: theme.colors.outline,
            padding: 10,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            People Added ({people.length}):
          </Text>
          <ScrollView>
            {people.map((p, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  padding: 10,
                  marginBottom: 6,
                }}
              >
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
            <Text
                style={{
                    fontSize: 28,
                    marginBottom: 20,
                    color: theme.colors.onBackground
                }}
            >
                Manual Bill Entry
            </Text>
            <Text
                style={{
                    fontSize: 20,
                    marginBottom: 10,
                    color: theme.colors.onBackground
                }}
            >
                Items Added
            </Text>
            <View
                style={{
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                    padding: 10,
                    height: 300,
                    marginBottom: 20
                }}
            >
                {items.length === 0 ? (
                    <View style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
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
                                    marginBottom: 10
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
            <Button onPress={() => setPeopleModalVisible(true)}>Open People</Button>
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
            <Modal visible={peopleModalVisible}>
                <View>
                  <Text style={{ color: theme.colors.onSurface }}>
                    Name: {p.name ?? "N/A"}
                  </Text>
                  <Text style={{ color: theme.colors.onSurface }}>
                    Phone: {p.phone}
                  </Text>
                </View>
                <Button onPress={() => removeContact(index)}>Remove</Button>
              </View>
            ))}
          </ScrollView>
            </Modal>
            <Modal visible={itemModalVisible}>
                <View>
                    <Text>Add Item</Text>

                    <TextInput
                        label="Item Name"
                        value={itemName}
                        onChangeText={setItemName}
                    />

                    <TextInput
                        label="Item Cost"
                        value={itemCost}
                        onChangeText={setItemCost}
                        keyboardType="decimal-pad"
                    />
                    <Text>Assign People</Text>

                    <ScrollView style={{ maxHeight: 200 }}>
                        {people.map((person, index) => (
                            <View key={index}>

                                <Checkbox
                                    status={
                                        selectedPeople.includes(person)
                                            ? "checked"
                                            : "unchecked"
                                    }
                                    onPress={() => toggleSelectPerson(person)}
                                />

                                <Text>
                                    {index + 1}. {person.name ?? "No Name"}
                                </Text>

                                <Text>{person.phone}</Text>

                            </View>
                        ))}
                    </ScrollView>
                    {itemError !== "" && (
                        <HelperText type="error" visible={true}>
                            {itemError}
                        </HelperText>
                    )}

                    <Button
                        onPress={AddItem}
                        disabled={submitItemGreyedOut}
                    >
                        Submit
                    </Button>

                    <Button
                        onPress={() => setItemModalVisible(false)}
                    >
                        Close
                    </Button>
                </View>
            </Modal>
        </View>
      )}

      <Button
        mode="contained"
        onPress={() => setPeopleModalVisible(true)}
        style={{ marginBottom: 10 }}
      >
        Add People
      </Button>

      {/* People Modal */}
      <Modal
        visible={peopleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPeopleModalVisible(false)}
      >
        <Pressable
          onPress={() => {
            setPeopleModalVisible(false);
            setView("main");
          }}
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
              maxHeight: "80%",
              backgroundColor: theme.colors.surface,
              padding: 20,
              borderRadius: 8,
            }}
          >
            {/* main */}
            {view === "main" && (
              <>
                <Text
                  style={{
                    fontSize: 20,
                    marginBottom: 20,
                    color: theme.colors.onSurface,
                  }}
                >
                  Add Person
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setView("manual")}
                  style={{ marginBottom: 10 }}
                >
                  Enter Manually
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setView("auto");
                    loadContacts();
                  }}
                  style={{ marginBottom: 10 }}
                >
                  Import from Contacts
                </Button>
                <Button
                  onPress={() => {
                    setPeopleModalVisible(false);
                    setView("main");
                  }}
                >
                  Close
                </Button>
              </>
            )}

            {/* Manual Entry */}
            {view === "manual" && (
              <>
                <Text
                  style={{
                    fontSize: 20,
                    marginBottom: 20,
                    color: theme.colors.onSurface,
                  }}
                >
                  Manual Entry
                </Text>
                <TextInput
                  placeholder="Name (optional)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={manualName}
                  onChangeText={setManualName}
                  style={{
                    color: theme.colors.onSurface,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outline,
                    marginBottom: 12,
                    padding: 4,
                  }}
                />
                <TextInput
                  placeholder="Phone number"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={manualPhone}
                  onChangeText={setManualPhone}
                  keyboardType="phone-pad"
                  style={{
                    color: theme.colors.onSurface,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outline,
                    marginBottom: 16,
                    padding: 4,
                  }}
                />
                <Button
                  mode="contained"
                  disabled={!manualPhone.trim()}
                  onPress={addPersonManual} /*you can keep adding */
                  style={{ marginBottom: 10 }}
                >
                  Add Person
                </Button>
                <Button onPress={() => setView("main")}>Done</Button>
              </>
            )}

            {/* Automatic Import */}
            {view === "auto" && (
              <>
                <Text
                  style={{
                    fontSize: 20,
                    marginBottom: 12,
                    color: theme.colors.onSurface,
                  }}
                >
                  Automatic Import
                </Text>

                {contactsError ? (
                  <>
                    <Text style={{ color: "red", marginBottom: 8 }}>
                      {contactsError}
                    </Text>
                    <Button onPress={loadContacts}>Retry</Button>
                  </>
                ) : contactsLoading ? (
                  <Text style={{ color: theme.colors.onSurface }}>
                    Loading contacts…
                  </Text>
                ) : (
                  <>
                    <Searchbar
                      placeholder="Search contacts"
                      value={contactSearch}
                      onChangeText={handleContactSearch}
                      style={{ marginBottom: 10 }}
                    />
                    {/* section displaying contacts that we have selected */}
                    {people.length > 0 && (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: theme.colors.outlineVariant,
                          padding: 8,
                          marginBottom: 10,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: theme.colors.onSurface,
                            marginBottom: 4,
                          }}
                        >
                          Selected ({people.length}):
                        </Text>
                        {people.map((p, i) => (
                          <Text
                            key={i}
                            style={{ color: theme.colors.onSurface }}
                          >
                            • {p.name ?? "N/A"} — {p.phone}
                          </Text>
                        ))}
                      </View>
                    )}
                    {/* this is the list of contacts */}
                    <FlatList
                      data={filteredContacts}
                      keyExtractor={(item, index) =>
                        item.name ??
                        item.phoneNumbers?.[0]?.number ??
                        index.toString()
                      }
                      style={{ maxHeight: 300 }}
                      renderItem={({ item }) => (
                        <Pressable
                          onPress={() =>
                            isSelected(item)
                              ? removeContact(
                                  people.findIndex(
                                    (p) =>
                                      p.phone ===
                                        (item.phoneNumbers?.[0]?.number ??
                                          "") && p.name === (item.name ?? null),
                                  ),
                                )
                              : importContact(item)
                          }
                          style={{
                            borderWidth: 1,
                            borderColor: isSelected(item)
                              ? theme.colors.primary
                              : theme.colors.outlineVariant,
                            backgroundColor: isSelected(item)
                              ? theme.colors.primaryContainer
                              : "transparent",
                            padding: 12,
                            marginBottom: 6,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ color: theme.colors.onSurface }}>
                            {item.name}
                          </Text>
                          <Text
                            style={{
                              color: theme.colors.onSurface,
                              opacity: 0.6,
                            }}
                          >
                            {item.phoneNumbers?.[0]?.number}
                          </Text>
                        </Pressable>
                      )}
                    />
                  </>
                )}

                <Button
                  onPress={() => {
                    setView("main");
                    setContactSearch("");
                  }}
                  style={{ marginTop: 10 }}
                >
                  Ok
                </Button>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
