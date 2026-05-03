import React from "react";
import {
    Modal,
    ScrollView,
    View,
} from "react-native";
import { Button, Divider, IconButton, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Person = {
    name: string | null;
    phone: string;
    imageUri?: string;
    settled: boolean;
    oweAmount: number;
};

type Item = {
    name: string;
    cost: number;
    owners: Person[];
};

type Props = {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    people: Person[];
    items: Item[];
    tax: number;
    tip: number;
    total: number;
};

export function BillConfirmationModal({
    visible,
    onClose,
    onConfirm,
    people,
    items,
    tax,
    tip,
    total,
}: Props) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const itemsSubtotal = items.reduce((sum, item) => sum + item.cost, 0);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: theme.colors.backdrop,
                }}
            >
                <View
                    style={{
                        backgroundColor: theme.colors.surface,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        paddingTop: 12,
                        paddingHorizontal: 24,
                        paddingBottom: insets.bottom + 24,
                        maxHeight: "90%",
                    }}
                >
                    {/* Drag handle */}
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

                    {/* Header */}
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                        }}
                    >
                        <Text
                            variant="titleLarge"
                            style={{ color: theme.colors.onSurface, fontWeight: "700" }}
                        >
                            Confirm Bill
                        </Text>
                        <IconButton
                            icon="close"
                            size={20}
                            iconColor={theme.colors.onSurfaceVariant}
                            onPress={onClose}
                        />
                    </View>

                    <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}
                    >
                        Review everything before submitting. Go back to make changes.
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* People */}
                        <Text
                            variant="labelSmall"
                            style={{
                                color: theme.colors.onSurfaceVariant,
                                textTransform: "uppercase",
                                letterSpacing: 1.2,
                                marginBottom: 12,
                            }}
                        >
                            People ({people.length})
                        </Text>

                        <View
                            style={{
                                backgroundColor: theme.colors.surfaceVariant,
                                borderRadius: 14,
                                overflow: "hidden",
                                marginBottom: 24,
                            }}
                        >
                            {people.map((person, index) => (
                                <View
                                    key={index}
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: index < people.length - 1 ? 1 : 0,
                                        borderBottomColor: theme.colors.outlineVariant,
                                    }}
                                >
                                    <View>
                                        <Text
                                            variant="bodyMedium"
                                            style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                                        >
                                            {person.name ?? "N/A"}
                                            {index === 0 ? "  (you)" : ""}
                                        </Text>
                                        {person.phone ? (
                                            <Text
                                                variant="bodySmall"
                                                style={{ color: theme.colors.onSurfaceVariant }}
                                            >
                                                {person.phone}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {index !== 0 && (
                                        <Text
                                            variant="bodyMedium"
                                            style={{ color: theme.colors.primary, fontWeight: "700" }}
                                        >
                                            owes ${person.oweAmount.toFixed(2)}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Items */}
                        <Text
                            variant="labelSmall"
                            style={{
                                color: theme.colors.onSurfaceVariant,
                                textTransform: "uppercase",
                                letterSpacing: 1.2,
                                marginBottom: 12,
                            }}
                        >
                            Items ({items.length})
                        </Text>

                        <View
                            style={{
                                backgroundColor: theme.colors.surfaceVariant,
                                borderRadius: 14,
                                overflow: "hidden",
                                marginBottom: 24,
                            }}
                        >
                            {items.map((item, index) => (
                                <View
                                    key={index}
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: index < items.length - 1 ? 1 : 0,
                                        borderBottomColor: theme.colors.outlineVariant,
                                    }}
                                >
                                    <View style={{ flex: 1, marginRight: 12 }}>
                                        <Text
                                            variant="bodyMedium"
                                            style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                                        >
                                            {item.name}
                                        </Text>
                                        <Text
                                            variant="bodySmall"
                                            style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                                        >
                                            {item.owners.length > 0
                                                ? item.owners.map((p) => p.name ?? "N/A").join(", ")
                                                : "No one assigned"}
                                        </Text>
                                    </View>
                                    <Text
                                        variant="bodyMedium"
                                        style={{ color: theme.colors.primary, fontWeight: "700" }}
                                    >
                                        ${item.cost.toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Totals breakdown */}
                        <Text
                            variant="labelSmall"
                            style={{
                                color: theme.colors.onSurfaceVariant,
                                textTransform: "uppercase",
                                letterSpacing: 1.2,
                                marginBottom: 12,
                            }}
                        >
                            Summary
                        </Text>

                        <View
                            style={{
                                backgroundColor: theme.colors.surfaceVariant,
                                borderRadius: 14,
                                paddingVertical: 4,
                                paddingHorizontal: 16,
                                marginBottom: 28,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    paddingVertical: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.colors.outlineVariant,
                                }}
                            >
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Subtotal
                                </Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                                    ${itemsSubtotal.toFixed(2)}
                                </Text>
                            </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    paddingVertical: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.colors.outlineVariant,
                                }}
                            >
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Tax
                                </Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                                    ${tax.toFixed(2)}
                                </Text>
                            </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    paddingVertical: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.colors.outlineVariant,
                                }}
                            >
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                    Tip
                                </Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: "600" }}>
                                    ${tip.toFixed(2)}
                                </Text>
                            </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    paddingVertical: 14,
                                }}
                            >
                                <Text
                                    variant="titleSmall"
                                    style={{ color: theme.colors.onSurface, fontWeight: "700" }}
                                >
                                    Total
                                </Text>
                                <Text
                                    variant="titleSmall"
                                    style={{ color: theme.colors.primary, fontWeight: "800" }}
                                >
                                    ${total.toFixed(2)}
                                </Text>
                            </View>
                        </View>

                    </ScrollView>

                    {/* Buttons */}
                    <Button
                        mode="contained"
                        onPress={onConfirm}
                        contentStyle={{ paddingVertical: 6 }}
                        style={{ marginBottom: 10 }}
                    >
                        Confirm & Submit
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={onClose}
                    >
                        Go Back
                    </Button>
                </View>
            </View>
        </Modal>
    );
}