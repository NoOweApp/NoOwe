import { validateLogin } from "@/validation/helpers";
import { Directory, File, Paths } from "expo-file-system/next";
import { Redirect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Loading from "../components/Loading"; //animation

const PAYMENT_OPTIONS = ["Venmo", "PayPal", "Zelle", "Cash App"];
const TOTAL_STEPS = 4;

const STEP_QUESTIONS = [
  "What's your first name?",
  "And your last name?",
  "How do you pay?",
  "Almost there!",
];

const STEP_SUBTITLES = [
  "This is how you'll appear to friends.",
  "Optional, leave blank to skip.",
  "Select all that apply.",
  "Enter your username or number for each.",
];

export default function HomeLogin() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [paymentUsernames, setPaymentUsernames] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // change this use state to true for testing animation

  const nooweFolderPath = new Directory(Paths.document, "NoOwe");
  const settingsJson = new File(nooweFolderPath, "settings.json");

  //comment out this if block to test the loading animation
  if (settingsJson.exists) {
    return <Redirect href="/dashboard" />;
  }

  const togglePayment = (value: string) => {
    setSelectedMethods((prev) => {
      if (prev.includes(value)) {
        const updated = prev.filter((m) => m !== value);
        setPaymentUsernames((usernames) => {
          const copy = { ...usernames };
          delete copy[value];
          return copy;
        });
        return updated;
      }
      return [...prev, value];
    });
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return firstName.trim().length > 0;
      case 1:
        return true;
      case 2:
        return selectedMethods.length > 0;
      case 3:
        return selectedMethods.every(
          (m) => paymentUsernames[m] && paymentUsernames[m].trim().length > 0,
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    Keyboard.dismiss();
    setError(null);
    if (step === 0) {
      const trimmed = firstName.trim();
      if (trimmed.length < 2 || trimmed.length > 25) {
        setError("First name must be between 2 and 25 characters.");
        return;
      }
    }

    if (step === 1) {
      const trimmed = lastName.trim();
      if (trimmed.length > 0 && (trimmed.length < 2 || trimmed.length > 25)) {
        setError("Last name must be between 2 and 25 characters.");
        return;
      }
    }

    if (step === 3) {
      for (const method of selectedMethods) {
        const value = (paymentUsernames[method] || "").trim();
        if (method === "Zelle") {
          const phone = value.replace(/\D/g, "");
          if (phone.length < 10 || phone.length > 11) {
            setError("Zelle must be a valid phone number.");
            return;
          }
        }
        if (value.length > 40) {
          setError("Username must be 40 characters or fewer.");
          return;
        }
      }
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = () => {
    setError(null);

    try {
      setIsLoading(true); // ← show loading animation
      for (let i = 0; i < selectedMethods.length; i++) {
        const method = selectedMethods[i];
        const value = (paymentUsernames[method] || "").trim();
        if (method === "Zelle") {
          const phone = value.replace(/\D/g, "");
          if (phone.length < 10 || phone.length > 11) {
            throw new Error("Zelle must be a valid phone number.");
          }
        }
      }
      const paymentMethods = selectedMethods.map((method) => ({
        service: method.toLowerCase().trim(),
        user: paymentUsernames[method] || "",
      }));
      const profile = validateLogin(
        firstName,
        lastName.trim().length === 0 ? null : lastName,
        paymentMethods,
      );
      if (!nooweFolderPath.exists) {
        nooweFolderPath.create();
        console.log("Folder created");
      }
      if (!settingsJson.exists) {
        settingsJson.create();
      }
      settingsJson.write(JSON.stringify(profile));
      console.log("Write complete");
      router.push("/dashboard");
      console.log(JSON.stringify(profile, null, 2));
    } catch (e: any) {
      setIsLoading(false); // hide on error
      setError(e.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* ── Branding (fixed — never moves with keyboard) ── */}
        <View
          style={{
            alignItems: "center",
            paddingTop: insets.top + 24,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              overflow: "hidden",
              marginBottom: 12,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Image
              source={require("../assets/logo.png")}
              style={{ width: 72, height: 72 }}
              resizeMode="cover"
            />
          </View>

          <Text
            variant="headlineMedium"
            style={{
              color: theme.colors.primary,
              fontWeight: "800",
              letterSpacing: -0.5,
            }}
          >
            NoOwe
          </Text>

          {/* Step progress dots */}
          <View style={{ flexDirection: "row", gap: 6, marginTop: 18 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={{
                  height: 6,
                  width: i === step ? 24 : 6,
                  borderRadius: 3,
                  backgroundColor:
                    i <= step ? theme.colors.primary : theme.colors.outline,
                }}
              />
            ))}
          </View>
        </View>

        {/* ── Step content ── */}
        <View style={{ flex: 1, paddingHorizontal: 28 }}>
          {/* Question heading */}
          <Text
            variant="headlineSmall"
            style={{
              color: theme.colors.onBackground,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            {STEP_QUESTIONS[step]}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 28 }}
          >
            {STEP_SUBTITLES[step]}
          </Text>

          {/* Step 0 — First name */}
          {step === 0 && (
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={canAdvance() ? handleNext : undefined}
            />
          )}

          {/* Step 1 — Last name (optional) */}
          {step === 1 && (
            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />
          )}

          {/* Step 2 — Payment method selection */}
          {step === 2 && (
            <View style={{ gap: 10 }}>
              {PAYMENT_OPTIONS.map((method) => {
                const selected = selectedMethods.includes(method);
                return (
                  <Pressable
                    key={method}
                    onPress={() => togglePayment(method)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 16,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.colors.surface,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: selected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                        backgroundColor: selected
                          ? theme.colors.primary
                          : "transparent",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 14,
                      }}
                    >
                      {selected && (
                        <Text
                          style={{
                            color: theme.colors.onPrimary,
                            fontSize: 12,
                            fontWeight: "800",
                          }}
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text
                      variant="bodyLarge"
                      style={{
                        color: selected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                        fontWeight: selected ? "600" : "400",
                      }}
                    >
                      {method}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Step 3 — Payment usernames */}
          {step === 3 && (
            <View style={{ gap: 12 }}>
              {selectedMethods.map((method, i) => (
                <TextInput
                  key={method}
                  label={
                    method === "Zelle" ? "Zelle Number" : `${method} Username`
                  }
                  value={paymentUsernames[method] || ""}
                  onChangeText={(text) =>
                    setPaymentUsernames((prev) => ({ ...prev, [method]: text }))
                  }
                  keyboardType={method === "Zelle" ? "phone-pad" : "default"}
                  autoFocus={i === 0}
                />
              ))}
            </View>
          )}

          {error && (
            <HelperText type="error" visible={!!error} style={{ marginTop: 8 }}>
              {error}
            </HelperText>
          )}

          {/* Navigation — always directly below the input */}
          <View style={{ marginTop: 24, gap: 10 }}>
            <Button
              mode="contained"
              onPress={handleNext}
              disabled={!canAdvance()}
              contentStyle={{ paddingVertical: 6 }}
            >
              {step === TOTAL_STEPS - 1 ? "Get Started" : "Next"}
            </Button>

            {step === 1 && (
              <Button
                mode="text"
                onPress={handleNext}
                textColor={theme.colors.onSurfaceVariant}
              >
                Skip
              </Button>
            )}

            {step > 0 && (
              <Button
                mode="text"
                onPress={handleBack}
                textColor={theme.colors.onSurfaceVariant}
              >
                Back
              </Button>
            )}
          </View>

          {/* ── Loading overlay ── */}
          {isLoading && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: theme.colors.background,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Loading />
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
