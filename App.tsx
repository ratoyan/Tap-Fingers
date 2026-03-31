import StackNavigator from "./src/navigation/StackNavigator.tsx";
import {NavigationContainer} from "@react-navigation/native";
import useMusicAppState from "./src/hooks/useMusicAppState.tsx";
import {playMusic, stopMusic} from "./src/utils/helpers.ts";

function App() {
    useMusicAppState(playMusic, stopMusic);

    return (
        <NavigationContainer>
            <StackNavigator/>
        </NavigationContainer>
    )
}

export default App;