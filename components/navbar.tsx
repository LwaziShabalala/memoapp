import { UserButton } from "@clerk/nextjs";
import MobileSidebar from "./mobile-sidebar";

const Navbar = () => {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-950 text-white">
            {/* Mobile Sidebar on the Left */}
            <MobileSidebar />

            {/* User Button on the Right */}
            <div>
                <UserButton />
            </div>
        </div>
    );
}

export default Navbar;
