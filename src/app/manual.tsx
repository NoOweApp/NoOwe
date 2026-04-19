import * as Contacts from "expo-contacts";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Modal, View } from "react-native";
import { Button, Searchbar, Text, useTheme } from "react-native-paper";

//declaring types
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

  // Contact import state
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>(
    [],
  );
  const [contactSearch, setContactSearch] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);

  const addPersonManual = () => {};

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

  const importContact = (contact: Contacts.Contact) => {
    const phone = contact.phoneNumbers?.[0]?.number ?? "";
    setPeople((prev) => [...prev, { name: contact.name ?? null, phone }]);
    setPeopleModalVisible(false);
    setView("main");
    setContactSearch("");
    setFilteredContacts(contacts);
  };

  return (
    <View>
      <Text>Manual Bill Entry</Text>
      <Button onPress={() => setPeopleModalVisible(true)}>Open People</Button>
      <Modal visible={peopleModalVisible}>
        <View>
          {view === "main" && (
            <>
              <Button onPress={() => setView("manual")}>
                Add Person Manual
              </Button>
              <Button
                onPress={() => {
                  setView("auto");
                  loadContacts();
                }}
              >
                Add Person Auto
              </Button>
            </>
          )}
          {view === "manual" && (
            <>
              <Text>Manual Entry</Text>
              <Button
                onPress={() => {
                  addPersonManual();
                  setView("main");
                }}
              >
                Add Pearson
              </Button>
              <Button onPress={() => setView("main")}>Back</Button>
            </>
          )}
          {view === "auto" && (
            <>
              <Text>Automatic Import</Text>
              {contactsError ? (
                <>
                  <Text style={{ color: "red" }}>{contactsError}</Text>
                  <Button onPress={loadContacts}>Retry</Button>
                </>
              ) : contactsLoading ? (
                <Text>Loading contacts…</Text>
              ) : (
                <>
                  <Searchbar
                    placeholder="Search contacts"
                    value={contactSearch}
                    onChangeText={handleContactSearch}
                  />
                  <FlatList
                    data={filteredContacts}
                    keyExtractor={(item, index) =>
                      item.name ??
                      item.phoneNumbers?.[0]?.number ??
                      index.toString()
                    }
                    renderItem={({ item }) => (
                      <Button onPress={() => importContact(item)}>
                        {item.name} — {item.phoneNumbers?.[0]?.number}
                      </Button>
                    )}
                  />
                </>
              )}
              <Button
                onPress={() => {
                  setView("main");
                  setContactSearch("");
                }}
              >
                Back
              </Button>
            </>
          )}
          <Button
            onPress={() => {
              setPeopleModalVisible(false);
              setView("main");
            }}
          >
            Close
          </Button>
        </View>
      </Modal>
    </View>
  );
}
