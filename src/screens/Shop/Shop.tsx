import React from "react";
import {View, Text, ScrollView} from "react-native";
import {useTranslation} from "react-i18next";

// components
import BackHeader from "../../components/ui/BackHeader/BackHeader.tsx";
import ShopItem from "../../components/ui/ShopItem/ShopItem.tsx";

// styles
import styles from './Shop.style.ts';
import {DARK_PURPLE, PURPLE} from "../../constants/colors.ts";
import LinearGradient from "react-native-linear-gradient";

const ITEMS = [
    {id: "1", title: "50 Coins", price: "0.99$", icon: "🪙", type: 'card'},
    {id: "2", title: "150 Coins", price: "2.99$", icon: "💰", type: 'card'},
    {id: "3", title: "No Ads", price: "1.99$", icon: "🚫", type: 'card'},
    {id: "4", title: "Golden Skin", price: "4.99$", icon: "👑", type: 'card'},
    {id: "5", title: "No Ads", price: "1.99$", icon: "🚫", type: 'background'},
    {id: "6", title: "Golden Skin", price: "4.99$", icon: "👑", type: 'background'},
];

function Shop() {
    const {t} = useTranslation();

    return (
        <LinearGradient colors={[DARK_PURPLE, PURPLE]} style={styles.container}>
            <BackHeader title={`🛍 ${t('shop')}`}/>

            <ScrollView contentContainerStyle={{paddingBottom: 20}} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>{t('cards')}</Text>
                <View style={styles.grid}>
                    {ITEMS.filter((e: any) => e.type === 'card').map((item: any, index: number) => (
                        <React.Fragment key={index}>
                            <ShopItem item={item} key={index}/>
                        </React.Fragment>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>{t('backgrounds')}</Text>
                <View style={styles.grid}>
                    {ITEMS.filter((e: any) => e.type === 'background').map((item: any, index: number) => (
                        <ShopItem item={item} key={index}/>
                    ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

export default Shop;
