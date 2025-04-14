import { SignIn } from "@clerk/nextjs"

export default function Page() {
    return (
        <SignIn
            appearance={{
                elements: {
                    // Target multiple possible elements that could contain the sign-up link
                    footerAction: { display: "none" },
                    footerActionLink: { display: "none" },
                    footer: { 
                        "& a[href*='sign-up']": { display: "none" }
                    }
                }
            }}
        />
    )
}
