"use client"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { questTypes } from "./old/QuestData1";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useCallback } from "react";
import { getValidDungeons } from "./DungeonData";
import { getValidPokemon } from "./PokemonData";
import ItemSelect from "../components/ItemSelect";
import { useFormStore } from "./store";
import PokemonVirtualizedList from "../components/PokemonList";
import { generateWonderMail } from "./Generate";



export function SkyGenerator() {
    const [questType, setQuestType] = useState("0");

    const { formData, targetAvailable, setFormData, setTargetAvailable } = useFormStore();
    
    const handleTargetItemChange = useCallback((value: string) => {
        setFormData({ targetItem: value });
    }, [setFormData]);

    const handleRewardItemChange = useCallback((value: string) => {
        setFormData({ rewardItem: value });
    }, [setFormData]);



    return (
        <div className="bg-gray-700 text-white">
            <h1>Sky Generator</h1>
            <Label htmlFor="questType">Quest Type</Label>
            <Select name="questType" value={formData.questType} onValueChange={(value) => setFormData({ questType: value })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a mission" />
                </SelectTrigger>
                <SelectContent>
                    {questTypes.map((type, index) => <SelectItem key={index} value={type.id.toString()}>{type.value}</SelectItem>)}
                </SelectContent>
            </Select>

            <Label htmlFor="dungeon">Dungeon</Label>
            <Select name='dungeon' value={formData.dungeon} onValueChange={(value) => setFormData({ dungeon: value })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a dungeon" />
                </SelectTrigger>
                <SelectContent>
                    {getValidDungeons().map((dungeon, index) =>
                        <SelectItem key={index} value={dungeon.key.toString()}>{dungeon.name}</SelectItem>
                    )}
                </SelectContent>
            </Select>

            <Label htmlFor="floor">Floor</Label>
            <Input name="floor" type="number" placeholder="0" className="w-48 text-black"  value={formData.floor} onChange={(e) => setFormData({ floor: e.target.value })} />

            <Label htmlFor="clientPokemon">Client</Label>
            <Select name='clientPokemon' value={formData.clientPokemon} onValueChange={(value) => setFormData({ clientPokemon: value })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                <PokemonVirtualizedList
                    items={getValidPokemon()}
                    itemHeight={40} // Adjust based on your item height
                    renderItem={(client, index) => (
                        <SelectItem key={index} value={client.key.toString()}>{client.name}</SelectItem>
                    )}
                />

                </SelectContent>
            </Select>

            <Label htmlFor="targetPokemon">Target</Label>
            <Select name='targetPokemon' disabled={!targetAvailable} value={formData.targetPokemon} onValueChange={(value) => setFormData({ targetPokemon: value })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a target" />
                </SelectTrigger>
                <SelectContent>
                    {getValidPokemon().map((client, index) => <SelectItem key={index} value={client.key.toString()}>{client.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <Label htmlFor="targetItem">Target Item</Label>
            <ItemSelect name="targetItem" value={formData.targetItem} onChange={handleTargetItemChange} />

            <Label htmlFor="rewardType">Reward Type</Label>
            <Select name="rewardType" value={formData.rewardType} onValueChange={(value) => setFormData({ rewardType: value })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a reward type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="0">Cash</SelectItem>
                    <SelectItem value="1">Cash + ??? (Reward item)</SelectItem>
                    <SelectItem value="2">Item</SelectItem>
                    <SelectItem value="3">Item + ??? (Random)</SelectItem>
                    <SelectItem value="4">??? (Reward item)</SelectItem>
                    <SelectItem value="5">??? (Egg)</SelectItem>
                    <SelectItem value="6">??? (Client joins)</SelectItem>
                </SelectContent>
            </Select>

            <Label htmlFor="rewardItem">Reward Item</Label>
            <ItemSelect name="rewardItem" value={formData.rewardItem} onChange={handleRewardItemChange} />

            <Label htmlFor="europeanVersion">European Version</Label>
            <Checkbox name="europeanVersion" checked={formData.europeanVersion} onCheckedChange={(value) => setFormData({ europeanVersion: value === true })} />

            <Button onClick={() => generateWonderMail(formData)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                Generate
            </Button>

            <Label htmlFor="generatedQuest">Generated Quest</Label>
            <Textarea name="generatedQuest" className="w-96 h-32 text-black" />
            

        </div>
    );
}