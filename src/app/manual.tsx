import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Modal,
    Pressable,
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

    const [peopleModalVisible, setPeopleModalVisible] = useState(false);
    const [manualPersonModalVisible, setManualPersonModalVisible] = useState(false);
    const [autoPersonModalVisible, setAutoPersonModalVisible] = useState(false)

    const addPersoManual = () => {

    };
    const addPersoAuto = () => {

    };


    return(
        <View>
            <Text>Manual Bill Entry</Text>

            <Button onPress={() => setPeopleModalVisible(true)}>Open People</Button>
            <Modal visible={peopleModalVisible}>
                <Pressable onPress={() => setPeopleModalVisible(false)}>
                    <Button onPress={() => setManualPersonModalVisible(true)}>Add Person Manual</Button>
                    <Button onPress={() => setAutoPersonModalVisible(true)}>Add Person Auto</Button>
                    <Button onPress={() => setPeopleModalVisible(false)}>Close</Button>
                </Pressable>
                <Modal visible={manualPersonModalVisible}>
                    <Button onPress={() => setManualPersonModalVisible(false)}>Close</Button>
                </Modal>
                <Modal visible={autoPersonModalVisible}>
                    <Button onPress={() => setAutoPersonModalVisible(false)}>Close</Button>
                </Modal>
            </Modal>
        </View>
    )

}