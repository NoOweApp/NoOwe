import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Modal,
    View
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

//declaring types
type Person = {
    name: string | null;
    phone: string;
}
type Item = {
    name: string;
    cost: number;
    assignees: Person[];
}

export default function Manual() {
    const router = useRouter();
    const theme = useTheme();

    type PeopleModalView = "main" | "manual" | "auto";
    const [peopleModalVisible, setPeopleModalVisible] = useState(false);
    const [view, setView] = useState<PeopleModalView>("main");

    const [people, setPeople] = useState<Person[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    const addPersonManual = () => {

    };
    const addPersonAuto = () => {

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
        </View>
    )

}