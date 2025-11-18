import {Redirect, Slot} from "expo-router";

export default function _Layout() {
    const isAthenticated = false

    if (!isAthenticated) return <Redirect href={'/sign-in'} />

    return <Slot />
}

