import React from "react";
import {View, Text, ScrollView} from "react-native";
import {useTranslation} from "react-i18next";
import {useGlobalStore} from "../../store/globalStore.ts";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ShopItem from "../../components/ui/ShopItem/ShopItem.tsx";

// styles
import styles from './Shop.style.ts';
import {DARK_PURPLE, PURPLE} from "../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

const ITEMS = [
    {id: "1", title: "Card 1", price: "100", type: 'card'},
    {id: "2", title: "Card 2", price: "200", type: 'card'},
    {id: "3", title: "Card 3", price: "300", type: 'card'},
    {id: "4", title: "Card 4", price: "100", type: 'card'},
    {id: "5", title: "Background 1", price: "200", type: 'background'},
    {id: "6", title: "Background 2", price: "300", type: 'background'},
];

function Shop() {
    const {t} = useTranslation();
    const {coins} = useGlobalStore();

    return (
        <LinearGradient
            colors={[DARK_PURPLE, PURPLE]}
            style={styles.container}
            accessible={true}
            accessibilityLabel="Shop screen"
        >
            <BackHeader
                title={`🛒 ${t('shop')}`}
                isShowCoin={true}
                textStyle={{marginRight: 25}}
                coins={coins}
            />

            <ScrollView
                contentContainerStyle={{paddingBottom: 20}}
                showsVerticalScrollIndicator={false}
                accessibilityRole="scrollbar"
                accessibilityHint="Swipe up or down to browse shop items"
            >
                <Text
                    style={styles.sectionTitle}
                    accessibilityRole="header"
                >
                    {t('cards')}
                </Text>

                <View
                    style={styles.grid}
                    accessible={true}
                    accessibilityRole="list"
                    accessibilityLabel={`${t('cards')} list`}
                >
                    {ITEMS
                        .filter((e: any) => e.type === 'card')
                        .map((item: any) => (
                            <ShopItem
                                key={item.id}
                                item={item}
                            />
                        ))}
                </View>

                <Text
                    style={styles.sectionTitle}
                    accessibilityRole="header"
                >
                    {t('backgrounds')}
                </Text>

                <View
                    style={styles.grid}
                    accessible={true}
                    accessibilityRole="list"
                    accessibilityLabel={`${t('backgrounds')} list`}
                >
                    {ITEMS
                        .filter((e: any) => e.type === 'background')
                        .map((item: any) => (
                            <ShopItem
                                key={item.id}
                                item={item}
                            />
                        ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

export default Shop;
