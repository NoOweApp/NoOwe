import { BottomSheet } from "@/src/components/BottomSheet";
import * as helpers from "@/validation/helpers";
import * as Contacts from "expo-contacts";
import { Directory, File, Paths } from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image, Keyboard, KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    View
} from "react-native";
import { Button, Divider, HelperText, Icon, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Person = {
    name: string | null;
    phone: string;
    imageUri?: string;
};
type Item = {
    name: string;
    cost: number;
    owners: Person[];
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

export default function Manual() {
    const router = useRouter();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { temp_bill } = useLocalSearchParams();

    type PeopleModalView = "main" | "manual" | "auto";
    const [peopleModalVisible, setPeopleModalVisible] = useState(false);
    const [view, setView] = useState<PeopleModalView>("main");
    const [people, setPeople] = useState<Person[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    useEffect(() => {
        if (typeof temp_bill === "string" && temp_bill.trim() !== "") {
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

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const nooweFolderPath = new Directory(Paths.document, "NoOwe");
                const settingsJson = new File(nooweFolderPath, "settings.json");
                if (settingsJson.exists) {
                    const text = await settingsJson.text();
                    const profile = JSON.parse(text);
                    const firstName = profile.firstName ?? profile.first_name ?? "";
                    if (firstName) {
                        setPeople([{ name: firstName, phone: "" }]);
                    }
                }
            } catch (e) {
                // ignore
            }
        };
        loadProfile();
    }, []);

    const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>([]);
    const [contactSearch, setContactSearch] = useState("");
    const [contactsLoading, setContactsLoading] = useState(false);
    const [contactsError, setContactsError] = useState<string | null>(null);
    const [selectedContacts, setSelectedContacts] = useState<Contacts.Contact[]>([]);

    const [manualName, setManualName] = useState("");
    const [manualPhone, setManualPhone] = useState("");

    const addPersonManual = () => {
        setContactsError(null);

        // strip anything just in case (future-proofing)
        const cleaned = manualPhone.replace(/\D/g, "");

        // basic guard first
        if (cleaned.length !== 10) {
            setContactsError("Phone number must be 10 digits.");
            return;
        }

        // add US country code
        const phoneObj = parsePhoneNumberFromString(`+1${cleaned}`);

        if (!phoneObj || !phoneObj.isValid()) {
            setContactsError("Phone Number Invalid.");
            return;
        }

        try {
            helpers.checkString(manualName, "Contact Name");
        } catch (e: any) {
            setContactsError(e.message);
            return;
        }

        if (manualName.trim().length > 25 || manualName.trim().length < 2) {
            setContactsError("Name must be between 2 and 25 chracters.")
            return;
        }

        setManualName(manualName.trim())


        setPeople((prev) => [
            ...prev,
            { name: manualName.trim() || null, phone: manualPhone.trim() },
        ]);

        Alert.alert("Success", "Person Added");

        setManualName("");
        setManualPhone("");
    };

    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [itemName, setItemName] = useState("");
    const [itemCost, setItemCost] = useState("");
    const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
    const [itemError, setItemError] = useState("");

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
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Image],
        });
        const withPhone = data.filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0);
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
                contacts.filter((c) => (c.name ?? "").toLowerCase().includes(lower))
            );
        }
    };

    const toggleContactSelection = (contact: Contacts.Contact) => {
        const exists = selectedContacts.some((c) => c.id === contact.id);

        if (exists) {
            setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id));
        } else {
            setSelectedContacts((prev) => [...prev, contact]);
        }
    };

    const importContact = async (contact: Contacts.Contact) => {
        const phone = contact.phoneNumbers?.[0]?.number ?? "";
        let imageUri: string | undefined;

        if (contact.imageAvailable && contact.id) {
            try {
                const full = await Contacts.getContactByIdAsync(contact.id, [Contacts.Fields.Image]);
                if (full?.image?.base64) {
                    imageUri = `data:image/jpeg;base64,${full.image.base64}`;
                } else if (full?.image?.uri) {
                    imageUri = full.image.uri;
                }
            } catch {
                imageUri = contact.image?.uri;
            }
        }

        setPeople((prev) => [...prev, { name: contact.name ?? null, phone, imageUri }]);
    };

    const confirmImportContacts = async () => {
        const newPeople: Person[] = [];

        for (const contact of selectedContacts) {
            const phone = contact.phoneNumbers?.[0]?.number ?? "";
            let imageUri: string | undefined;

            if (contact.imageAvailable && contact.id) {
                try {
                    const full = await Contacts.getContactByIdAsync(contact.id, [Contacts.Fields.Image]);
                    if (full?.image?.base64) {
                        imageUri = `data:image/jpeg;base64,${full.image.base64}`;
                    } else if (full?.image?.uri) {
                        imageUri = full.image.uri;
                    }
                } catch {
                    imageUri = contact.image?.uri;
                }
            }

            newPeople.push({
                name: contact.name ?? null,
                phone,
                imageUri,
            });
        }

        setPeople((prev) => [...prev, ...newPeople]);

        setSelectedContacts([]);

        Alert.alert("Success", "Contacts Added");

        setView("main"); // or close modal if you want
    };

    const removeContact = (index: number) => {
        const removedPerson = people[index];

        setPeople((prev) => prev.filter((_, i) => i !== index));

        setItems((prev) =>
            prev.map((item) => ({
                ...item,
                owners: item.owners.filter((owner) => owner !== removedPerson),
            }))
        );

        setSelectedPeople((prev) =>
            prev.filter((person) => person !== removedPerson)
        );
    };

    const isContactSelected = (contact: Contacts.Contact) =>
        people.some(
            (p) =>
                p.phone === (contact.phoneNumbers?.[0]?.number ?? "") &&
                p.name === (contact.name ?? null)
        );

    const openAddItem = () => {
        setEditingItemIndex(null);
        setItemName("");
        setItemCost("");
        setSelectedPeople([]);
        setItemModalVisible(true);
    };

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
        const updatedItem: Item = { name: itemName.trim(), cost, owners: selectedPeople };
        if (editingItemIndex !== null) {
            setItems((prev) => prev.map((item, i) => (i === editingItemIndex ? updatedItem : item)));
            Alert.alert("Success", "Item Updated");
        } else {
            setItems((prev) => [...prev, updatedItem]);
            Alert.alert("Success", "Item Added");
        }
        setItemName("");
        setItemCost("");
        setSelectedPeople([]);
        setEditingItemIndex(null);
        setItemModalVisible(false);
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const editItem = (index: number) => {
        const item = items[index];
        setItemName(item.name);
        setItemCost(item.cost.toString());
        setSelectedPeople(item.owners);
        setEditingItemIndex(index);
        setItemModalVisible(true);
    };

    const submitBill = async () => {
        const bill = {
            id: Date.now().toString(),
            dateUploaded: new Date().toISOString().split("T")[0],
            description: "Manual Bill",
            totalAmountPaid: items.reduce((sum, item) => sum + item.cost, 0),
            people,
            items,
        };
        // console.log(JSON.stringify(bill, null, 2));
        try {
            const folder = new Directory(Paths.document, "NoOwe");
            if (!folder.exists) folder.create();

            const billsFile = new File(folder, "bills.json");
            let existing: typeof bill[] = [];

            if (billsFile.exists) {
                const text = await billsFile.text();
                existing = JSON.parse(text);
            }

            existing.push(bill);
            billsFile.write(JSON.stringify(existing));
            Alert.alert("Bill JSON Created");
            router.push("/dashboard");
        } catch (e: any) {
            Alert.alert("Error", e.message)
        }
    };

    const toggleSelectPerson = (person: Person) => {
        if (selectedPeople.includes(person)) {
            setSelectedPeople((prev) => prev.filter((p) => p !== person));
        } else {
            setSelectedPeople((prev) => [...prev, person]);
        }
    };

    const runningTotal = items.reduce((sum, item) => sum + item.cost, 0);
    const submitItemGreyedOut =
        itemName.trim().length < 2 || itemName.trim().length > 50 || itemCost.trim() === "";
    const submitBillGreyedOut =
        people.length < 2 ||
        items.length === 0 ||
        items.some((item) => item.owners.length === 0) ||
        people.some((person) => !items.some((item) => item.owners.includes(person)));

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Fixed header */}
            <View
                style={{
                    paddingTop: insets.top + 8,
                    paddingHorizontal: 8,
                    paddingBottom: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outlineVariant,
                }}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <IconButton
                        icon="arrow-left"
                        size={22}
                        iconColor={theme.colors.onSurfaceVariant}
                        onPress={() => router.push("/dashboard")}
                    />
                    <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: "700" }}>
                        Manual Entry
                    </Text>
                </View>
                {runningTotal > 0 && (
                    <View
                        style={{
                            backgroundColor: theme.colors.primaryContainer,
                            borderRadius: 20,
                            paddingHorizontal: 14,
                            paddingVertical: 5,
                            marginRight: 8,
                        }}
                    >
                        <Text
                            variant="labelLarge"
                            style={{ color: "white", fontWeight: "800" }}
                        >
                            ${runningTotal.toFixed(2)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Scrollable content */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* People section */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <Text
                        variant="labelSmall"
                        style={{
                            color: theme.colors.onSurfaceVariant,
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                        }}
                    >
                        People {people.length > 0 ? `(${people.length})` : ""}
                    </Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 24 }}
                    contentContainerStyle={{ paddingRight: 8, paddingTop: 8 }}
                >
                    {people.map((p, i) => (
                        <View key={i} style={{ alignItems: "center", marginRight: 16 }}>
                            <View style={{ position: "relative" }}>
                                <View
                                    style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: 26,
                                        overflow: "hidden",
                                    }}
                                >
                                    <PersonAvatar
                                        imageUri={p.imageUri}
                                        name={p.name}
                                        size={52}
                                        bgColor={theme.colors.primaryContainer}
                                        textColor={theme.colors.primary}
                                    />
                                </View>
                                <Pressable
                                    onPress={() => removeContact(i)}
                                    style={{
                                        position: "absolute",
                                        top: -3,
                                        right: -3,
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        backgroundColor: theme.colors.error,
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <Text style={{ color: "white", fontSize: 11, fontWeight: "800", lineHeight: 14 }}>
                                        ×
                                    </Text>
                                </Pressable>
                            </View>
                            <Text
                                variant="labelSmall"
                                style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, maxWidth: 56, textAlign: "center" }}
                                numberOfLines={1}
                            >
                                {p.name ?? "N/A"}
                            </Text>
                        </View>
                    ))}

                    {/* Add person button */}
                    <Pressable onPress={() => setPeopleModalVisible(true)} style={{ alignItems: "center" }}>
                        <View
                            style={{
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                borderWidth: 1.5,
                                borderColor: theme.colors.outline,
                                borderStyle: "dashed",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: theme.colors.primary, fontSize: 24, fontWeight: "300", lineHeight: 28 }}>
                                +
                            </Text>
                        </View>
                        <Text
                            variant="labelSmall"
                            style={{ color: theme.colors.primary, marginTop: 6 }}
                        >
                            Add
                        </Text>
                    </Pressable>
                </ScrollView>

                <Divider style={{ marginBottom: 24 }} />

                {/* Items section */}
                <Text
                    variant="labelSmall"
                    style={{
                        color: theme.colors.onSurfaceVariant,
                        textTransform: "uppercase",
                        letterSpacing: 1.2,
                        marginBottom: 14,
                    }}
                >
                    Items {items.length > 0 ? `(${items.length})` : ""}
                </Text>

                <View
                    style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 14,
                        overflow: "hidden",
                        marginBottom: 8,
                    }}
                >
                    {items.length === 0 && (
                        <View style={{ paddingVertical: 36, alignItems: "center" }}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                No items yet
                            </Text>
                            <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.onSurfaceVariant, opacity: 0.5, marginTop: 4 }}
                            >
                                Tap Add Item below to get started
                            </Text>
                        </View>
                    )}

                    {items.map((item, index) => (
                        <Pressable key={index} onPress={() => editItem(index)}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingVertical: 14,
                                    paddingLeft: 16,
                                    paddingRight: 8,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.colors.outlineVariant,
                                }}
                            >
                                <View
                                    style={{
                                        width: 3,
                                        height: 36,
                                        backgroundColor: theme.colors.primary,
                                        borderRadius: 2,
                                        marginRight: 14,
                                    }}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text
                                        variant="bodyMedium"
                                        style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                        {item.owners.length > 0
                                            ? item.owners.map((p) => p.name ?? "N/A").join(", ")
                                            : "No one assigned"}
                                    </Text>
                                </View>
                                <Text
                                    variant="bodyMedium"
                                    style={{ color: theme.colors.primary, fontWeight: "700", marginRight: 4 }}
                                >
                                    ${item.cost.toFixed(2)}
                                </Text>
                                <IconButton
                                    icon="trash-can-outline"
                                    size={16}
                                    iconColor={theme.colors.error}
                                    onPress={() => removeItem(index)}
                                />
                            </View>
                        </Pressable>
                    ))}

                    {/* Inline Add Item row */}
                    <Pressable
                        onPress={openAddItem}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                        }}
                    >
                        <View
                            style={{
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                backgroundColor: theme.colors.primaryContainer,
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 12,
                            }}
                        >
                            <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: "700", lineHeight: 20 }}>
                                +
                            </Text>
                        </View>
                        <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: "600" }}>
                            Add Item
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* Fixed footer — Submit */}
            <View
                style={{
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: insets.bottom + 16,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.outlineVariant,
                    backgroundColor: theme.colors.background,
                }}
            >
                <Button
                    mode="contained"
                    disabled={submitBillGreyedOut}
                    onPress={async() => await submitBill()}
                    contentStyle={{ paddingVertical: 6 }}
                >
                    Submit Bill
                </Button>
            </View>

            {/* ── ITEM MODAL ── */}
            <Modal
                visible={itemModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setItemModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <Pressable
                        onPress={() => setItemModalVisible(false)}
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: theme.colors.backdrop,
                            paddingHorizontal: 24,
                        }}
                    >
                        <Pressable onPress={() => { }} style={{ width: "100%" }}>
                            <View
                                style={{
                                    backgroundColor: theme.colors.surface,
                                    borderRadius: 24,
                                    paddingTop: 24,
                                    paddingHorizontal: 24,
                                    paddingBottom: 24,
                                }}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                                        {editingItemIndex !== null ? "Edit Item" : "Add Item"}
                                    </Text>
                                    <IconButton
                                        icon="close"
                                        size={20}
                                        iconColor={theme.colors.onSurfaceVariant}
                                        onPress={() => setItemModalVisible(false)}
                                    />
                                </View>

                                <TextInput
                                    label="Item Name"
                                    value={itemName}
                                    onChangeText={setItemName}
                                    style={{ marginBottom: 12 }}
                                />
                                <TextInput
                                    label="Item Cost"
                                    value={itemCost}
                                    onChangeText={setItemCost}
                                    keyboardType="decimal-pad"
                                    style={{ marginBottom: 20 }}
                                />

                                <Text
                                    variant="labelSmall"
                                    style={{
                                        color: theme.colors.onSurfaceVariant,
                                        textTransform: "uppercase",
                                        letterSpacing: 1.2,
                                        marginBottom: 12,
                                    }}
                                >
                                    Assign People
                                </Text>

                                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                                    {people.map((person, index) => {
                                        const personSelected = selectedPeople.includes(person);
                                        return (
                                            <Pressable
                                                key={index}
                                                onPress={() => toggleSelectPerson(person)}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    padding: 12,
                                                    marginBottom: 8,
                                                    borderRadius: 10,
                                                    borderWidth: 1,
                                                    borderColor: personSelected
                                                        ? theme.colors.primary
                                                        : theme.colors.outlineVariant,
                                                    backgroundColor: personSelected
                                                        ? theme.colors.primaryContainer
                                                        : "transparent",
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 17,
                                                        marginRight: 12,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <PersonAvatar
                                                        imageUri={person.imageUri}
                                                        name={person.name}
                                                        size={34}
                                                        bgColor={personSelected ? theme.colors.primary : theme.colors.surfaceVariant}
                                                        textColor={personSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                                                        {person.name ?? "No Name"}
                                                    </Text>
                                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                        {person.phone}
                                                    </Text>
                                                </View>
                                                {personSelected && (
                                                    <View
                                                        style={{
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: 10,
                                                            backgroundColor: theme.colors.primary,
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <Text style={{ color: theme.colors.onPrimary, fontSize: 12, fontWeight: "800" }}>
                                                            ✓
                                                        </Text>
                                                    </View>
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>

                                {itemError !== "" && (
                                    <HelperText type="error" visible style={{ marginTop: 4 }}>
                                        {itemError}
                                    </HelperText>
                                )}

                                <Button
                                    mode="contained"
                                    onPress={AddItem}
                                    disabled={submitItemGreyedOut}
                                    style={{ marginTop: 16 }}
                                    contentStyle={{ paddingVertical: 4 }}
                                >
                                    {editingItemIndex !== null ? "Save Changes" : "Add Item"}
                                </Button>
                            </View>
                        </Pressable>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── PEOPLE MODAL ── */}
            <BottomSheet
                visible={peopleModalVisible}
                onClose={() => { setView("main"); setPeopleModalVisible(false); }}
            >
                <View
                    style={{
                        backgroundColor: theme.colors.surface,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        paddingTop: 12,
                        paddingHorizontal: 24,
                        paddingBottom: insets.bottom + 24,
                        minHeight: view !== "main" ? "65%" : undefined,
                        maxHeight: "90%",
                    }}
                >
                    <View
                        style={{
                            width: 40,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: theme.colors.outlineVariant,
                            alignSelf: "center",
                            marginBottom: 20,
                        }}
                    />

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                            {view === "main" ? "Add People" : view === "manual" ? "Manual Entry" : "From Contacts"}
                        </Text>
                        <IconButton
                            icon="close"
                            size={20}
                            iconColor={theme.colors.onSurfaceVariant}
                            onPress={() => { setView("main"); setPeopleModalVisible(false); }}
                        />
                    </View>

                    {view === "main" && (
                        <View style={{ gap: 12 }}>
                            <Pressable
                                onPress={() => setView("manual")}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: theme.colors.surfaceVariant,
                                    borderRadius: 14,
                                    padding: 18,
                                }}
                            >
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: theme.colors.primaryContainer,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        marginRight: 14,
                                    }}
                                >
                                    <Icon source="pencil-outline" color="white" size={20} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                                        Enter Manually
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        Type in a name and phone number
                                    </Text>
                                </View>
                                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 18 }}>›</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setView("auto")}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: theme.colors.surfaceVariant,
                                    borderRadius: 14,
                                    padding: 18,
                                }}
                            >
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: theme.colors.primaryContainer,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        marginRight: 14,
                                    }}
                                >
                                    <Icon source="account-multiple-outline" color="white" size={20} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: "700" }}>
                                        Import from Contacts
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        Pick from your phone contacts
                                    </Text>
                                </View>
                                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 18 }}>›</Text>
                            </Pressable>
                        </View>
                    )}

                    {view === "manual" && (
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Pressable onPress={Keyboard.dismiss}>
                                {contactsError && (
                                    <HelperText type="error" visible>
                                        {contactsError}
                                    </HelperText>
                                )}
                                <View style={{ flex: 1, justifyContent: "center", paddingVertical: 24 }}>
                                    <TextInput
                                        label="Name"
                                        value={manualName}
                                        onChangeText={setManualName}
                                        style={{ marginBottom: 12 }}
                                    />
                                    <TextInput
                                        label="Phone Number"
                                        value={manualPhone}
                                        onChangeText={setManualPhone}
                                        keyboardType="phone-pad"
                                        style={{ marginBottom: 24 }}
                                    />
                                    <View style={{ gap: 10 }}>
                                        <Button
                                            mode="contained"
                                            disabled={!manualPhone.trim()}
                                            onPress={addPersonManual}
                                            contentStyle={{ paddingVertical: 4 }}
                                        >
                                            Add Person
                                        </Button>
                                        <Button mode="outlined" onPress={() => setView("main")}>
                                            Back
                                        </Button>
                                    </View>
                                </View>
                            </Pressable>
                        </ScrollView>
                    )}

                    {view === "auto" && (
                        <>
                            {contacts.length === 0 ? (
                                <View style={{ gap: 12 }}>
                                    {contactsError && (
                                        <HelperText type="error" visible>
                                            {contactsError}
                                        </HelperText>
                                    )}
                                    <Button
                                        mode="contained"
                                        onPress={loadContacts}
                                        loading={contactsLoading}
                                        contentStyle={{ paddingVertical: 4 }}
                                    >
                                        Load Contacts
                                    </Button>
                                    <Button mode="outlined" onPress={() => setView("main")}>
                                        Back
                                    </Button>
                                </View>
                            ) : (
                                <>
                                    <TextInput
                                        label="Search"
                                        value={contactSearch}
                                        onChangeText={handleContactSearch}
                                        left={<TextInput.Icon icon="magnify" />}
                                        style={{ marginBottom: 14 }}
                                    />
                                    <ScrollView style={{ height: 420 }} showsVerticalScrollIndicator={false}>
                                        {filteredContacts.map((contact, index) => {
                                            const selected = selectedContacts.some((c) => c.id === contact.id);;
                                            return (
                                                <Pressable
                                                    key={contact.id ?? index}
                                                    onPress={() => toggleContactSelection(contact)}
                                                    style={{
                                                        flexDirection: "row",
                                                        alignItems: "center",
                                                        padding: 12,
                                                        marginBottom: 8,
                                                        borderRadius: 10,
                                                        borderWidth: 1,
                                                        borderColor: selected
                                                            ? theme.colors.primary
                                                            : theme.colors.outlineVariant,
                                                        backgroundColor: selected
                                                            ? theme.colors.primaryContainer
                                                            : "transparent",
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 18,
                                                            marginRight: 12,
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <PersonAvatar
                                                            imageUri={
                                                                contact.image?.base64
                                                                    ? `data:image/jpeg;base64,${contact.image.base64}`
                                                                    : (contact.imageAvailable ? contact.image?.uri : undefined)
                                                            }
                                                            name={contact.name ?? null}
                                                            size={36}
                                                            bgColor={selected ? theme.colors.primary : theme.colors.surfaceVariant}
                                                            textColor={selected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                                                        />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                                                            {contact.name ?? "Unknown"}
                                                        </Text>
                                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                            {contact.phoneNumbers?.[0]?.number ?? ""}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                    <View style={{ marginTop: 12 }}>
                                        <Text variant="labelSmall" style={{ marginBottom: 8 }}>
                                            Selected ({selectedContacts.length})
                                        </Text>

                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {selectedContacts.map((c, i) => (
                                                <View key={i} style={{ alignItems: "center", marginRight: 12 }}>
                                                    <View
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 20,
                                                            overflow: "hidden",
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        <PersonAvatar
                                                            imageUri={
                                                                c.image?.base64
                                                                    ? `data:image/jpeg;base64,${c.image.base64}`
                                                                    : c.image?.uri
                                                            }
                                                            name={c.name ?? null}
                                                            size={40}
                                                            bgColor={theme.colors.primaryContainer}
                                                            textColor={theme.colors.primary}
                                                        />
                                                    </View>
                                                    <Text variant="labelSmall" numberOfLines={1} style={{ maxWidth: 50 }}>
                                                        {c.name ?? "N/A"}
                                                    </Text>
                                                </View>
                                            ))}
                                        </ScrollView>

                                        <Button
                                            mode="contained"
                                            onPress={confirmImportContacts}
                                            style={{ marginTop: 12 }}
                                            contentStyle={{ paddingVertical: 4 }}
                                        >
                                            Add Selected
                                        </Button>
                                    </View>
                                    <Button mode="outlined" onPress={() => setView("main")} style={{ marginTop: 12 }}>
                                        Back
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </View>
            </BottomSheet>
        </View>
    );
}
