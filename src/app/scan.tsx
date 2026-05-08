import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    Image,
    Modal,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { Button, Icon, IconButton, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";

import * as ImageManipulator from "expo-image-manipulator";

import { parseBill } from "../utils/billParser";

export default function Scan() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [photoTaken, setPhotoTaken] = useState<boolean>(false);
  const [imgList, setImgList] = useState<
    { uri: string; width: number; height: number }[]
  >([]);
  const [capturedPhoto, setCapturedPhoto] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const [previewModalVisible, setPreviewModalVisible] =
    useState<boolean>(false);

  const [zoom, setZoom] = useState<number>(0);
  const zoomRef = useSharedValue(0);
  const lastZoom = useSharedValue(0);

  const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

  const [galleryModalVisible, setGalleryModalVisible] =
    useState<boolean>(false);
  const [expandedPhoto, setExpandedPhoto] = useState<{
    uri: string;
    width: number;
    height: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      lastZoom.value = zoomRef.value;
    })
    .onUpdate((event) => {
      const next = Math.min(
        1,
        Math.max(0, lastZoom.value + (event.scale - 1) * 0.1),
      );
      zoomRef.value = next;
      runOnJS(setZoom)(next);
    });

  if (!permission || !permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
          backgroundColor: theme.colors.background,
        }}
      >
        <Icon
          source="camera-outline"
          color={theme.colors.onBackground}
          size={64}
        />
        <Text
          variant="titleLarge"
          style={{
            color: theme.colors.onBackground,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Camera Access Needed
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          NoOwe needs your camera to scan receipts.
        </Text>
        <Button
          mode="contained"
          onPress={requestPermission}
          contentStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
        >
          Grant Permission
        </Button>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={{ marginTop: 12 }}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();
    if (!photo) return;
    const cropped = await cropToViewfinder(photo);
    setCapturedPhoto(cropped);
    setPreviewModalVisible(true);
  };

  const pickFromCameraRoll = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      console.log("Permission to access camera roll denied");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setCapturedPhoto({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      setPreviewModalVisible(true);
    }
  };

  const handleRemovePhoto = () => {
    setCapturedPhoto(null);
    setPreviewModalVisible(false);
  };

  const handleKeepPhoto = () => {
    if (!capturedPhoto) return;
    setImgList((cur) => [...cur, capturedPhoto]);
    setPhotoTaken(true);
    setTimeout(() => setPhotoTaken(false), 2000);
    setCapturedPhoto(null);
    setPreviewModalVisible(false);
  };

  const handleParseBill = async () => {
    if (imgList.length === 0) {
      console.log("No saved images captured yet");
      return;
    }
    const scanned_bill = await parseBill(imgList);
    router.push({
      pathname: "/manual",
      params: { temp_bill: JSON.stringify(scanned_bill) },
    });
  };

  const cropToViewfinder = async (photo: {
    uri: string;
    width: number;
    height: number;
  }) => {
    const viewfinderTop = insets.top + 80;
    const viewfinderLeft = SCREEN_W * 0.1;
    const viewfinderWidth = SCREEN_W * (1 - 0.1 - 0.1);
    const viewfinderHeight = SCREEN_H * 0.44;

    // Photo resolution vs screen size ratio
    const scaleX = photo.width / SCREEN_W;
    const scaleY = photo.height / SCREEN_H;

    const cropRegion = {
      originX: viewfinderLeft * scaleX,
      originY: viewfinderTop * scaleY,
      width: viewfinderWidth * scaleX,
      height: viewfinderHeight * scaleY,
    };

    const cropped = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ crop: cropRegion }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
    );

    return { uri: cropped.uri, width: cropped.width, height: cropped.height };
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Camera fills screen */}
      <GestureDetector gesture={pinchGesture}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          zoom={zoom}
        />
      </GestureDetector>

      {/* Darkened top bar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 64,
          backgroundColor: "rgba(0,0,0,0.55)",
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 8,
          paddingBottom: 10,
        }}
      >
        <IconButton
          icon="arrow-left"
          iconColor="white"
          size={22}
          onPress={() => router.back()}
        />
        <View style={{ flex: 1 }} />
        {imgList.length > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 5,
              marginRight: 8,
            }}
          >
            {imgList.length > 0 && (
              <TouchableOpacity
                onPress={() => setGalleryModalVisible(true)}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  marginRight: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon
                  source="image-multiple"
                  color={theme.colors.onPrimary}
                  size={16}
                />
                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.onPrimary, fontWeight: "700" }}
                >
                  {imgList.length} photo{imgList.length !== 1 ? "s" : ""}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Viewfinder overlay with corner brackets */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 80,
          left: "10%",
          right: "10%",
          height: "44%",
        }}
        pointerEvents="none"
      >
        {/* Top-left */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 32,
            height: 32,
            borderTopWidth: 3,
            borderLeftWidth: 3,
            borderColor: theme.colors.primary,
          }}
        />
        {/* Top-right */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 32,
            height: 32,
            borderTopWidth: 3,
            borderRightWidth: 3,
            borderColor: theme.colors.primary,
          }}
        />
        {/* Bottom-left */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 32,
            height: 32,
            borderBottomWidth: 3,
            borderLeftWidth: 3,
            borderColor: theme.colors.primary,
          }}
        />
        {/* Bottom-right */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 32,
            height: 32,
            borderBottomWidth: 3,
            borderRightWidth: 3,
            borderColor: theme.colors.primary,
          }}
        />

        {/* Instruction label */}
        <View
          style={{
            position: "absolute",
            bottom: -36,
            alignSelf: "center",
            backgroundColor: "rgba(0,0,0,0.55)",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 5,
          }}
        >
          <Text variant="labelMedium" style={{ color: "white" }}>
            Point at a receipt
          </Text>
        </View>
      </View>

      {/* Photo saved toast */}
      {photoTaken && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 80,
            alignSelf: "center",
            backgroundColor: theme.colors.primaryContainer,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.primary, fontWeight: "700" }}
          >
            ✓ Photo saved
          </Text>
        </View>
      )}

      {/* Bottom action panel */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(13,13,13,0.9)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 28,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 28,
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Capture button */}
        <TouchableOpacity
          onPress={takePicture}
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: theme.colors.primary,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              borderWidth: 3,
              borderColor: theme.colors.onPrimary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconButton
              icon="camera"
              iconColor={theme.colors.onPrimary}
              size={26}
            />
          </View>
        </TouchableOpacity>

        {/* "or" divider */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            width: "100%",
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: theme.colors.outline,
            }}
          />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            or
          </Text>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: theme.colors.outline,
            }}
          />
        </View>

        <Button
          mode="contained-tonal"
          onPress={pickFromCameraRoll}
          style={{ width: "100%" }}
        >
          Choose from Camera Roll
        </Button>

        <Button
          mode="outlined"
          onPress={handleParseBill}
          disabled={imgList.length === 0}
          style={{ width: "100%" }}
        >
          {imgList.length > 0
            ? `Parse Bill (${imgList.length} photo${imgList.length !== 1 ? "s" : ""})`
            : "Parse Bill"}
        </Button>
      </View>

      {/* Preview modal */}
      <Modal
        visible={previewModalVisible && !!capturedPhoto}
        animationType="slide"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#0d0d0d",
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              variant="titleLarge"
              style={{ color: "white", fontWeight: "700", flex: 1 }}
            >
              Preview
            </Text>
            <IconButton
              icon="close"
              iconColor="white"
              size={22}
              onPress={handleRemovePhoto}
            />
          </View>

          {capturedPhoto && (
            <Image
              source={{ uri: capturedPhoto.uri }}
              style={{
                flex: 1,
                borderRadius: 16,
                resizeMode: "contain",
                marginBottom: 24,
              }}
            />
          )}

          <View style={{ gap: 12 }}>
            <Button
              mode="contained"
              onPress={handleKeepPhoto}
              contentStyle={{ paddingVertical: 4 }}
            >
              Use This Photo
            </Button>
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              onPress={handleRemovePhoto}
            >
              Discard
            </Button>
          </View>
        </View>
      </Modal>
      <Modal visible={galleryModalVisible} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#0d0d0d",
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 16,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              variant="titleLarge"
              style={{ color: "white", fontWeight: "700", flex: 1 }}
            >
              Saved Photos
            </Text>
            <IconButton
              icon="close"
              iconColor="white"
              size={22}
              onPress={() => setGalleryModalVisible(false)}
            />
          </View>

          {imgList.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Icon
                source="image-off-outline"
                color={theme.colors.onSurfaceVariant}
                size={48}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
              >
                No photos yet
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {imgList.map((img, index) => {
                const size = (SCREEN_W - 32 - 16) / 2;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setExpandedPhoto(img)}
                    style={{ width: size, height: size }}
                  >
                    <Image
                      source={{ uri: img.uri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 10,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setImgList((cur) => cur.filter((_, i) => i !== index))
                      }
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        borderRadius: 12,
                      }}
                    >
                      <Icon
                        source="close-circle"
                        color={theme.colors.error}
                        size={24}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <Button
            mode="contained"
            onPress={() => setGalleryModalVisible(false)}
            style={{ marginTop: 16 }}
            contentStyle={{ paddingVertical: 4 }}
          >
            Done
          </Button>
          <Modal visible={!!expandedPhoto} animationType="fade" transparent>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.92)",
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 20,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  variant="titleLarge"
                  style={{ color: "white", fontWeight: "700", flex: 1 }}
                >
                  Preview
                </Text>
                <IconButton
                  icon="close"
                  iconColor="white"
                  size={22}
                  onPress={() => setExpandedPhoto(null)}
                />
              </View>

              {expandedPhoto && (
                <Image
                  source={{ uri: expandedPhoto.uri }}
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    resizeMode: "contain",
                    marginBottom: 24,
                  }}
                />
              )}

              <Button
                mode="outlined"
                textColor={theme.colors.error}
                onPress={() => {
                  setImgList((cur) =>
                    cur.filter((img) => img.uri !== expandedPhoto?.uri),
                  );
                  setExpandedPhoto(null);
                }}
              >
                Remove Photo
              </Button>
            </View>
          </Modal>
        </View>
      </Modal>
    </View>
  );
}
