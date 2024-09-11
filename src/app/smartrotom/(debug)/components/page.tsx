import { SmartRotomBadge } from "@/components/smartrotom/ui/badge";
import { SmartRotomButton } from "@/components/smartrotom/ui/button";
import { HomeIcon } from '@heroicons/react/24/outline'

export default function ComponentsPage() {
    return (
        <div className="space-y-4 bg-primary-200">
            <Section title="Buttons">
                <SmartRotomButton>Default</SmartRotomButton>
                <SmartRotomButton variant="noShadow">No Shadow</SmartRotomButton>
                <SmartRotomButton variant="link">Link</SmartRotomButton>
                <SmartRotomButton variant="neutral">Neutral</SmartRotomButton>
                <SmartRotomButton variant="reverse">Reverse</SmartRotomButton>
                <Separator />
                <SmartRotomButton size='sm'>Default SM</SmartRotomButton>
                <SmartRotomButton size='lg'>Default LG</SmartRotomButton>
                <SmartRotomButton size='icon'><HomeIcon height={20} width={20} strokeWidth={2.5}/></SmartRotomButton>
            </Section>

            <Section title="Badges">
                <SmartRotomBadge>Default</SmartRotomBadge>
                <SmartRotomBadge variant="neutral">Neutral</SmartRotomBadge>
                <SmartRotomBadge variant="button">Button</SmartRotomBadge>
            </Section>
        </div>
    );
}


import { ReactNode } from "react";

function Separator() {
    return <div className="border-r border-black my-2"></div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="w-[90%] m-auto">
            <h2 className="text-xl font-bold mb-2 underline">{title}</h2>
            <div className="flex space-x-4 ">{children}</div>
        </section>
    );
}