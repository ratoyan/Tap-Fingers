import React, {useEffect, useState} from 'react';
import {Dimensions, Pressable, ImageBackground} from 'react-native';
import {Canvas} from '@shopify/react-native-skia';
import {BoxType} from "../../types/play.type.ts";
import {boxes, colors, images} from "../../data/play.ts";
import {TOP_OFFSET} from "../../constants/uiConstants.ts";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// components
import CoinCount from "../../components/ui/CoinCount/CoinCount.tsx";
import PlayBox from "../../components/ui/Play/PlayBox.tsx";

// styles
import styles from './Play.style.ts'

const {width, height} = Dimensions.get('window');

export default function Play() {
    const insets = useSafeAreaInsets();

    const [count, setCount] = useState(0);
    const [boxesData, setBoxesData] = useState(
        boxes.map((b: BoxType) => ({
            ...b,
            x: Math.random() * (width - b.size[0]), // X-ը էլ random
            y: Math.random() * -1000,
            tx: Math.random() * (width - b.size[0]),
            ty: 0, // կարող է գնալ ներքև
            duration: Math.random() * 30,
            color: colors[Math.floor(Math.random() * colors.length)],
        }))
    );

    function addRandomBox() {
        const newId = Math.max(...boxes.map(b => b.id)) + 1; // unique id
        const randomBoxData = boxes[Math.floor(Math.random() * boxes.length)];

        const newBox = {
            ...randomBoxData,
            id: newId,
            x: Math.random() * (width - randomBoxData.size[0]),
            y: -200,
            tx: Math.random() * (width - randomBoxData.size[0]),
            ty: Math.random() * (height - randomBoxData.size[1]),
            rotation: randomBoxData.rotation,
        };
        // @ts-ignore
        setBoxesData(prev => [...prev, newBox]);
    }

    function deleteBoxOnClick(id: number) {
        setBoxesData(prev => prev.filter(b => b.id !== id));
        addRandomBox();
        setCount((count) => count + 1);
    }

    function imageBackground(count: number) {
        switch (true) {
            case count > 20:
                return images[2];
            case count > 10:
                return images[1];
            default:
                return images[0];
        }
    }

    function durationAdd() {
        const newDurationBoxes: BoxType[] = boxes.map((e: BoxType) => {
            return {
                ...e,
                // @ts-ignore
                duration: e.duration + 10
            };
        });
        // @ts-ignore
        setBoxesData(newDurationBoxes);
    }

    useEffect(() => {
        if (count > 20) {
            durationAdd()
        } else if (count > 30) {
            durationAdd()
        }
    }, [count]);

    useEffect(() => {
        let animationFrameId: number;

        const animate = () => {
            setBoxesData((prev) =>
                prev.map(b => {
                    // dx/dy դեպի target
                    const dx = b.tx - b.x;
                    const dy = b.ty - b.y;

                    let newX = b.x + dx * 0.05;
                    let newY = b.y + dy * 0.05;
                    let newColor = b.color;

                    // եթե հասել է ներքևի սահմանի → վերևից նոր random սկիզբ և նոր color
                    if (newY + b.size[1] > height) {
                        newY = -Math.random() * 500;
                        newColor = colors[Math.floor(Math.random() * colors.length)];
                    }

                    // Reassign new target if close enough
                    const newTx = Math.abs(dx) < 1 ? Math.random() * (width - b.size[0]) : b.tx;
                    const newTy = b.y + b.duration;
                    const newRotation = (b.rotation + 2) % 360; // 2 degrees per frame

                    return {
                        ...b,
                        x: newX,
                        y: newY,
                        tx: newTx,
                        ty: newTy,
                        rotation: newRotation,
                        color: newColor,
                    };
                })
            );

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <ImageBackground source={{uri: imageBackground(count)}} style={styles.container}>
            <CoinCount count={10} viewStyles={[styles.countView, {top: insets.top + TOP_OFFSET}]}/>
            <Canvas style={{flex: 1}}>
                {boxesData.map((box: BoxType, index: number) => (
                    <PlayBox key={index} box={box}/>
                ))}
            </Canvas>

            {boxesData
                .slice()
                .reverse()
                .map((box: BoxType) => (
                    <Pressable
                        key={box.id}
                        onPress={() => deleteBoxOnClick(box.id)}
                        style={{
                            position: 'absolute',
                            left: box.x,
                            top: box.y,
                            width: box.size[0],
                            height: box.size[1],
                        }}
                    />
                ))}
        </ImageBackground>
    );
}