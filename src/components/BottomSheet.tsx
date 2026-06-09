import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, children }: Props) {
  const theme = useTheme();

  // Keep the Modal mounted during exit animation
  const [show, setShow] = useState(false);

  const backdrop = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(700)).current;

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: 700,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setShow(false));
    }
  }, [visible, backdrop, slideY]);

  return (
    <Modal
      visible={show}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop fades in place — pointerEvents none so touches fall through to the Pressable */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: theme.colors.backdrop, opacity: backdrop },
        ]}
        pointerEvents="none"
      />

      {/* Tap anywhere outside the sheet to dismiss */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

      {/* Sheet anchored to the bottom of the screen */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: slideY }],
        }}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}
