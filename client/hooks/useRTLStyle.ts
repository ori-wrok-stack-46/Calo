import { useLanguage } from "@/src/i18n/context/LanguageContext";
import {
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
} from "react-native";

type StyleType = ViewStyle | TextStyle | ImageStyle;

interface RTLStyles {
  [key: string]: StyleType;
}

type RTLStylesReturn<T extends RTLStyles> = {
  [K in keyof T]: StyleProp<ViewStyle>;
};

export const useRTLStyles = <T extends RTLStyles>(
  styles: T
): RTLStylesReturn<T> => {
  const { isRTL } = useLanguage();

  if (!isRTL) {
    return styles as RTLStylesReturn<T>;
  }

  const rtlStyles: Partial<RTLStylesReturn<T>> = {};

  Object.keys(styles).forEach((key) => {
    const style = styles[key as keyof T] as any;

    // Create a new style object with RTL adjustments
    const rtlStyle: any = {
      ...style,
      // Text alignment
      textAlign:
        style.textAlign === "left"
          ? "right"
          : style.textAlign === "right"
          ? "left"
          : style.textAlign,

      // Margin adjustments
      marginLeft: style.marginRight,
      marginRight: style.marginLeft,
      marginStart: style.marginEnd,
      marginEnd: style.marginStart,

      // Padding adjustments
      paddingLeft: style.paddingRight,
      paddingRight: style.paddingLeft,
      paddingStart: style.paddingEnd,
      paddingEnd: style.paddingStart,

      // Position adjustments
      left: style.right,
      right: style.left,
      start: style.end,
      end: style.start,

      // Flex direction
      flexDirection:
        style.flexDirection === "row"
          ? "row-reverse"
          : style.flexDirection === "row-reverse"
          ? "row"
          : style.flexDirection,

      // Border adjustments
      borderLeftWidth: style.borderRightWidth,
      borderRightWidth: style.borderLeftWidth,
      borderStartWidth: style.borderEndWidth,
      borderEndWidth: style.borderStartWidth,

      borderLeftColor: style.borderRightColor,
      borderRightColor: style.borderLeftColor,
      borderStartColor: style.borderEndColor,
      borderEndColor: style.borderStartColor,

      // Border radius adjustments
      borderTopLeftRadius: style.borderTopRightRadius,
      borderTopRightRadius: style.borderTopLeftRadius,
      borderBottomLeftRadius: style.borderBottomRightRadius,
      borderBottomRightRadius: style.borderBottomLeftRadius,
      borderTopStartRadius: style.borderTopEndRadius,
      borderTopEndRadius: style.borderTopStartRadius,
      borderBottomStartRadius: style.borderBottomEndRadius,
      borderBottomEndRadius: style.borderBottomStartRadius,

      // Transform adjustments
      transform: style.transform?.map((transform: any) => {
        if (transform.translateX) {
          return { translateX: -transform.translateX };
        }
        if (transform.scaleX) {
          return { scaleX: -transform.scaleX };
        }
        return transform;
      }),
    };

    // Remove incompatible properties for ViewStyle
    const incompatibleProps = [
      "cursor",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "letterSpacing",
      "textDecorationLine",
      "textDecorationStyle",
      "textDecorationColor",
      "textShadowColor",
      "textShadowOffset",
      "textShadowRadius",
      "includeFontPadding",
      "textAlignVertical",
      "fontVariant",
      "writingDirection",
    ];

    incompatibleProps.forEach((prop) => {
      if (prop in rtlStyle) {
        delete rtlStyle[prop];
      }
    });

    rtlStyles[key as keyof T] = rtlStyle as StyleProp<ViewStyle>;
  });

  return rtlStyles as RTLStylesReturn<T>;
};
