import { BillConfirmationModal } from "@/src/components/BillConfirmationModal";
import { BottomSheet } from "@/src/components/BottomSheet";
import { useAppTheme } from "@/src/context/ThemeContext";
import * as helpers from "@/validation/helpers";
import * as Contacts from "expo-contacts";
import { Directory, File, Paths } from "expo-file-system/next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import React, { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Button,
  Divider,
  HelperText,
  Icon,
  IconButton,
  Text,
  TextInput,
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

function normalizeImageUri(uri?: string): string | undefined {
  if (!uri) return undefined;
  // Already a data URI or has a scheme — leave it alone
  if (
    uri.startsWith("data:") ||
    uri.startsWith("file://") ||
    uri.startsWith("http")
  ) {
    return uri;
  }
  // Raw filesystem path from expo-contacts on iOS — needs file:// prefix
  if (uri.startsWith("/")) {
    return `file://${uri}`;
  }
  return uri;
}

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
  const normalizedUri = normalizeImageUri(imageUri);

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: bgColor,
      }}
    >
      {showImage && normalizedUri ? (
        <Image
          source={{ uri: normalizedUri }}
          style={{
            width: size,
            height: size,
            position: "absolute",
            top: 0,
            left: 0,
          }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Text style={{ color: textColor, fontWeight: "700", fontSize }}>
          {initial}
        </Text>
      )}
    </View>
  );
}

export default function Manual() {
  const router = useRouter();
  const theme = useTheme();
  const { mode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { temp_bill, draft_id } = useLocalSearchParams<{
    temp_bill?: string;
    draft_id?: string;
  }>();
  const currentDraftId =
    typeof draft_id === "string" && draft_id.trim() !== "" ? draft_id : null;

  type PeopleModalView = "main" | "manual" | "auto";
  const [peopleModalVisible, setPeopleModalVisible] = useState(false);
  const [view, setView] = useState<PeopleModalView>("main");
  const [people, setPeople] = useState<Person[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [splitEvenlyEnabled, setSplitEvenlyEnabled] = useState(false);
  const [preEvenSplitItems, setPreEvenSplitItems] = useState<Item[] | null>(
    null,
  );

  // Bottom-sheet height animation
  const contentHeightAnim = useRef(new Animated.Value(0)).current;
  const measuredHeights = useRef<Partial<Record<PeopleModalView, number>>>({});
  const [contentAnimReady, setContentAnimReady] = useState(false);
  const pendingTargetView = useRef<PeopleModalView | null>(null);
  const currentViewRef = useRef<PeopleModalView>("main");

  //Bill confirmation modal states
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [confirmedPeople, setConfirmedPeople] = useState<Person[]>([]);
  const [discardDialogVisible, setDiscardDialogVisible] = useState(false);
  const [deleteDraftDialogVisible, setDeleteDraftDialogVisible] =
    useState(false);

  useEffect(() => {
    if (currentDraftId) return;
    if (typeof temp_bill === "string" && temp_bill.trim() !== "") {
      try {
        const bill = JSON.parse(temp_bill);
        if (bill && Array.isArray(bill.receipt_items)) {
          setItems(
            bill.receipt_items.map((item: any) => ({
              name: item.item_name,
              cost: item.item_cost,
              owners: [],
            })),
          );
          if (bill.tax && bill.tax > 0) setTax(bill.tax.toFixed(2));
          if (bill.tip && bill.tip > 0) setTip(bill.tip.toFixed(2));
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }, [temp_bill]);

  useEffect(() => {
    if (currentDraftId) return;
    const loadProfile = async () => {
      try {
        const nooweFolderPath = new Directory(Paths.document, "NoOwe");
        const settingsJson = new File(nooweFolderPath, "settings.json");
        if (settingsJson.exists) {
          const text = await settingsJson.text();
          const profile = JSON.parse(text);
          const firstName = profile.firstName ?? profile.first_name ?? "";
          if (firstName) {
            setPeople([
              { name: firstName, phone: "", settled: true, oweAmount: 0 },
            ]);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!currentDraftId) return;
    const loadDraft = async () => {
      try {
        const folder = new Directory(Paths.document, "NoOwe");
        const draftsFile = new File(folder, "draft_bills.json");
        if (!draftsFile.exists) return;
        const text = await draftsFile.text();
        const drafts = JSON.parse(text);
        const draft = drafts.find((d: any) => d.draftId === currentDraftId);
        if (!draft) return;
        setBillName(draft.billName ?? "");
        const loadedPeople: Person[] = draft.people ?? [];
        setPeople(loadedPeople);
        setItems(
          (draft.items ?? []).map((item: any) => ({
            name: item.name,
            cost: item.cost,
            owners: (item.ownerIndices ?? [])
              .map((i: number) => loadedPeople[i])
              .filter(Boolean),
          })),
        );
        setTax(draft.tax ?? "");
        setTip(draft.tip ?? "");
        setDiscount(draft.discount ?? "");
      } catch (e) {
        // ignore
      }
    };
    loadDraft();
  }, []);

  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>(
    [],
  );
  const [contactSearch, setContactSearch] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Contacts.Contact[]>(
    [],
  );

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
      setContactsError("Name must be between 2 and 25 chracters.");
      return;
    }

    setManualName(manualName.trim());

    setPeople((prev) => [
      ...prev,
      {
        name: manualName.trim() || null,
        phone: manualPhone.trim(),
        settled: false,
        oweAmount: 0,
      },
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
  const [tax, setTax] = useState("");
  const [tip, setTip] = useState("");
  const [discount, setDiscount] = useState("");
  const [taxTipDiscError, setTaxTipDiscError] = useState("");
  const mainScrollRef = useRef<ScrollView>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const [billName, setBillName] = useState("");

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) =>
      setKbHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(hideEvent, () => setKbHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
      fields: [
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Name,
        Contacts.Fields.Image,
      ],
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
        const full = await Contacts.getContactByIdAsync(contact.id, [
          Contacts.Fields.Image,
        ]);
        if (full?.image?.base64) {
          imageUri = `data:image/jpeg;base64,${full.image.base64}`;
        } else if (full?.image?.uri) {
          imageUri = full.image.uri;
        }
      } catch {
        imageUri = contact.image?.uri;
      }
    }

    setPeople((prev) => [
      ...prev,
      {
        name: contact.name ?? null,
        phone,
        imageUri,
        settled: false,
        oweAmount: 0,
      },
    ]);
  };

  const confirmImportContacts = async () => {
    const newPeople: Person[] = [];

    for (const contact of selectedContacts) {
      const phone = contact.phoneNumbers?.[0]?.number ?? "";
      let imageUri: string | undefined;

      if (contact.imageAvailable && contact.id) {
        try {
          const full = await Contacts.getContactByIdAsync(contact.id, [
            Contacts.Fields.Image,
          ]);
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
        settled: false,
        oweAmount: 0,
      });
    }

    setPeople((prev) => [...prev, ...newPeople]);

    setSelectedContacts([]);

    Alert.alert("Success", "Contacts Added");

    switchView("main"); // or close modal if you want
  };

  const removeContact = (index: number) => {
    const removedPerson = people[index];

    setPeople((prev) => prev.filter((_, i) => i !== index));

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        owners: item.owners.filter((owner) => owner !== removedPerson),
      })),
    );

    setSelectedPeople((prev) =>
      prev.filter((person) => person !== removedPerson),
    );
  };

  const isContactSelected = (contact: Contacts.Contact) =>
    people.some(
      (p) =>
        p.phone === (contact.phoneNumbers?.[0]?.number ?? "") &&
        p.name === (contact.name ?? null),
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
    const updatedItem: Item = {
      name: itemName.trim(),
      cost,
      owners: selectedPeople,
    };
    if (editingItemIndex !== null) {
      setItems((prev) =>
        prev.map((item, i) => (i === editingItemIndex ? updatedItem : item)),
      );
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

  const toggleSplitEvenly = (value: boolean) => {
    if (value) {
      setPreEvenSplitItems(items);
      setItems((prev) => prev.map((item) => ({ ...item, owners: people })));
      setSplitEvenlyEnabled(true);
    } else {
      if (preEvenSplitItems !== null) setItems(preEvenSplitItems);
      setPreEvenSplitItems(null);
      setSplitEvenlyEnabled(false);
    }
  };

  const handleViewLayout = (viewName: PeopleModalView, height: number) => {
    if (height === 0) return;
    const prev = measuredHeights.current[viewName];
    measuredHeights.current[viewName] = height;

    if (!contentAnimReady) {
      contentHeightAnim.setValue(height);
      setContentAnimReady(true);
      return;
    }

    const isCurrent = currentViewRef.current === viewName;
    const heightChanged = prev !== height;
    const isPending = pendingTargetView.current === viewName;

    if (isCurrent && (heightChanged || isPending)) {
      pendingTargetView.current = null;
      Animated.spring(contentHeightAnim, {
        toValue: height,
        useNativeDriver: false,
        tension: 65,
        friction: 11,
      }).start();
    }
  };

  const switchView = (next: PeopleModalView) => {
    currentViewRef.current = next;
    const known = measuredHeights.current[next];
    if (contentAnimReady && known !== undefined) {
      Animated.spring(contentHeightAnim, {
        toValue: known,
        useNativeDriver: false,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      pendingTargetView.current = next;
    }
    setView(next);
  };

  // Helper to distribute discount proportionally across people
  const applyDiscountProportionally = <T,>(
    result: Map<Person, T>,
    discountCents: number,
    getAmount: (value: T) => number,
    updateAmount: (value: T, deductCents: number) => T,
    sortFn: (a: Person, b: Person) => number,
  ) => {
    if (discountCents === 0) return;

    let discountRemainder = discountCents;
    const peopleWithEntries = people.filter((p) => result.has(p)).sort(sortFn);

    for (let i = 0; i < peopleWithEntries.length; i++) {
      const person = peopleWithEntries[i];
      const value = result.get(person)!;
      const amount = getAmount(value);
      const proportion = amount / (itemsTotal + taxNum + tipNum);
      const shareCents =
        i < peopleWithEntries.length - 1
          ? Math.round(discountCents * proportion)
          : discountRemainder;
      discountRemainder -= shareCents;
      result.set(person, updateAmount(value, shareCents));
    }
  };

  const saveDraft = async (existingDraftId?: string | null) => {
    const draftId = existingDraftId ?? Date.now().toString();
    const draft = {
      draftId,
      billName,
      people,
      items: items.map((item) => ({
        name: item.name,
        cost: item.cost,
        ownerIndices: item.owners.map((owner) => people.indexOf(owner)),
      })),
      tax,
      tip,
      discount,
      savedAt: new Date().toISOString(),
    };
    const folder = new Directory(Paths.document, "NoOwe");
    if (!folder.exists) folder.create();
    const draftsFile = new File(folder, "draft_bills.json");
    let existing: (typeof draft)[] = [];
    if (draftsFile.exists) {
      const text = await draftsFile.text();
      existing = JSON.parse(text);
    }
    const idx = existing.findIndex((d: any) => d.draftId === draftId);
    if (idx !== -1) {
      existing[idx] = draft;
    } else {
      existing.push(draft);
    }
    draftsFile.write(JSON.stringify(existing));
    return draftId;
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const folder = new Directory(Paths.document, "NoOwe");
      const draftsFile = new File(folder, "draft_bills.json");
      if (!draftsFile.exists) return;
      const text = await draftsFile.text();
      const existing = JSON.parse(text);
      const updated = existing.filter((d: any) => d.draftId !== draftId);
      draftsFile.write(JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleBackPress = () => {
    if (currentDraftId) {
      saveDraft(currentDraftId).then(() => router.back());
    } else {
      const hasContent =
        billName.trim().length > 0 || items.length > 0 || people.length > 1;
      if (hasContent) {
        setDiscardDialogVisible(true);
      } else {
        router.back();
      }
    }
  };

  const buildConfirmedPeople = () => {
    const result = new Map<Person, number>();

    for (const item of items) {
      //loop through all items
      const { cost, owners } = item; //destructure each item into its cost and its owners
      if (!owners || owners.length === 0) continue;
      const costInCents = Math.round(cost * 100);
      const splitInCents = Math.floor(costInCents / owners.length);
      let remainder = costInCents % owners.length;
      for (const owner of owners) {
        let finalCents = splitInCents;
        if (remainder > 0) {
          finalCents += 1;
          remainder -= 1;
        }
        result.set(
          owner,
          Math.round(((result.get(owner) ?? 0) + finalCents / 100) * 100) / 100,
        );
      }
    }

    if (itemsTotal > 0 && (taxNum > 0 || tipNum > 0)) {
      const taxTipTotalCents = Math.round((taxNum + tipNum) * 100);
      let taxTipRemainder = taxTipTotalCents;
      const peopleWithEntries = people
        .filter((p) => result.has(p))
        .sort((a, b) => (result.get(b) ?? 0) - (result.get(a) ?? 0));
      for (let i = 0; i < peopleWithEntries.length; i++) {
        const person = peopleWithEntries[i];
        const itemShare = result.get(person) ?? 0;
        const proportion = itemShare / itemsTotal;
        const shareCents =
          i < peopleWithEntries.length - 1
            ? Math.round(taxTipTotalCents * proportion)
            : taxTipRemainder;
        taxTipRemainder -= shareCents;
        result.set(
          person,
          Math.round((itemShare + shareCents / 100) * 100) / 100,
        );
      }
    }

    // Distribute discount proportionally (reduces what people owe)
    if (discountNum > 0 && itemsTotal > 0) {
      const discountCents = Math.round(discountNum * 100);
      applyDiscountProportionally(
        result,
        discountCents,
        (val) => val, // amount is already a number
        (val, deductCents) => Math.round((val - deductCents / 100) * 100) / 100,
        (a, b) => (result.get(b) ?? 0) - (result.get(a) ?? 0), // descending by amount
      );
    }

    return people.map((person) => ({
      ...person,
      oweAmount: result.get(person) ?? 0,
    }));
  };

  const submitBill = async () => {
    const result = new Map<
      Person,
      {
        cost: number;
        items: { name: string; percentage: number; cost: number }[];
      }
    >();

    for (const item of items) {
      const { name, cost, owners } = item;
      if (!owners || owners.length === 0) continue;

      const costInCents = Math.round(cost * 100);
      const splitInCents = Math.floor(costInCents / owners.length);
      let remainder = costInCents % owners.length;

      for (const owner of owners) {
        if (!result.has(owner)) {
          result.set(owner, { cost: 0, items: [] });
        }

        let finalCents = splitInCents;
        if (remainder > 0) {
          finalCents += 1;
          remainder -= 1;
        }

        const finalCost = finalCents / 100;
        const entry = result.get(owner)!;
        entry.items.push({
          name,
          percentage: 1 / owners.length,
          cost: finalCost,
        });
        entry.cost = Math.round((entry.cost + finalCost) * 100) / 100;
      }
    }

    // Distribute tax and tip proportionally
    if (itemsTotal > 0 && (taxNum > 0 || tipNum > 0)) {
      const taxTipTotalCents = Math.round((taxNum + tipNum) * 100);
      let taxTipRemainder = taxTipTotalCents;

      // Sort people by their item share descending to give remainder cents to biggest payers
      const peopleWithEntries = people
        .filter((p) => result.has(p))
        .sort((a, b) => result.get(b)!.cost - result.get(a)!.cost);

      for (let i = 0; i < peopleWithEntries.length; i++) {
        const person = peopleWithEntries[i];
        const entry = result.get(person)!;
        const proportion = entry.cost / itemsTotal;
        const shareCents =
          i < peopleWithEntries.length - 1
            ? Math.round(taxTipTotalCents * proportion)
            : taxTipRemainder; // last person gets whatever is left
        taxTipRemainder -= shareCents;
        entry.cost = Math.round((entry.cost + shareCents / 100) * 100) / 100;
      }
    }

    // Distribute discount proportionally (reduces what people owe)
    if (discountNum > 0 && itemsTotal > 0) {
      const discountCents = Math.round(discountNum * 100);
      applyDiscountProportionally(
        result,
        discountCents,
        (entry) => entry.cost, // get cost from entry
        (entry, deductCents) => ({
          ...entry,
          cost: Math.round((entry.cost - deductCents / 100) * 100) / 100,
        }),
        (a, b) => result.get(b)!.cost - result.get(a)!.cost, // descending by cost
      );
    }

    const bill = {
      id: Date.now().toString(),
      dateUploaded: new Date().toISOString().split("T")[0],
      description: billName.trim(),
      totalAmountPaid:
        Math.round(
          (itemsTotal +
            (isNaN(taxNum) ? 0 : taxNum) +
            (isNaN(tipNum) ? 0 : tipNum) -
            (isNaN(discountNum) ? 0 : discountNum)) *
            100,
        ) / 100,
      tax: taxNum,
      tip: tipNum,
      discount: discountNum,
      people: people.map((person) => ({
        ...person,
        oweAmount: result.get(person)?.cost ?? 0,
      })),
      items,
    };

    try {
      const folder = new Directory(Paths.document, "NoOwe");
      if (!folder.exists) folder.create();
      const billsFile = new File(folder, "bills.json");
      let existing: (typeof bill)[] = [];
      if (billsFile.exists) {
        const text = await billsFile.text();
        existing = JSON.parse(text);
      }
      existing.push(bill);
      billsFile.write(JSON.stringify(existing));
      if (currentDraftId) await deleteDraft(currentDraftId);
      Alert.alert("Bill succesfully created!");
      router.push("/dashboard");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const toggleSelectPerson = (person: Person) => {
    if (selectedPeople.includes(person)) {
      setSelectedPeople((prev) => prev.filter((p) => p !== person));
    } else {
      setSelectedPeople((prev) => [...prev, person]);
    }
  };

  const [submitBillError, setSubmitBillError] = useState("");

  const itemsTotal = items.reduce((sum, item) => sum + item.cost, 0);
  const taxNum = parseFloat(tax);
  const tipNum = parseFloat(tip);
  const discountNum = parseFloat(discount);
  const runningTotal =
    itemsTotal +
    (isNaN(taxNum) ? 0 : taxNum) +
    (isNaN(tipNum) ? 0 : tipNum) -
    (isNaN(discountNum) ? 0 : discountNum);
  const trimmedBillName = billName.trim();

  const billNameValid =
    trimmedBillName.length >= 2 && trimmedBillName.length <= 50;

  const taxTipValid =
    tax.trim() !== "" &&
    tip.trim() !== "" &&
    !isNaN(taxNum) &&
    !isNaN(tipNum) &&
    taxNum >= 0 &&
    tipNum >= 0 &&
    taxNum <= 10000 &&
    tipNum <= 10000 &&
    /^\d+(\.\d{1,2})?$/.test(tax) &&
    /^\d+(\.\d{1,2})?$/.test(tip);

  const submitItemGreyedOut =
    itemName.trim().length < 2 ||
    itemName.trim().length > 50 ||
    itemCost.trim() === "";

  const submitBillGreyedOut =
    people.length < 2 ||
    items.length === 0 ||
    items.some((item) => item.owners.length === 0) ||
    people.some(
      (person) => !items.some((item) => item.owners.includes(person)),
    ) ||
    !taxTipValid ||
    !billNameValid;

  const getSubmitBillError = () => {
    if (people.length < 2) return "Add at least 2 people to split the bill.";
    if (items.length === 0) return "Add at least one item.";
    if (items.some((item) => item.owners.length === 0))
      return "All items must have people assigned.";
    if (!billNameValid) return "Bill name must be between 2 and 50 characters";
    if (
      people.some(
        (person) => !items.some((item) => item.owners.includes(person)),
      )
    )
      return "All people must be assigned to at least one item.";
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
              onPress={handleBackPress}
            />
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.onBackground, fontWeight: "700" }}
            >
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
                maxWidth: 180,
              }}
            >
              <Text
                variant="labelLarge"
                numberOfLines={1}
                adjustsFontSizeToFit
                ellipsizeMode="tail"
                style={{ color: "white", fontWeight: "800" }}
              >
                ${runningTotal.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Scrollable content */}
        <ScrollView
          ref={mainScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            label="Bill Name"
            value={billName}
            onChangeText={setBillName}
            mode="outlined"
            style={{
              marginBottom: 24,
              backgroundColor: theme.colors.surfaceVariant,
            }}
            outlineStyle={{ borderRadius: 16 }}
          />
          {/* People section */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
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
                  {i !== 0 && (
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
                      <Text
                        style={{
                          color: "white",
                          fontSize: 11,
                          fontWeight: "800",
                          lineHeight: 14,
                        }}
                      >
                        ×
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 6,
                    maxWidth: 56,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {p.name ?? "N/A"}
                </Text>
              </View>
            ))}

            {/* Add person button */}
            <Pressable
              onPress={() => setPeopleModalVisible(true)}
              style={{ alignItems: "center" }}
            >
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
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: 24,
                    fontWeight: "300",
                    lineHeight: 28,
                  }}
                >
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
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  No items yet
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    opacity: 0.5,
                    marginTop: 4,
                  }}
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
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: "600",
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginTop: 2,
                      }}
                    >
                      {item.owners.length > 0
                        ? item.owners.map((p) => p.name ?? "N/A").join(", ")
                        : "No one assigned"}
                    </Text>
                  </View>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.primary,
                      fontWeight: "700",
                      marginRight: 4,
                    }}
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
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: 16,
                    fontWeight: "700",
                    lineHeight: 20,
                  }}
                >
                  +
                </Text>
              </View>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.primary, fontWeight: "600" }}
              >
                Add Item
              </Text>
            </Pressable>
          </View>

          {items.length > 0 && people.length > 0 && (
            <Pressable
              onPress={() => toggleSplitEvenly(!splitEvenlyEnabled)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 12,
                paddingHorizontal: 16,
                marginBottom: 20,
                backgroundColor: theme.colors.surface,
                borderRadius: 14,
              }}
            >
              <View>
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                >
                  Split Evenly
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Assign all items to everyone
                </Text>
              </View>
              <Switch
                value={splitEvenlyEnabled}
                onValueChange={toggleSplitEvenly}
                trackColor={{
                  false: theme.colors.outlineVariant,
                  true:
                    mode === "light"
                      ? theme.colors.primaryContainer
                      : theme.colors.onPrimary,
                }}
                thumbColor={theme.colors.primary}
                ios_backgroundColor={theme.colors.outlineVariant}
              />
            </Pressable>
          )}

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 20,
              paddingHorizontal: 4,
            }}
          >
            <TextInput
              label="Tax ($)"
              value={tax}
              onChangeText={(val) => {
                setTax(val);
                const taxNum = parseFloat(val);
                const tipNum = parseFloat(tip);
                if (!isNaN(taxNum) && taxNum > 10000) {
                  setTaxTipDiscError("Tax cannot exceed $10,000.");
                } else if (!isNaN(tipNum) && tipNum > 10000) {
                  setTaxTipDiscError("Tip cannot exceed $10,000.");
                } else {
                  setTaxTipDiscError("");
                }
              }}
              onFocus={() =>
                mainScrollRef.current?.scrollToEnd({ animated: false })
              }
              keyboardType="decimal-pad"
              mode="outlined"
              dense
              style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
              outlineStyle={{ borderRadius: 50 }}
            />
            <TextInput
              label="Tip ($)"
              value={tip}
              onChangeText={(val) => {
                setTip(val);
                const tipNum = parseFloat(val);
                const taxNum = parseFloat(tax);
                if (!isNaN(tipNum) && tipNum > 10000) {
                  setTaxTipDiscError("Tip cannot exceed $10,000.");
                } else if (!isNaN(taxNum) && taxNum > 10000) {
                  setTaxTipDiscError("Tax cannot exceed $10,000.");
                } else {
                  setTaxTipDiscError("");
                }
              }}
              onFocus={() =>
                mainScrollRef.current?.scrollToEnd({ animated: false })
              }
              keyboardType="decimal-pad"
              mode="outlined"
              dense
              style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
              outlineStyle={{ borderRadius: 50 }}
            />
            <TextInput
              label="Disc ($)"
              value={discount}
              onChangeText={(val) => {
                setDiscount(val);
                const discountNum = parseFloat(val);
                if (discountNum > runningTotal) {
                  setTaxTipDiscError(
                    "Discount cannot be greater than the running total of the bill!",
                  );
                } else {
                  setTaxTipDiscError("");
                }
              }}
              onFocus={() =>
                mainScrollRef.current?.scrollToEnd({ animated: false })
              }
              keyboardType="decimal-pad"
              mode="outlined"
              dense
              style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}
              outlineStyle={{ borderRadius: 50 }}
            />
          </View>
          {taxTipDiscError !== "" && (
            <HelperText type="error" visible style={{ paddingHorizontal: 4 }}>
              {taxTipDiscError}
            </HelperText>
          )}
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
          {submitBillError !== "" && (
            <HelperText
              type="error"
              visible
              style={{ textAlign: "center", marginBottom: 4 }}
            >
              {submitBillError}
            </HelperText>
          )}
          <Pressable
            onPress={() => {
              if (submitBillGreyedOut) setSubmitBillError(getSubmitBillError());
            }}
          >
            {/* On manual entry submit, it opens the modal and populates it with the confirmed people */}
            <Button
              mode="contained"
              disabled={submitBillGreyedOut}
              onPress={() => {
                setConfirmedPeople(buildConfirmedPeople());
                setConfirmationModalVisible(true);
              }}
              contentStyle={{ paddingVertical: 6 }}
            >
              Submit Bill
            </Button>
          </Pressable>
          {currentDraftId && (
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              onPress={() => setDeleteDraftDialogVisible(true)}
              style={{ marginTop: 8 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Delete Draft
            </Button>
          )}
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
              <Pressable onPress={() => {}} style={{ width: "100%" }}>
                <View
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 24,
                    paddingTop: 24,
                    paddingHorizontal: 24,
                    paddingBottom: 24,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      variant="titleLarge"
                      style={{
                        color: theme.colors.onSurface,
                        fontWeight: "700",
                      }}
                    >
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
                      marginBottom: selectedPeople.length === 0 ? 4 : 12,
                    }}
                  >
                    Assign People
                  </Text>
                  {selectedPeople.length === 0 && (
                    <HelperText
                      type="info"
                      visible
                      style={{ marginBottom: 8, marginTop: 0, paddingLeft: 0 }}
                    >
                      Select who to split this item with.
                    </HelperText>
                  )}

                  <ScrollView
                    style={{ maxHeight: 200 }}
                    showsVerticalScrollIndicator={false}
                  >
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
                              bgColor={
                                personSelected
                                  ? theme.colors.primary
                                  : theme.colors.surfaceVariant
                              }
                              textColor={
                                personSelected
                                  ? theme.colors.onPrimary
                                  : theme.colors.onSurfaceVariant
                              }
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              variant="bodyMedium"
                              style={{
                                color: theme.colors.onSurface,
                                fontWeight: "600",
                              }}
                            >
                              {person.name ?? "No Name"}
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
                              <Text
                                style={{
                                  color: theme.colors.onPrimary,
                                  fontSize: 12,
                                  fontWeight: "800",
                                }}
                              >
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
          onClose={() => {
            switchView("main");
            setPeopleModalVisible(false);
          }}
        >
          <Pressable
            onPress={Keyboard.dismiss}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              paddingHorizontal: 24,
              paddingBottom:
                view === "manual" && kbHeight > 0
                  ? kbHeight + 16
                  : insets.bottom + 24,
              maxHeight:
      view === "manual" && kbHeight > 0
        ? screenHeight * 0.95
        : screenHeight * 0.9,
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

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.onSurface, fontWeight: "700" }}
              >
                {view === "main"
                  ? "Add People"
                  : view === "manual"
                    ? "Manual Entry"
                    : "From Contacts"}
              </Text>
              <IconButton
                icon="close"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => {
                  switchView("main");
                  setPeopleModalVisible(false);
                }}
              />
            </View>

            <Animated.View
              style={[
                { overflow: "hidden" },
                contentAnimReady ? { height: contentHeightAnim } : {},
              ]}
            >
              {view === "main" && (
                <View
                  style={{ gap: 12, flexShrink: 0 }}
                  onLayout={(e) =>
                    handleViewLayout("main", e.nativeEvent.layout.height)
                  }
                >
                  <Pressable
                    onPress={() => switchView("manual")}
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
                      <Text
                        variant="titleSmall"
                        style={{
                          color: theme.colors.onSurface,
                          fontWeight: "700",
                        }}
                      >
                        Enter Manually
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Type in a name and phone number
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        fontSize: 18,
                      }}
                    >
                      ›
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => switchView("auto")}
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
                      <Icon
                        source="account-multiple-outline"
                        color="white"
                        size={20}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="titleSmall"
                        style={{
                          color: theme.colors.onSurface,
                          fontWeight: "700",
                        }}
                      >
                        Import from Contacts
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Pick from your phone contacts
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        fontSize: 18,
                      }}
                    >
                      ›
                    </Text>
                  </Pressable>
                </View>
              )}
              {view === "manual" && (
                <View
                  style={{ flexShrink: 0 }}
                  onLayout={(e) =>
                    handleViewLayout("manual", e.nativeEvent.layout.height)
                  }
                >
                  <ScrollView keyboardShouldPersistTaps="handled">
                    <Pressable onPress={Keyboard.dismiss}>
                      {contactsError && (
                        <HelperText type="error" visible>
                          {contactsError}
                        </HelperText>
                      )}
                      <View style={{ flex: 1, paddingVertical: 24 }}>
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
                          <Button
                            mode="outlined"
                            onPress={() => switchView("main")}
                          >
                            Back
                          </Button>
                        </View>
                      </View>
                    </Pressable>
                  </ScrollView>
                </View>
              )}
              {view !== "main" && view !== "manual" && (
                <View
                  style={{ flexShrink: 0 }}
                  onLayout={(e) =>
                    handleViewLayout("auto", e.nativeEvent.layout.height)
                  }
                >
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
                      <Button
                        mode="outlined"
                        onPress={() => switchView("main")}
                      >
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
                      <ScrollView
                        style={{
                          height: Math.min(360, screenHeight * 0.38),
                        }}
                        showsVerticalScrollIndicator={false}
                      >
                        {filteredContacts.map((contact, index) => {
                          const selected = selectedContacts.some(
                            (c) => c.id === contact.id,
                          );
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
                                      : contact.imageAvailable
                                        ? contact.image?.uri
                                        : undefined
                                  }
                                  name={contact.name ?? null}
                                  size={36}
                                  bgColor={
                                    selected
                                      ? theme.colors.primary
                                      : theme.colors.surfaceVariant
                                  }
                                  textColor={
                                    selected
                                      ? theme.colors.onPrimary
                                      : theme.colors.onSurfaceVariant
                                  }
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  variant="bodyMedium"
                                  style={{
                                    color: theme.colors.onSurface,
                                    fontWeight: "600",
                                  }}
                                >
                                  {contact.name ?? "Unknown"}
                                </Text>
                                <Text
                                  variant="bodySmall"
                                  style={{
                                    color: theme.colors.onSurfaceVariant,
                                  }}
                                >
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
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          {selectedContacts.map((c, i) => (
                            <View
                              key={i}
                              style={{ alignItems: "center", marginRight: 12 }}
                            >
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
                              <Text
                                variant="labelSmall"
                                numberOfLines={1}
                                style={{ maxWidth: 50 }}
                              >
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
                      <Button
                        mode="outlined"
                        onPress={() => switchView("main")}
                        style={{ marginTop: 12 }}
                      >
                        Back
                      </Button>
                    </>
                  )}
                </View>
              )}
            </Animated.View>
          </Pressable>
        </BottomSheet>

        {/* ── DISCARD DIALOG ── */}
        <Modal
          visible={discardDialogVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDiscardDialogVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.colors.backdrop,
              paddingHorizontal: 32,
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 28,
                width: "100%",
              }}
            >
              <Text
                variant="titleLarge"
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "700",
                  marginBottom: 10,
                }}
              >
                Keep this bill in progress?
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 28,
                }}
              >
                Save your progress and continue later from the dashboard, or
                discard this bill entirely.
              </Text>
              <Button
                mode="contained"
                onPress={async () => {
                  setDiscardDialogVisible(false);
                  await saveDraft(null);
                  router.back();
                }}
                contentStyle={{ paddingVertical: 6 }}
                style={{ marginBottom: 10 }}
              >
                Save as Draft
              </Button>
              <Button
                mode="outlined"
                textColor={theme.colors.error}
                onPress={() => {
                  setDiscardDialogVisible(false);
                  router.back();
                }}
                contentStyle={{ paddingVertical: 6 }}
              >
                Discard
              </Button>
            </View>
          </View>
        </Modal>

        {/* ── DELETE DRAFT CONFIRMATION ── */}
        <Modal
          visible={deleteDraftDialogVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteDraftDialogVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: theme.colors.backdrop,
              paddingHorizontal: 32,
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 28,
                width: "100%",
              }}
            >
              <Text
                variant="titleLarge"
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "700",
                  marginBottom: 10,
                }}
              >
                Delete this draft?
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 28,
                }}
              >
                This draft will be permanently removed and cannot be recovered.
              </Text>
              <Button
                mode="contained"
                buttonColor={theme.colors.error}
                onPress={async () => {
                  setDeleteDraftDialogVisible(false);
                  await deleteDraft(currentDraftId!);
                  router.back();
                }}
                contentStyle={{ paddingVertical: 6 }}
                style={{ marginBottom: 10 }}
              >
                Delete
              </Button>
              <Button
                mode="outlined"
                onPress={() => setDeleteDraftDialogVisible(false)}
                contentStyle={{ paddingVertical: 6 }}
              >
                Cancel
              </Button>
            </View>
          </View>
        </Modal>

        {/*Showing the bill confirmation modal*/}
        <BillConfirmationModal
          visible={confirmationModalVisible}
          onClose={() => setConfirmationModalVisible(false)}
          onConfirm={async () => {
            setConfirmationModalVisible(false);
            await submitBill();
          }}
          people={confirmedPeople}
          items={items}
          tax={taxNum}
          tip={tipNum}
          discount={discountNum}
          total={runningTotal}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
