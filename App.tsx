import StackNavigator from "./src/navigation/StackNavigator.tsx";
import {NavigationContainer} from "@react-navigation/native";

function App() {
    return (
        <NavigationContainer>
            <StackNavigator/>
        </NavigationContainer>
    )
}

export default App;