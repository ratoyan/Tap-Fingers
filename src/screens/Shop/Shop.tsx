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
    {id: "1", title: "Card 1", price: "100", type: 'card'},
    {id: "2", title: "Card 2", price: "200", type: 'card'},
    {id: "3", title: "Card 3", price: "300", type: 'card'},
    {id: "4", title: "Card 4", price: "100", type: 'card'},
    {id: "5", title: "Background 1", price: "200", type: 'background'},
    {id: "6", title: "Background 2", price: "300", type: 'background'},
];

function Shop() {
    const {t} = useTranslation();

    return (
        <LinearGradient colors={[DARK_PURPLE, PURPLE]} style={styles.container}>
            <BackHeader title={`🛒 ${t('shop')}`} isShowCoin={true} textStyle={{marginRight: 25}}/>

            <ScrollView contentContainerStyle={{paddingBottom: 20}}
                        showsVerticalScrollIndicator={false}
                        accessible={true}
                        accessibilityLabel={t('shop')}
            >
                <Text style={styles.sectionTitle}
                      accessibilityRole="header"
                >{t('cards')}</Text>
                <View style={styles.grid}
                      accessible={true}
                      accessibilityLabel={t('cards')}
                >
                    {ITEMS.filter((e: any) => e.type === 'card').map((item: any, index: number) => (
                        <ShopItem item={item} key={index}/>
                    ))}
                </View>

                <Text style={styles.sectionTitle}
                      accessibilityRole="header"
                >{t('backgrounds')}</Text>
                <View style={styles.grid}
                      accessible={true}
                      accessibilityLabel={t('backgrounds')}
                >
                    {ITEMS.filter((e: any) => e.type === 'background').map((item: any, index: number) => (
                        <ShopItem item={item} key={index}/>
                    ))}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

export default Shop;
