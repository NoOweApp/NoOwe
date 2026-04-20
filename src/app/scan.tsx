import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Image, Modal, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

// OCR Implementation
import { parseBill } from "../utils/billParser";

export default function Scan() {
    const router = useRouter();
    const theme = useTheme();

    const [permission, requestPermission] = useCameraPermissions();

    const cameraRef = useRef<CameraView>(null);

    const [photoTaken, setPhotoTaken] = useState<boolean>(false);
    const [imgList, setImgList] = useState<{ uri: string; width: number; height: number; }[]>([]);
    const [capturedPhoto, setCapturedPhoto] = useState<{ uri: string; width: number; height: number; } | null>(null);

    const [previewModalVisible, setPreviewModalVisible] = useState<boolean>(false);

    // Check camera permissions page
    if (!permission || !permission.granted) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                    backgroundColor: theme.colors.background,
                }}
            >
                <Text style={{ marginBottom: 20, color: theme.colors.onBackground }}>
                    Please give NoOwe permission to use your camera for this feature
                </Text>

                <Button mode="contained" onPress={requestPermission}>
                    Grant Permission
                </Button>
            </View>
        );
    }

    // Take Picture
    const takePicture = async () => {
        // Get permission before entering
        // const permission = await ImagePicker.useCameraPermissions();
        // if (!permission.granted) {
        //     console.log("Permission to access camera roll denied");
        //     return;
        // }

        if (!cameraRef.current) return;

        const photo = await cameraRef.current.takePictureAsync();
        if (!photo) return;

        setCapturedPhoto(photo);
        setPreviewModalVisible(true);
    };

    // Choose from Camera Roll
    const pickFromCameraRoll = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
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

            const selectedPhoto = {
                uri: asset.uri,
                width: asset.width,
                height: asset.height,
            };

            setCapturedPhoto(selectedPhoto);
            setPreviewModalVisible(true);
        }
    };

    // Keep/Remove Actions
    const handleRemovePhoto = () => {
        setCapturedPhoto(null);
        setPreviewModalVisible(false);
    };
    const handleKeepPhoto = () => {
        if (!capturedPhoto) return;

        setImgList((curPhotos) => [...curPhotos, capturedPhoto]);

        setPhotoTaken(true);

        setTimeout(() => {
            setPhotoTaken(false);
        }, 2000);

        setCapturedPhoto(null);
        setPreviewModalVisible(false);
    };

    // Send pictures to OCR
    const handleParseBill = () => {
        if (imgList.length === 0) {
            console.log("No saved images captured yet");
            return;
        }

        const scanned_bill = parseBill(imgList);

        router.push({
            pathname: "/manual",
            params: {
                temp_bill: JSON.stringify(scanned_bill),
            },
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

            {/* Temporary back button (for testing) */}
            <Button
                mode="text"
                onPress={() => router.push("/dashboard")}
                style={{
                    position: "absolute",
                    top: 50,
                    left: 10,
                    zIndex: 10,
                    backgroundColor: "rgba(0,0,0,0.5)",
                }}
                textColor="white"
            >
                Back
            </Button>

            {/* Actions */}
            <View
                style={{
                    position: "absolute",
                    bottom: 40,
                    left: 20,
                    right: 20,
                    gap: 12,
                }}
            >

                {/* Photo Saved Text */}
                {photoTaken && (
                    <Text
                        style={{
                            textAlign: "center",
                            color: "white",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            padding: 8,
                            borderRadius: 8,
                        }}
                    >
                        Photo saved
                    </Text>
                )}

                <Button mode="contained" onPress={takePicture}>
                    Capture
                </Button>

                {/* Note: ask about UI */}
                <Text style={{ textAlign: "center", color: "white" }}> or </Text>

                <Button mode="contained" onPress={pickFromCameraRoll}>
                    Choose From Camera Roll
                </Button>

                <Button mode="outlined" onPress={handleParseBill}>
                    Parse Bill
                </Button>

            </View>

            {/* Keep/Remove Modal, add cropping? */}
            <Modal visible={previewModalVisible && !!capturedPhoto} animationType="slide">
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "black",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 20,
                    }}
                >
                    {capturedPhoto && (
                        <Image
                            source={{ uri: capturedPhoto.uri }}
                            style={{
                                width: "100%",
                                height: "75%",
                                resizeMode: "contain",
                                marginBottom: 20,
                            }}
                        />
                    )}

                    <View style={{ width: "100%", gap: 12 }}>
                        <Button mode="contained" onPress={handleKeepPhoto}>
                            Keep
                        </Button>

                        <Button mode="outlined" onPress={handleRemovePhoto}>
                            Remove
                        </Button>
                    </View>
                    
                </View>
            </Modal>
        </View>
    );
}