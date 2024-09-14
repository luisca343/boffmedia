import { advance } from "@react-three/fiber";
import { NIDORAN_FEMALE, NIDORAN_MALE, femaleOnlyPokemon, maleOnlyPokemon } from "./PokemonData";
import { SkyFormData } from "./store";

const bitValues = "&67NPR89F0+#STXY45MCHJ-K12=%3Q@W"

const encryptionData =  [
    // Listed vertical: first part of the 2-character hex code range
    // Listed horizontal: second part of the 2-character hex code
    // 0     1     2     3     4     5     6     7     8     9     A     B     C     D     E     F
    0x2E, 0x75, 0x3F, 0x99, 0x09, 0x6C, 0xBC, 0x61, 0x7C, 0x2A, 0x96, 0x4A, 0xF4, 0x6D, 0x29, 0xFA, // 00-0F
    0x90, 0x14, 0x9D, 0x33, 0x6F, 0xCB, 0x49, 0x3C, 0x48, 0x80, 0x7B, 0x46, 0x67, 0x01, 0x17, 0x59, // 10-1F
    0xB8, 0xFA, 0x70, 0xC0, 0x44, 0x78, 0x48, 0xFB, 0x26, 0x80, 0x81, 0xFC, 0xFD, 0x61, 0x70, 0xC7, // 20-2F
    0xFE, 0xA8, 0x70, 0x28, 0x6C, 0x9C, 0x07, 0xA4, 0xCB, 0x3F, 0x70, 0xA3, 0x8C, 0xD6, 0xFF, 0xB0, // 30-3F
    0x7A, 0x3A, 0x35, 0x54, 0xE9, 0x9A, 0x3B, 0x61, 0x16, 0x41, 0xE9, 0xA3, 0x90, 0xA3, 0xE9, 0xEE, // 40-4F
    0x0E, 0xFA, 0xDC, 0x9B, 0xD6, 0xFB, 0x24, 0xB5, 0x41, 0x9A, 0x20, 0xBA, 0xB3, 0x51, 0x7A, 0x36, // 50-5F
    0x3E, 0x60, 0x0E, 0x3D, 0x02, 0xB0, 0x34, 0x57, 0x69, 0x81, 0xEB, 0x67, 0xF3, 0xEB, 0x8C, 0x47, // 60-6F
    0x93, 0xCE, 0x2A, 0xAF, 0x35, 0xF4, 0x74, 0x87, 0x50, 0x2C, 0x39, 0x68, 0xBB, 0x47, 0x1A, 0x02, // 70-7F
    0xA3, 0x93, 0x64, 0x2E, 0x8C, 0xAD, 0xB1, 0xC4, 0x61, 0x04, 0x5F, 0xBD, 0x59, 0x21, 0x1C, 0xE7, // 80-8F
    0x0E, 0x29, 0x26, 0x97, 0x70, 0xA9, 0xCD, 0x18, 0xA3, 0x7B, 0x74, 0x70, 0x96, 0xDE, 0xA6, 0x72, // 90-9F
    0xDD, 0x13, 0x93, 0xAA, 0x90, 0x6C, 0xA7, 0xB5, 0x76, 0x2F, 0xA8, 0x7A, 0xC8, 0x81, 0x06, 0xBB, // A0-AF
    0x85, 0x75, 0x11, 0x0C, 0xD2, 0xD1, 0xC9, 0xF8, 0x81, 0x70, 0xEE, 0xC8, 0x71, 0x53, 0x3D, 0xAF, // B0-BF
    0x76, 0xCB, 0x0D, 0xC1, 0x56, 0x28, 0xE8, 0x3C, 0x61, 0x64, 0x4B, 0xB8, 0xEF, 0x3B, 0x41, 0x09, // C0-CF
    0x72, 0x07, 0x50, 0xAD, 0xF3, 0x2E, 0x5C, 0x43, 0xFF, 0xC3, 0xB3, 0x32, 0x7A, 0x3E, 0x9C, 0xA3, // D0-DF
    0xC2, 0xAB, 0x10, 0x60, 0x99, 0xFB, 0x08, 0x8A, 0x90, 0x57, 0x8A, 0x7F, 0x61, 0x90, 0x21, 0x88, // E0-EF
    0x55, 0xE8, 0xFC, 0x4B, 0x0D, 0x4A, 0x7A, 0x48, 0xC9, 0xB0, 0xC7, 0xA6, 0xD0, 0x04, 0x7E, 0x05  // F0-FF
]

const WMSStruct = [
	{"name": "nullBits", "note": "Null bits", "size": 8},
	{"name": "specialFloor", "note": "Special floor marker", "size": 8},
	{"name": "floor", "note": "Floor", "size": 8},
	{"name": "dungeon", "note": "Dungeon", "size": 8},
	{"name": "flavorText", "note": "Modifies the flavor text", "size": 24},
	{"name": "restriction", "note": "Restriction data", "size": 11},
	{"name": "restrictionType", "note": "Restriction type; mon = 1, type = 0", "size": 1},
	{"name": "reward", "note": "Reward", "size": 11},
	{"name": "rewardType", "note": "Reward type", "size": 4},
	{"name": "targetItem", "note": "Target item", "size": 10},
	{"name": "target2", "note": "Additional target Poke for certain mission types", "size": 11},
	{"name": "target", "note": "Target Poke", "size": 11},
	{"name": "client", "note": "Client Poke", "size": 11},
	{"name": "missionSpecial", "note": "Mission special texts", "size": 4},
	{"name": "missionType", "note": "Mission type", "size": 4},
	{"name": "mailType", "note": "Mail type marker (must be 0100 = 4)", "size": 4},
	{"name": "checksum", "note": "checksum", "size": 32, "noinclude": true}
];

const byteSwapUS = [
    0x07, 0x1B, 0x0D, 0x1F, 0x15, 0x1A, 0x06, 0x01,
    0x17, 0x1C, 0x09, 0x1E, 0x0A, 0x20, 0x10, 0x21,
    0x0F, 0x08, 0x1D, 0x11, 0x14, 0x00, 0x13, 0x16,
    0x05, 0x12, 0x0E, 0x04, 0x03, 0x18, 0x02, 0x0B,
    0x0C, 0x19
]

const byteSwapEU = [
    0x0E, 0x04, 0x03, 0x18, 0x09, 0x1E, 0x0A, 0x20,
    0x10, 0x21, 0x14, 0x00, 0x13, 0x16, 0x05, 0x12,
    0x06, 0x01, 0x17, 0x1C, 0x07, 0x1B, 0x0D, 0x1F,
    0x15, 0x1A, 0x02, 0x0B, 0x0C, 0x19, 0x0F, 0x08,
    0x1D, 0x11
]

const missionTypes = [
    {name: "Rescue client", mainType: 0, specialType: 0, clientIsTarget: true},
    {name: "Rescue target", mainType: 1, specialType: 0},
    {name: "Escort to target", mainType: 2, specialType: 0},
    
    {name: "Explore with client", mainType: 3, clientIsTarget: true, subTypes: [
        {name: "Normal", specialType: 0},
        {name: "Sealed Chamber", specialType: 1, specialFloor: 165},
        {name: "Golden Chamber", specialType: 2, specialFloor: 111},
        {name: "New Dungeon (broken?)", specialType: 3, advancedOnly: true}
    ]},
    
    {name: "Prospect with client", mainType: 4, specialType: 0, useTargetItem: true, clientIsTarget: true},
    {name: "Guide client", mainType: 5, specialType: 0, clientIsTarget: true},
    {name: "Find target item", mainType: 6, specialType: 0, useTargetItem: true, clientIsTarget: true},
    {name: "Deliver target item", mainType: 7, specialType: 0, useTargetItem: true, clientIsTarget: true},
    {name: "Search for client", mainType: 8, specialType: 0},
    
    {name: "Steal from target", mainType: 9, useTargetItem: true, subTypes: [
        {name: "Normal", specialType: 0},
        {name: "Target hidden", specialType: 1},
        {name: "Target runs", specialType: 2}
    ]},
    
    {name: "Arrest client (Magnemite)", advancedOnly: true, mainType: 10, forceClient: 81, subTypes: [
        {name: "Normal", specialType: 0},
        {name: "Escort", specialType: 4},
        {name: "Special Floor (broken)", specialType: 6, useTarget2: true, specialFloorFromList: "thievesden"},
        {name: "Monster House", specialType: 7}
    ]},
    
    // This is the same list as above, just with Magnezone.
    {name: "Arrest client (Magnezone)", advancedOnly: true, mainType: 10, forceClient: 504, subTypes: [
        {name: "Normal", specialType: 0},
        {name: "Escort", specialType: 4},
        {name: "Special Floor (broken)", specialType: 6, useTarget2: true, specialFloorFromList: "thievesden"},
        {name: "Monster House", specialType: 7}
    ]},
    
    {name: "Challenge Request", mainType: 11, subTypes: [
        {name: "Normal (broken)", specialType: 0, useTarget2: true, advancedOnly: true, specialFloorFromList: "challengerequest"},
        {name: "Mewtwo", specialType: 1, forceClient: 150, forceTarget: 150, specialFloor: 145},
        {name: "Entei", specialType: 2, forceClient: 271, forceTarget: 271, specialFloor: 146},
        {name: "Raikou", specialType: 3, forceClient: 270, forceTarget: 270, specialFloor: 147},
        {name: "Suicine", specialType: 4, forceClient: 272, forceTarget: 272, specialFloor: 148},
        {name: "Jirachi", specialType: 5, forceClient: 417, forceTarget: 417, specialFloor: 149}
    ]},
    
    // You can use any client/target but the game prefers them to be the same.
    {name: "Treasure hunt", mainType: 12, specialType: 0, forceClient: 422, forceTarget: 422, specialFloorFromList: "treasurehunt", noReward: true}
    
    // Let's just use game-generated codes, these are all weird and pointless to generate and stuff.
    //{name: "Unlock seven treasures dungeon (broken)", mainType: 13, specialType: 0}
]


type StructType = {
    nullBits: number;
    specialFloor: number;
    floor: number;
    dungeon: number;
    flavorText: number;
    restriction: number;
    restrictionType: number;
    reward: number;
    rewardType: number;
    targetItem: number;
    target2: number;
    target: number;
    client: number;
    missionSpecial: number;
    missionType: number;
    mailType: number;
    checksum: number;
}

export function generateWonderMail(formData: SkyFormData){
    console.log("Generating quest");
    console.log(formData.clientPokemon);

    const struct = {} as StructType;
    
		struct.missionType = parseInt(formData.questType)
		struct.missionSpecial = 0;
		
		struct.nullBits = 0;
		struct.mailType = 4;
		struct.restriction = 0;
		struct.restrictionType = 0;
        console.log("REWARD TYPE "+formData.rewardType)
		struct.rewardType = parseInt(formData.rewardType);

        // Client
        if(formData.hasOwnProperty("forceClient")) {
			struct.client = 1;
		}
		else {
			const client = parseInt(formData.clientPokemon);
            const clientF = false
			struct.client = getTrueMonID(client, clientF);
		}


        const missionData = missionTypes[struct.missionType];
        
		
		// Target
		if(formData.hasOwnProperty("forceTarget")) {
			struct.target = 1;
		}
		else if(missionData.clientIsTarget) {
			struct.target = struct.client;
		}
		else {
			var client = parseInt(formData.targetPokemon);
            const targetF = false
			struct.target = getTrueMonID(client, targetF);
		}


		// Target 2
        /*
		if(missionData.subTypes.useTarget2) {
			// See if this works better.
			struct.target2 = struct.target;
		}
		else {
			// Defaults to zero, let's keep it that way.
			struct.target2 = 0;
		}*/

        struct.target2 = 0;

        
		// Reward - based on reward type
		if(missionData.noReward) {
			// If we don't use a reward for this mission type, set it to Cash + Apple.
			struct.rewardType = 1;
			struct.reward = 109;
		}
		else if(struct.rewardType >= 1 && struct.rewardType <= 4) {
			struct.reward = parseInt(formData.rewardItem);
		}
		else if(struct.rewardType == 5 || struct.rewardType == 6) {
			struct.reward = struct.client;
		}
		else {
			// The game seems to complain about not having a reward, so here's an Apple for you.
			struct.reward = 109;
		}

        
		// Target item - based on mission type
		if(missionData.useTargetItem) {
			struct.targetItem = parseInt(formData.targetItem);
		}
		else {
			// The game also seems to complain about not having a targetItem, so here's an Apple for you.
			struct.targetItem = 109;
		}

        
		// Dungeon/floor
		var dungeon = parseInt(formData.dungeon, 10);
		struct.dungeon = dungeon || 1;
		var floor = parseInt(formData.floor, 10);
		struct.floor = (floor >= 1 && floor <= 99) ? floor : 1;

        
		
		// Special floor
        /*
		if(this.form.specialFloor.value != "") {
			struct.specialFloor = parseInt(this.form.specialFloor.value, 10);
		}
		else if(typeData.hasOwnProperty("specialFloor")) {
			struct.specialFloor = typeData.specialFloor;
		}
		else if(typeData.hasOwnProperty("specialFloorFromList")) {
			// Check for list existance.
			var listName = typeData.specialFloorFromList;
			var list = WMSGenData.staticLists[listName];
			if(!list) {
				console.error("Static list %s not found.", listName);
			}
			var entry = Math.floor(Math.random() * (list.length - 1));
			console.info("Picked specialFloor entry %d, value: %d", entry, list[entry]);
			struct.specialFloor = list[entry];
		}
		else {
			struct.specialFloor = 0;
		}*/

        struct.specialFloor = 0;


		
		var decBitStream;
        const advanced = false;
		
		// Do we have a flavor text override?
		if(formData.flavorText != "") {
			// Use it.
			struct.flavorText = parseInt(formData.flavorText, 10);
			decBitStream = structureToBits(struct);
		}
		else {
			// If advanced mode is on, don't add a random number (produce predictable codes).
			// Otherwise, pick a random number in between 300000-400000; this value isn't special in any way.
			struct.flavorText = 300000 + (advanced ? 0 : Math.floor(Math.random() * 100000));
			
			decBitStream = structureToBits(struct);
			var checksum = bitsToNum(decBitStream.substr(138));
			var resetByte = getResetByte(checksum);
			console.info("flavorText %d, checksum %d, reset %d", struct.flavorText, checksum, resetByte);
		}

        
		// Encrypt the code.
		var encBitStream = encryptBitStream(decBitStream);

		// Bitpack it.
		var bitpacked = bitsToBytes(encBitStream);

		// Scramble it.
		var byteSwap = formData.europeanVersion ? byteSwapEU : byteSwapUS;
		var scrambled = scrambleString(bitpacked, byteSwap);
		
		// Prettify it.
		var prettified = prettyMailString(scrambled, 2, 7);
		
		console.info("enc: %o, packed: %o, scrambled: %o, prettified: %o", encBitStream, bitpacked, scrambled, prettified);
		
        console.log(struct)
        console.log(prettified);
		return prettified;


}

function scrambleString(wmString: string, swapArray: number[]) {
    swapArray = swapArray || byteSwapUS;
    var outArray = [];
    var i;
    for(i = 0; i < swapArray.length; ++i) {
        outArray[i] = "";
    }
    
    for(i = 0; i < swapArray.length; ++i) {
        var target = swapArray[i];
        outArray[target] += wmString.charAt(i);
    }
    
    return outArray.join("");
}

function bitsToBytes(bitStream: string) {
    var blocks = bitStream.length / 5; // 34
    var outString = "";
    for(var i = 0; i < blocks; i++) {
        // (34 - 0 - 1) * 5 = (33) * 5 = 165, 5
        // (34 - 33 - 1) * 5 = (0) * 5 = 0, 5
        var curChars = bitStream.substr((blocks - i - 1) * 5, 5);
        var num = bitsToNum(curChars);
        if(num >= 0 && num < 32) {
            outString += bitValues.charAt(num);
        }
        else {
            console.error("bitsToBytes: Could not find %s in the reversed table", curChars);
        }
    }
    return outString;
}

function encryptBitStream(curBitStream:string) {
		return decryptBitStream(curBitStream, true);
}


function decryptBitStream(curBitStream: string, encrypt: boolean) {
    if(typeof encrypt == "undefined") {
        encrypt = false;
    }
    var bitPtr = 0;
    
    // This will contain the 8-bit blocks as numbers (0-255), each representing one byte.
    // The checksum byte is NOT included in these blocks.
    // The first block in the array is the last block in the bitstream (we work backwards).
    var blocks = [];
    var origBlocks = [];
    
    // Checksum data
    var checksumByte = 0;
    var checksumBits = "";
    var skyChecksumBits = "";
    var fullChecksum;
    
    // Go 8 bits back from the end. We'll read the next 8 bits as our checksum.
    bitPtr = curBitStream.length - 8;
    checksumBits = curBitStream.substr(bitPtr, 8);
    checksumByte = bitsToNum(checksumBits);
    
    // The Sky Checksum is 24 bits.
    bitPtr -= 24;
    skyChecksumBits = curBitStream.substr(bitPtr, 24);
    fullChecksum = bitsToNum(skyChecksumBits.toString() + checksumBits.toString());
    
    // http://www.gamefaqs.com/boards/genmessage.php?board=938931&topic=42949038&page=6
    // "At the moment, I figured out what the game is doing with the other half of the encryption. 
    // Apparently, if you have an even checksum, you go backwards through the encryption bytes.
    // With an odd checksum, you go forwards through the encryption bytes."
    var backwards = !(checksumByte & 0x01);
    
    console.info("CHECKSUM: %d, encPtr goes backwards: %d", checksumByte, backwards);
    
    // Parse everything into blocks.
    // Sky: 1 2-bit block + 16 8-bit blocks + 24-bit skyChecksum + 8-bit checksum.
    while(bitPtr > 7) {
        bitPtr -= 8;
        var data = bitsToNum(curBitStream.substr(bitPtr, 8));
        blocks[blocks.length] = data;
        origBlocks[origBlocks.length] = data;
    }

    // Handle the 2-bit block at the beginning (should always be 00?)
    var twoBitsStart = curBitStream.substr(0, 2);
    bitPtr -= 2;
    
    // Get our encryption entries.
    var entries = getEncryptionEntries(checksumByte);
    
    // Figure out the resetByte.
    var resetByte = 255;
    resetByte = getResetByte(fullChecksum);
    console.info("resetByte used for this code: %d", resetByte);
    
    // Do the decryption.
    var bwMode = false;
    var tblPtr = 0;
    var encPtr = 0;
    for(var i = 0; i < blocks.length; i++) {
        if(encPtr == resetByte) {
            var remaining = blocks.length - i;
            console.info("Resetting at %d. %d blocks remain for decryption.", encPtr, remaining);
            encPtr = 0;
        }
        
        var inputByte: number = blocks[tblPtr];
        
        // Add or subtract the number in the encryption entry from it.
        var result;
        if(encrypt) {
            result = (inputByte + entries[encPtr]) & 0xFF;
        }
        else {
            result = (inputByte - entries[encPtr]) & 0xFF;
        }
        
        console.info("pos %d, value %d (0x%s), encbyte %d, result is %d", tblPtr, inputByte, numToHex(inputByte), entries[encPtr], result);
        
        // Update the data in the block.
        blocks[i] = result;
        
        // Update blockPtr.
        ++tblPtr;
        ++encPtr;
    }
    
    // String everything together. If we use twoBitsStart, that will be our base point.
    var outString = twoBitsStart;
    
    // We start at the end and work backwards; the last encryption block is the first 8 bits in the bitstream.
    // That's just how it works.
    for(var blockPtr = blocks.length - 1; blockPtr >= 0; blockPtr--) {
        outString += numToBits(blocks[blockPtr], 8);
    }
    
    // Re-add the checksums to the data.
    outString += skyChecksumBits + checksumBits;
    
    return outString;
}

function getEncryptionEntries(checksum : number) {
    var amount = 17;
    var entries = [];
    var encPointer = checksum;
    var backwards = !(checksum & 0x01);
    for(var i = 0; i < amount; ++i) {
        entries[entries.length] = encryptionData[encPointer];
        if(backwards) {
            encPointer--;
            if(encPointer < 0) {
                encPointer = encryptionData.length - 1;
            }
        }
        else {
            encPointer++;
            if(encPointer >= encryptionData.length) {
                encPointer = 0;
            }
        }
    }
    return entries;
}


function getResetByte(checksum : number) {
    var checksumByte = checksum % 256;
    var resetByte = Math.floor((checksumByte / 16) + 8 + (checksumByte % 16));
    // The resetByte must be under 17. If not, the code doesn't use a resetByte.
    return (resetByte < 17) ? resetByte : -1;
}

function getTrueMonID(id: number, femaleChecked: boolean) {
    // First, make the id male to start with.
    id = id % 600;
    
    // Second, the special case. Nidoran doesn't follow the standard +600 convention.
    if(id == NIDORAN_MALE || id == NIDORAN_FEMALE) {
        if(femaleChecked) {
            return NIDORAN_FEMALE;
        }
        else {
            return NIDORAN_MALE;
        }
    }
    
    // Third, the actual check.
    const maleOnly = (maleOnlyPokemon.indexOf(id) != -1);
    const femaleOnly = (femaleOnlyPokemon.indexOf(id) != -1);
    
    if((maleOnly || femaleOnly) && femaleChecked) {
        console.info("Prevented %d from being marked as female.", id);
        return id;
    }
    else if(femaleChecked) {
        return id + 600;
    }
    else {
        return id;
    }
}


/**
 * Convert a set of bits to a number.
 * @param String Bits
 * @returns Number Number
 */
function bitsToNum(bits : string) {
	return parseInt(bits, 2);
}


/**
 * @param number Number
 * @returns string Bits
 */
function numToBits(num : number, outputSize : number) {
	var bits = num.toString(2) + "";
	while(bits.length < outputSize) {
		bits = "0" + bits;
	}
	
	return bits;
}

/**
 * Converts a number to a hex string.
 * @param Number Number to convert
 * @param Number Minimum size of the hex string
 * @returns String Hex string
 */
function numToHex(num : number, minSize : number = 2) {
	var hex = num.toString(16).toUpperCase();
	while(hex.length < minSize) {
		hex = "0" + hex;
	}
	return hex;
}

function structureToBits(inputStruct: StructType) {
    var bitStream = "";
    var totalSize = 0;
    for(var i = 0; i < WMSStruct.length; ++i) {
        var key = WMSStruct[i];
        if(key.noinclude) {
            continue;
        }
        
        if(typeof inputStruct[key.name as keyof StructType] == "undefined") {
            console.error("The key %s was not defined in inputStruct %o.", key.name, inputStruct);
        }
        
        var data = inputStruct[key.name as keyof StructType];
        var binData = numToBits(data, key.size);
        bitStream += binData;
        totalSize += key.size;
    }
    
    // For Sky, our "null" byte is 8 bits in length. However, 2 of those bits aren't encrypted. To make it easier on ourselves,
    // we chop those two off here and re-add them later. These will always be zero so it's ok.
    bitStream = bitStream.substr(2);
    
    console.info("Generated a %d-length bitStream: %s.", bitStream.length, bitStream);
    
    var checksum = calculateChecksum(bitStream);
    
    // Add the two chopped-off zero bits and the checksum.
    bitStream = "00" + bitStream + numToBits(checksum, 32);
    
    return bitStream;
}

function calculateChecksum(bitStream : string) {
    // Calculate the checksum - Sky. This is simple CRC32.
    // http://www.gamefaqs.com/boards/detail.php?board=955859&topic=51920426&message=582176885
    console.info("Sky Checksum calculation - bitStream of length %d.", bitStream.length);
    initializeChecksumData();
    
    if(bitStream.length == 170) {
        console.info("Truncating the 170-long bitStream for you. By golly, I'm so nice.");
        bitStream = bitStream.substr(2, 136);
    }
    
    if(bitStream.length != 136) {
        console.warn("WARNING: bitStream should be 136 bits long!");
    }
    
    // Start with 0xFFFFFFFF.
    var checksum = 0xFFFFFFFF;
    
    // We have 17 blocks of 8 bits in the bitStream (136 bits).
    var data = "";
    for(var i = 16; i >= 0; --i) {
        // Grab 8 bits from the stream and convert it to a number.
        var bits = bitStream.substr(i * 8, 8);
        var num = bitsToNum(bits);
        data += String.fromCharCode(num);
        
        // Grab a entry from the data table. The entry gotten is equal to 
        var entry = skyChecksumData[(checksum ^ num) & 0xFF];
        
        // The entry is NOT'ed with our current checksum rsl'd 8 times. The result of this will be the new checksum
        // for this round.
        checksum = (checksum >>> 8) ^ entry;
    }
    
    // Our final checksum is NOT'ed with 0xFFFFFFFF.
    checksum = checksum ^ 0xFFFFFFFF;
    
    // Make the checksum positive (WHY MUST YOU DO THIS TO ME JAVASCRIPT!?!?!?)
    if(checksum < 0) {
        checksum += 4294967296;
    }
    
    console.info("Generated a Sky checksum of %d (%s).", checksum, numToHex(checksum, 8));
    
    return checksum;
}


const skyChecksumData = [] as number[];



function initializeChecksumData() {
	for(var i = 0; i < 256; i++) {
		var entry = i;

		for(var j = 0; j < 8; j++) {
			if(!(entry & 1)) {
				entry = entry >>> 1;
			}
			else {
				entry = 0xEDB88320 ^ (entry >>> 1);
			}

			skyChecksumData[i] = entry;
		}
	}
}
















/* UTILS */

/**
 * Prettifies a mail string, given the amount of rows and the length of the middle column. Outer column
 * width is automagically calculated.
 * @param String Mail string to prettify
 * @param Number Amount of rows
 * @param Number Amount of characters in the middle column
 * @return String Prettified mail string
 */
function prettyMailString(mailString: string, rows: number, middleColumnSize: number) {
	mailString = sanitize(mailString);
	
	// If our mailString is 18 bytes and the middle column is 5 bytes with 2 rows, we'll have 8 bytes left for the rest.
	// There'll be 2 columns for 2 rows each = 8/2/2 = 2 bytes.
	//                    (18                - (2 * 5))                   / (2 * 2)    = 2
	var outerColumnSize = (mailString.length - (rows * middleColumnSize)) / (rows * 2);
	
	var prettyString = "";
	var stringPtr = 0;
	for(var row = 0; row < rows; row++) {
		if(prettyString != "") {
			prettyString += "\n";
		}
		prettyString += mailString.substr(stringPtr, outerColumnSize) + " ";
		stringPtr += outerColumnSize;
		prettyString += mailString.substr(stringPtr, middleColumnSize) + " ";
		stringPtr += middleColumnSize;
		prettyString += mailString.substr(stringPtr, outerColumnSize);
		stringPtr += outerColumnSize;
	}
	return prettyString;
}

function sanitize(wmString: string) {
    // If dontSanitize is there and is checked, return our input.
    /*
    if(getOption("dontSanitize")) {
        return wmString;
    }*/
    
    wmString = wmString.toUpperCase();
    var outString = "";
    for(var i = 0; i < wmString.length; ++i) {
        if(bitValues.indexOf(wmString.charAt(i)) != -1) {
            outString += wmString.charAt(i);
        }
    }
    
    // Check if the length's ok.
    if(outString.length != 34) {
        console.info("sanitized WMS code is %d chars long, should be 34", outString.length);
    }
    
    return outString;
}