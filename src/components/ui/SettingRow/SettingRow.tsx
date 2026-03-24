import {Text, TouchableOpacity, View, ViewStyle} from "react-native";
import React from "react";

// components
import GameSwitch from "../GameSwitch/GameSwitch.tsx";

// styles
import styles from './SettingRow.style.ts';

interface ToggleRow {
    label: string;
    value: boolean;
    onChange: (val: boolean) => void;
    viewStyle?: ViewStyle
}

interface PressRow {
    label: string;
    valueText: string;
    onPress: () => void;
    viewStyle?: ViewStyle
}

type SettingRowProps = ToggleRow | PressRow;

function SettingRow(props: SettingRowProps) {
    const isPress = 'onPress' in props;
    const isToggle = 'value' in props;

    return (
        <TouchableOpacity
            onPress={
                isToggle
                    ? () => props.onChange(!props.value) // ամբողջ row-ը clickable է toggle-ի համար
                    : isPress
                        ? props.onPress
                        : undefined
            }
            disabled={!isPress && !isToggle}
            accessible={true}
            accessibilityRole={isToggle ? "switch" : "button"}
            accessibilityLabel={props.label}
            accessibilityState={isToggle ? { checked: props.value } : undefined}
            accessibilityHint={
                isToggle
                    ? "Double tap to toggle"
                    : isPress
                        ? "Double tap to open"
                        : undefined
            }
        >
            <View style={[styles.row, props.viewStyle && props.viewStyle]} importantForAccessibility="no-hide-descendants">
                <Text style={styles.label}>{props.label}</Text>

                {isToggle && (
                    <GameSwitch value={props.value} onChange={props.onChange}/>
                )}

                {'valueText' in props && (
                    <Text style={styles.valueText}>{props.valueText} ›</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

export default SettingRow;