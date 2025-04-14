import { ClerkLoaded, SignIn } from "@clerk/nextjs"

export default function Page() {
    return (
        <ClerkLoaded>
            <SignIn
                path="/sign-in"
                appearance={{
                    elements: {
                        footerAction: { display: "none" },
                    },
                }}
            />
        </ClerkLoaded>
    )
}
