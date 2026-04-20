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

/* declaring types */
type Person = {
  name: string | null;
  phone: string;
};
type Item = {
  name: string;
  cost: number;
  assignees: Person[];
};

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
