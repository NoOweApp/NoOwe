import React from "react";
import { Modal, ScrollView, View } from "react-native";
import {
  Avatar,
  Button,
  Divider,
  Icon,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
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
  discount: number;
  total: number;
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function SectionHeader({
  icon,
  label,
  theme,
}: {
  icon: string;
  label: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <Icon source={icon} size={14} color={theme.colors.onSurfaceVariant} />
      <Text
        variant="labelSmall"
        style={{
          color: theme.colors.onSurfaceVariant,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function BillConfirmationModal({
  visible,
  onClose,
  onConfirm,
  people,
  items,
  tax,
  tip,
  discount,
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
            maxHeight: "92%",
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
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.colors.primaryContainer,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Icon source="receipt" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onSurface, fontWeight: "700" }}
              >
                Confirm Bill
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Review everything before submitting
              </Text>
            </View>
            <IconButton
              icon="close"
              size={20}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={onClose}
              style={{ margin: 0 }}
            />
          </View>

          <Divider style={{ marginBottom: 20 }} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* People */}
            <SectionHeader
              icon="account-group"
              label={`People (${people.length})`}
              theme={theme}
            />

            <View
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 22,
              }}
            >
              {people.map((person, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderBottomWidth: index < people.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.outlineVariant,
                  }}
                >
                  <Avatar.Text
                    size={38}
                    label={getInitials(person.name)}
                    style={{
                      backgroundColor: theme.colors.primaryContainer,
                      marginRight: 12,
                    }}
                    labelStyle={{
                      color: theme.colors.onPrimaryContainer,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <Text
                        variant="bodyMedium"
                        style={{
                          color: theme.colors.onSurface,
                          fontWeight: "600",
                        }}
                      >
                        {person.name ?? "N/A"}
                      </Text>
                      {index === 0 && (
                        <View
                          style={{
                            backgroundColor: theme.colors.secondaryContainer,
                            borderRadius: 10,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.onSecondaryContainer,
                              fontWeight: "600",
                            }}
                          >
                            you
                          </Text>
                        </View>
                      )}
                    </View>
                    {person.phone ? (
                      <Text
                        variant="bodySmall"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          marginTop: 1,
                        }}
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
            <SectionHeader
              icon="format-list-bulleted"
              label={`Items (${items.length})`}
              theme={theme}
            />

            <View
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 22,
              }}
            >
              {items.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderBottomWidth: index < items.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.outlineVariant,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: "600",
                      }}
                    >
                      {item.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 3,
                      }}
                    >
                      <Icon
                        source="account"
                        size={12}
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {item.owners.length > 0
                          ? item.owners.map((p) => p.name ?? "N/A").join(", ")
                          : "No one assigned"}
                      </Text>
                    </View>
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

            {/* Summary */}
            <SectionHeader icon="calculator" label="Summary" theme={theme} />

            <View
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 28,
              }}
            >
              {[
                {
                  icon: "tag-outline",
                  label: "Subtotal",
                  value: itemsSubtotal,
                },
                { icon: "bank-outline", label: "Tax", value: tax },
                { icon: "hand-coin-outline", label: "Tip", value: tip },
                {
                  icon: "ticket-percent-outline",
                  label: "Discount",
                  value: !isNaN(discount) ? discount : 0,
                },
              ].map(({ icon, label, value }, i) => (
                <View
                  key={label}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outlineVariant,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Icon
                      source={icon}
                      size={16}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {label}
                    </Text>
                  </View>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color:
                        label === "Discount"
                          ? theme.colors.error
                          : theme.colors.onSurface,
                      fontWeight: "600",
                    }}
                  >
                    {label === "Discount" ? "-" : ""}$
                    {Math.abs(value).toFixed(2)}
                  </Text>
                </View>
              ))}

              {/* Total row — highlighted */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  backgroundColor: theme.colors.primaryContainer,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Icon source="sigma" size={18} color={theme.colors.primary} />
                  <Text
                    variant="titleSmall"
                    style={{
                      color: theme.colors.onPrimaryContainer,
                      fontWeight: "700",
                    }}
                  >
                    Total
                  </Text>
                </View>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.primary, fontWeight: "800" }}
                >
                  ${total.toFixed(2)}
                </Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={onConfirm}
              icon="check-circle-outline"
              contentStyle={{ paddingVertical: 6 }}
              style={{ marginBottom: 10 }}
            >
              Confirm & Submit
            </Button>
            <Button mode="outlined" onPress={onClose} icon="arrow-left">
              Go Back
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
