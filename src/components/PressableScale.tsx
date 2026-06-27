import * as Haptics from "expo-haptics";
import React from "react";
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Target scale while pressed. Lower = more pronounced. */
  scaleTo?: number;
  /** Fire a haptic on press. `true` = light impact, or pass a specific style. */
  haptic?: boolean | Haptics.ImpactFeedbackStyle;
};

/**
 * A Pressable that gently scales down while held and springs back on release —
 * the core micro-interaction used for cards, tiles and list rows across the app.
 * Built on Reanimated so the animation runs on the UI thread (no JS-thread jank).
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        scale.value = withTiming(scaleTo, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 240, mass: 0.5 });
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic && !disabled) {
          Haptics.impactAsync(
            typeof haptic === "boolean"
              ? Haptics.ImpactFeedbackStyle.Light
              : haptic,
          );
        }
        onPress?.(e);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
