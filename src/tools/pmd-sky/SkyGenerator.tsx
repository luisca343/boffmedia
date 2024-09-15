"use client"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { questTypes } from "./old/QuestData1";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { getFloors, getValidDungeons } from "./DungeonData";
import { getValidPokemon } from "./PokemonData";
import { useFormStore } from "./store";
import { generateWonderMail } from "./Generate";
import { Combobox } from "@/components/ui/combobox";
import { getItemData } from "./ItemData";

import useTranslation from "next-translate/useTranslation"



export function SkyGenerator() {
    const [wonderMail, setWonderMail] = useState("");
    const { t: dungeonsTrans } = useTranslation("tools/pmdsky/dungeons");

    const { formData, targetAvailable, setFormData, setTargetAvailable } = useFormStore();
    
    const handleTargetItemChange = useCallback((value: string) => {
        setFormData({ targetItem: Number(value) });
    }, [setFormData]);

    const handleRewardItemChange = useCallback((value: string) => {
        setFormData({ rewardItem: Number(value)  });
    }, [setFormData]);


    function getWonderMail() {
        const mail = generateWonderMail(formData);
        setWonderMail(mail);
    }

    return (
        <div className="bg-gray-700 text-black mysterydungeon text-2xl">
            <h1>Sky Generator</h1>
            <Label htmlFor="questType">Quest Type</Label>
            <Select name="questType" value={formData.questType.toString()} onValueChange={(value) => setFormData({ questType: Number(value) })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a mission" />
                </SelectTrigger>
                <SelectContent>
                    {questTypes.map((type, index) => <SelectItem key={index} value={type.id.toString()}>{type.value}</SelectItem>)}
                </SelectContent>
            </Select>

            <Label htmlFor="dungeon">Dungeon</Label>
            <Select name='dungeon' value={formData.dungeon.toString()} onValueChange={(value) => setFormData({ dungeon: Number(value) })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a dungeon" />
                </SelectTrigger>
                <SelectContent>
                    {getValidDungeons(dungeonsTrans).map((dungeon, index) =>
                        <SelectItem key={index} value={dungeon.key.toString()}>{dungeon.name}</SelectItem>
                    )}
                </SelectContent>
            </Select>

            <Label htmlFor="floor">Floor</Label>
            <Input name="floor" type="number"
                min={1} max={getFloors(formData.dungeon)}
                className="w-48 text-black" value={formData.floor} onChange={(e) => setFormData({ floor: Number(e.target.value) })} />

            <Label htmlFor="clientPokemon">Client</Label>
            <Select name='clientPokemon' value={formData.clientPokemon.toString()} onValueChange={(value) => setFormData({ clientPokemon: Number(value) })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                    {getValidPokemon().map((client, index) => <SelectItem key={index} value={client.key.toString()}>{client.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <Label htmlFor="targetPokemon">Target</Label>
            <Select name='targetPokemon' disabled={!targetAvailable} value={formData.targetPokemon.toString()} onValueChange={(value) => setFormData({ targetPokemon: Number(value) })}>
                <SelectTrigger className="w-48 text-black">
                    <SelectValue placeholder="Select a target" className=" text-black"/>
                </SelectTrigger>
                <SelectContent>
                    {getValidPokemon().map((client, index) => <SelectItem key={index} value={client.key.toString()}>{client.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <Label htmlFor="targetItem">Target Item</Label>
            <Combobox data={getItemData()} value={formData.targetItem.toString()} onChange={handleTargetItemChange} />

            <Label htmlFor="rewardType">Reward Type</Label>
            <Select name="rewardType" value={formData.rewardType.toString()} onValueChange={(value) => setFormData({ rewardType: Number(value) })}>
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
            <Combobox data={getItemData()} value={formData.rewardItem.toString()} onChange={handleRewardItemChange} />

            <Label htmlFor="europeanVersion">European Version</Label>
            <Checkbox name="europeanVersion" checked={formData.europeanVersion} onCheckedChange={(value) => setFormData({ europeanVersion: value === true })} />

            <Button onClick={() => getWonderMail()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                Generate
            </Button>

            <div>
                <span>Generated Wonder Mail:</span>
                <div className="text-9xl">
                    {wonderMail.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                    ))}
                </div>
            </div>
            

        </div>
    );
}