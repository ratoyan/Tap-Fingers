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
    return (
        <TouchableOpacity
            onPress={'onPress' in props ? props.onPress : undefined}
            disabled={!('onPress' in props)}
        >
            <View style={[styles.row, props.viewStyle && props.viewStyle]}>
                <Text style={styles.label}>{props.label}</Text>

                {'value' in props && (
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