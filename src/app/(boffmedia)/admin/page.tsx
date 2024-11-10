"use client"
import { useBoffSession } from "../../../services/useBoffSession";
import BoffLayout from "../_components/BoffLayout";

export default function AdminPage() {
    const { session } = useBoffSession();

    if(!session?.user.roles.includes("BOFF_ADMIN")){
        return <h1>Unauthorized</h1>
    }

    return (
        <div>
            <BoffLayout >
                <h1>Admin Page</h1>
            </BoffLayout>
        </div>
    );

}