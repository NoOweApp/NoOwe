import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    View
} from "react-native";
import { Button, Checkbox, HelperText, Text, TextInput, useTheme } from "react-native-paper";

//declaring types
type Person = {
    name: string | null;
    phone: string;
}
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
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [view, setView] = useState<PeopleModalView>("main");

    const [people, setPeople] = useState<Person[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    const [itemName, setItemName] = useState("");
    const [itemCost, setItemCost] = useState("");
    const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
    const [itemError, setItemError] = useState("");

    const addPersonManual = () => {

    };
    const addPersonAuto = () => {

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
                    {view === "main" && (
                        <>
                            <Button onPress={() => setView("manual")}>
                                Add Person Manual
                            </Button>
                            <Button onPress={() => setView("auto")}>
                                Add Person Auto
                            </Button>
                        </>
                    )}
                    {view === "manual" && (
                        <>
                            <Text>Manual Entry</Text>
                            <Button onPress={() => {
                                addPersonManual();
                                setView("main");
                            }}>Add Person</Button>
                            <Button onPress={() => setView("main")}>Back</Button>
                        </>
                    )}
                    {view === "auto" && (
                        <>
                            <Text>Automatic Import</Text>
                            <Button onPress={() => {
                                addPersonAuto();
                                setView("main");
                            }}>Import Contact</Button>
                            <Button onPress={() => setView("main")}>Back</Button>
                        </>
                    )}
                    <Button onPress={() => {
                        setPeopleModalVisible(false);
                        setView("main");
                    }}>Close</Button>
                </View>
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
    )

}