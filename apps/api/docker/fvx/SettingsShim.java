import com.uprfvx.random.Settings;
import java.io.*;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * SettingsShim - Converts between FVX .rnqs binary format and JSON
 * Uses FVX's own Settings class for byte-perfect round-trip compatibility
 * No external dependencies - manual JSON serialization
 */
public class SettingsShim {
    private static final String VERSION = "1.0";

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            printHelp();
            System.exit(1);
        }

        String command = args[0];

        try {
            switch (command) {
                case "dump-fields":
                    dumpFields();
                    break;
                case "decode":
                    if (args.length < 2) {
                        System.err.println("decode requires a file path argument");
                        System.exit(1);
                    }
                    decode(args[1]);
                    break;
                case "encode":
                    if (args.length < 2) {
                        System.err.println("encode requires a file path argument");
                        System.exit(1);
                    }
                    encode(args[1]);
                    break;
                case "debug-parse":
                    if (args.length < 2) {
                        System.err.println("debug-parse requires a JSON file path");
                        System.exit(1);
                    }
                    debugParse(args[1]);
                    break;
                default:
                    System.err.println("Unknown command: " + command);
                    printHelp();
                    System.exit(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void printHelp() {
        System.err.println("SettingsShim v" + VERSION);
        System.err.println("Usage: java --enable-preview -cp \"fvx-seeded.jar;.\" SettingsShim <command> [args]");
        System.err.println("Commands:");
        System.err.println("  dump-fields              - Output field inventory as JSON");
        System.err.println("  decode <file>            - Decode .rnqs file to JSON (stdout)");
        System.err.println("  encode <output-file>     - Encode JSON (stdin) to .rnqs file");
        System.err.println("  debug-parse <json-file>  - Debug JSON parsing (print parsed map)");
    }

    /**
     * Debug command - parse JSON and print the map
     */
    private static void debugParse(String jsonPath) throws Exception {
        File file = new File(jsonPath);
        FileInputStream fis = new FileInputStream(file);
        BufferedReader reader = new BufferedReader(new InputStreamReader(fis));
        StringBuilder jsonStr = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            jsonStr.append(line).append("\n");
        }
        reader.close();

        String fullJson = jsonStr.toString();
        System.err.println("DEBUG: Full JSON length: " + fullJson.length() + " chars");
        System.err.println("DEBUG: First 200 chars: " + fullJson.substring(0, Math.min(200, fullJson.length())));

        Map<String, String> parsed = parseJsonObject(fullJson);
        System.out.println("Parsed " + parsed.size() + " fields:");
        for (String key : parsed.keySet()) {
            String val = parsed.get(key);
            String display = val.length() > 50 ? val.substring(0, 50) + "..." : val;
            System.out.println("  " + key + " = " + display);
        }
    }

    /**
     * Dumps all Settings instance fields with their types and enum values (no static fields)
     */
    private static void dumpFields() throws Exception {
        StringBuilder json = new StringBuilder();
        json.append("[\n");

        Map<String, FieldInfo> fieldMap = new TreeMap<>();

        // Introspect Settings class for instance fields only
        Field[] declaredFields = Settings.class.getDeclaredFields();
        for (Field f : declaredFields) {
            // Skip static fields
            if (Modifier.isStatic(f.getModifiers())) {
                continue;
            }

            f.setAccessible(true);
            String fieldName = f.getName();
            Class<?> type = f.getType();

            FieldInfo info = new FieldInfo();
            info.name = fieldName;

            if (type.isEnum()) {
                info.kind = "enum";
                Object[] enumConstants = type.getEnumConstants();
                info.enumValues = new ArrayList<>();
                for (Object ec : enumConstants) {
                    info.enumValues.add(((Enum<?>) ec).name());
                }
            } else if (type == boolean.class) {
                info.kind = "bool";
            } else if (type == int.class) {
                info.kind = "int";
            } else if (type.isArray() && type.getComponentType() == int.class) {
                info.kind = "int-array";
            } else if (type == String.class) {
                info.kind = "string";
            } else if (type.getSimpleName().equals("ExpCurve")) {
                info.kind = "expCurve";
            } else if (type.getSimpleName().equals("Type")) {
                info.kind = "type";
            } else if (type.getSimpleName().equals("GenRestrictions")) {
                info.kind = "genRestrictions";
            } else if (type.getSimpleName().equals("BattleStyle")) {
                info.kind = "battleStyle";
            } else {
                // Skip unknown types
                continue;
            }

            fieldMap.put(fieldName, info);
        }

        // Output as JSON array
        List<String> entries = new ArrayList<>();
        for (String key : fieldMap.keySet()) {
            FieldInfo info = fieldMap.get(key);
            StringBuilder entry = new StringBuilder();
            entry.append("  {\n");
            entry.append("    \"name\": ").append(escapeJsonString(info.name)).append(",\n");
            entry.append("    \"kind\": ").append(escapeJsonString(info.kind)).append("\n");

            if (info.enumValues != null && !info.enumValues.isEmpty()) {
                entry.setLength(entry.length() - 1);
                entry.append(",\n");
                entry.append("    \"enumValues\": [");
                for (int i = 0; i < info.enumValues.size(); i++) {
                    if (i > 0) entry.append(", ");
                    entry.append(escapeJsonString(info.enumValues.get(i)));
                }
                entry.append("]\n");
            }

            entry.append("  }");
            entries.add(entry.toString());
        }

        json.append(String.join(",\n", entries));
        json.append("\n]\n");

        System.out.println(json.toString());
    }

    /**
     * Decodes a .rnqs file and outputs JSON
     */
    private static void decode(String filePath) throws Exception {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new FileNotFoundException("File not found: " + filePath);
        }

        FileInputStream fis = new FileInputStream(file);
        Settings settings = Settings.readFromFileFormat(fis);
        fis.close();

        String json = settingsToJson(settings);
        System.out.println(json);
    }

    /**
     * Encodes JSON (from stdin) to a .rnqs file
     */
    private static void encode(String outputPath) throws Exception {
        StringBuilder jsonStr = new StringBuilder();
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line;
        while ((line = reader.readLine()) != null) {
            jsonStr.append(line).append("\n");
        }

        Settings settings = jsonToSettings(jsonStr.toString());

        FileOutputStream fos = new FileOutputStream(outputPath);
        settings.writeToFileFormat(fos);
        fos.close();
    }

    /**
     * Convert a Settings object to JSON by reflection
     */
    private static String settingsToJson(Settings settings) throws Exception {
        StringBuilder json = new StringBuilder();
        json.append("{\n");

        Field[] fields = Settings.class.getDeclaredFields();
        List<String> entries = new ArrayList<>();

        for (Field f : fields) {
            // Skip static fields
            if (Modifier.isStatic(f.getModifiers())) {
                continue;
            }

            f.setAccessible(true);
            String fieldName = f.getName();
            Object value = f.get(settings);

            StringBuilder entry = new StringBuilder();
            entry.append("  ").append(escapeJsonString(fieldName)).append(": ");

            if (value == null) {
                entry.append("null");
            } else if (f.getType() == int.class) {
                entry.append(value);
            } else if (f.getType() == boolean.class) {
                entry.append(value);
            } else if (f.getType() == String.class) {
                entry.append(escapeJsonString((String) value));
            } else if (f.getType().isEnum()) {
                entry.append(escapeJsonString(((Enum<?>) value).name()));
            } else if (f.getType() == int[].class) {
                int[] arr = (int[]) value;
                entry.append("[");
                for (int i = 0; i < arr.length; i++) {
                    if (i > 0) entry.append(", ");
                    entry.append(arr[i]);
                }
                entry.append("]");
            } else if (f.getType().getSimpleName().equals("ExpCurve")) {
                // ExpCurve is an enum - serialize as string name
                entry.append(escapeJsonString(((Enum<?>) value).name()));
            } else if (f.getType().getSimpleName().equals("Type")) {
                entry.append(escapeJsonString(((Enum<?>) value).name()));
            } else if (f.getType().getSimpleName().equals("GenRestrictions")) {
                // GenRestrictions: serialize as structured JSON
                entry.append(genRestrictionsToJson(value));
            } else if (f.getType().getSimpleName().equals("BattleStyle")) {
                // BattleStyle: serialize as structured JSON
                entry.append(battleStyleToJson(value));
            } else {
                // Skip unknown types
                continue;
            }

            entries.add(entry.toString());
        }

        json.append(String.join(",\n", entries));
        json.append("\n}\n");

        return json.toString();
    }

    /**
     * Convert JSON back to a Settings object by reflection
     */
    private static Settings jsonToSettings(String jsonStr) throws Exception {
        Settings settings = new Settings();
        Map<String, String> values = parseJsonObject(jsonStr);


        Field[] fields = Settings.class.getDeclaredFields();
        for (Field f : fields) {
            // Skip static fields
            if (Modifier.isStatic(f.getModifiers())) {
                continue;
            }

            f.setAccessible(true);
            String fieldName = f.getName();

            if (!values.containsKey(fieldName)) {
                continue;
            }

            String jsonValue = values.get(fieldName);
            if (jsonValue.equals("null")) {
                f.set(settings, null);
                continue;
            }

            Class<?> fieldType = f.getType();

            try {
                if (fieldType == int.class) {
                    f.setInt(settings, Integer.parseInt(jsonValue));
                } else if (fieldType == boolean.class) {
                    f.setBoolean(settings, Boolean.parseBoolean(jsonValue));
                } else if (fieldType == String.class) {
                    f.set(settings, unescapeJsonString(jsonValue));
                } else if (fieldType.isEnum()) {
                    String enumName = unescapeJsonString(jsonValue);
                    try {
                        Object enumValue = Enum.valueOf((Class<? extends Enum>) fieldType, enumName);
                        f.set(settings, enumValue);
                    } catch (IllegalArgumentException e) {
                        System.err.println("Warning: Invalid enum value '" + enumName + "' for field " + fieldName + " (type: " + fieldType.getName() + ")");
                    }
                } else if (fieldType == int[].class) {
                    int[] arr = parseIntArray(jsonValue);
                    f.set(settings, arr);
                } else if (fieldType.getSimpleName().equals("GenRestrictions")) {
                    // GenRestrictions: deserialize from structured JSON
                    Object genRestrictionsObj = jsonToGenRestrictions(jsonValue, fieldType);
                    f.set(settings, genRestrictionsObj);
                } else if (fieldType.getSimpleName().equals("BattleStyle")) {
                    // BattleStyle: deserialize from structured JSON
                    Object battleStyleObj = jsonToBattleStyle(jsonValue, fieldType);
                    f.set(settings, battleStyleObj);
                }
            } catch (Exception e) {
                System.err.println("Warning: Could not set field " + fieldName + ": " + e.getMessage());
                e.printStackTrace(System.err);
            }
        }

        return settings;
    }

    /**
     * Serialize a BattleStyle object to JSON
     */
    private static String battleStyleToJson(Object battleStyle) throws Exception {
        Class<?> battleStyleClass = battleStyle.getClass();

        // Get the Modification enum value
        java.lang.reflect.Method getModMethod = battleStyleClass.getMethod("getModification");
        Object mod = getModMethod.invoke(battleStyle);
        String modName = ((Enum<?>) mod).name();

        // Get the Style enum value
        java.lang.reflect.Method getStyleMethod = battleStyleClass.getMethod("getStyle");
        Object style = getStyleMethod.invoke(battleStyle);
        String styleName = ((Enum<?>) style).name();

        return "{\"modification\": " + escapeJsonString(modName) +
               ", \"style\": " + escapeJsonString(styleName) + "}";
    }

    /**
     * Serialize a GenRestrictions object to JSON
     */
    private static String genRestrictionsToJson(Object genRestrictions) throws Exception {
        Class<?> genClass = genRestrictions.getClass();

        // Get allowEvolutionaryRelatives flag
        java.lang.reflect.Method allowEvolutionaryRelativesMethod = genClass.getMethod("isAllowEvolutionaryRelatives");
        boolean allowEvoRelatives = (boolean) allowEvolutionaryRelativesMethod.invoke(genRestrictions);

        // Get which gens are allowed (1-7)
        java.lang.reflect.Method isGenAllowedMethod = genClass.getMethod("isGenAllowed", int.class);
        StringBuilder gensArray = new StringBuilder("[");
        for (int gen = 1; gen <= 7; gen++) {
            boolean allowed = (boolean) isGenAllowedMethod.invoke(genRestrictions, gen);
            if (allowed) {
                if (gensArray.length() > 1) gensArray.append(", ");
                gensArray.append(gen);
            }
        }
        gensArray.append("]");

        return "{\"gens\": " + gensArray.toString() +
               ", \"allowEvolutionaryRelatives\": " + allowEvoRelatives + "}";
    }

    /**
     * Deserialize JSON to a BattleStyle object
     */
    private static Object jsonToBattleStyle(String jsonValue, Class<?> battleStyleClass) throws Exception {
        Map<String, String> battleStyleMap = parseJsonObject(jsonValue);

        String modName = unescapeJsonString(battleStyleMap.get("modification"));
        String styleName = unescapeJsonString(battleStyleMap.get("style"));

        // Get Modification and Style enum classes
        Class<?> modificationClass = null;
        Class<?> styleClass = null;
        for (Class<?> inner : battleStyleClass.getDeclaredClasses()) {
            if (inner.getSimpleName().equals("Modification")) {
                modificationClass = inner;
            } else if (inner.getSimpleName().equals("Style")) {
                styleClass = inner;
            }
        }

        Object modValue = Enum.valueOf((Class<? extends Enum>) modificationClass, modName);
        Object styleValue = Enum.valueOf((Class<? extends Enum>) styleClass, styleName);

        // Create BattleStyle with both values
        java.lang.reflect.Constructor<?> constructor = battleStyleClass.getConstructor(modificationClass, styleClass);
        return constructor.newInstance(modValue, styleValue);
    }

    /**
     * Deserialize JSON to a GenRestrictions object
     */
    private static Object jsonToGenRestrictions(String jsonValue, Class<?> genClass) throws Exception {
        Map<String, String> genMap = parseJsonObject(jsonValue);

        // Parse gens array
        String gensStr = genMap.get("gens").trim();
        boolean[] gensAllowed = new boolean[7];
        if (gensStr.startsWith("[") && gensStr.endsWith("]")) {
            gensStr = gensStr.substring(1, gensStr.length() - 1);
            if (!gensStr.isEmpty()) {
                String[] parts = gensStr.split(",");
                for (String part : parts) {
                    int gen = Integer.parseInt(part.trim());
                    if (gen >= 1 && gen <= 7) {
                        gensAllowed[gen - 1] = true;
                    }
                }
            }
        }

        // Parse allowEvolutionaryRelatives
        String allowEvoStr = genMap.get("allowEvolutionaryRelatives").trim();
        boolean allowEvoRelatives = Boolean.parseBoolean(allowEvoStr);

        // Reconstruct the int state
        int state = allowEvoRelatives ? 1 : 0;
        for (int gen = 1; gen <= 7; gen++) {
            if (gensAllowed[gen - 1]) {
                state |= (1 << gen);
            }
        }

        // Create GenRestrictions from int state
        java.lang.reflect.Constructor<?> constructor = genClass.getConstructor(int.class);
        return constructor.newInstance(state);
    }

    private static String escapeJsonString(String s) {
        StringBuilder sb = new StringBuilder();
        sb.append('"');
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 32 || c >= 127) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append('"');
        return sb.toString();
    }

    private static String unescapeJsonString(String s) {
        if (s.startsWith("\"") && s.endsWith("\"")) {
            s = s.substring(1, s.length() - 1);
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char next = s.charAt(i + 1);
                switch (next) {
                    case '"': sb.append('"'); i++; break;
                    case '\\': sb.append('\\'); i++; break;
                    case 'b': sb.append('\b'); i++; break;
                    case 'f': sb.append('\f'); i++; break;
                    case 'n': sb.append('\n'); i++; break;
                    case 'r': sb.append('\r'); i++; break;
                    case 't': sb.append('\t'); i++; break;
                    case 'u':
                        if (i + 5 < s.length()) {
                            String hex = s.substring(i + 2, i + 6);
                            try {
                                sb.append((char) Integer.parseInt(hex, 16));
                                i += 5;
                            } catch (NumberFormatException e) {
                                sb.append(c);
                            }
                        } else {
                            sb.append(c);
                        }
                        break;
                    default: sb.append(c);
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1);
        }
        if (s.isEmpty()) {
            return new int[0];
        }
        String[] parts = s.split(",");
        int[] result = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Integer.parseInt(parts[i].trim());
        }
        return result;
    }

    private static Map<String, String> parseJsonObject(String jsonStr) {
        // Remove BOM if present
        if (jsonStr.length() > 0 && jsonStr.charAt(0) == '﻿') {
            jsonStr = jsonStr.substring(1);
        }

        Map<String, String> result = new LinkedHashMap<>();
        int level = 0;
        int nestingInValue = 0;  // Track nesting within a field value
        StringBuilder key = new StringBuilder();
        StringBuilder value = new StringBuilder();
        boolean inKey = true;
        boolean inString = false;
        boolean escaping = false;

        for (int i = 0; i < jsonStr.length(); i++) {
            char c = jsonStr.charAt(i);

            if (escaping) {
                if (inKey) {
                    key.append(c);
                } else {
                    value.append(c);
                }
                escaping = false;
                continue;
            }

            if (c == '\\') {
                escaping = true;
                if (inKey) {
                    key.append(c);
                } else {
                    value.append(c);
                }
                continue;
            }

            if (c == '"') {
                inString = !inString;
                if (inKey) {
                    key.append(c);
                } else {
                    value.append(c);
                }
                continue;
            }

            if (!inString) {
                if (c == '{') {
                    level++;
                    if (!inKey) {  // We're in a value
                        nestingInValue++;
                        value.append(c);
                    }
                    continue;
                } else if (c == '}') {
                    if (!inKey && nestingInValue > 0) {  // Closing brace in value
                        nestingInValue--;
                        value.append(c);
                    }
                    level--;
                    continue;
                } else if (c == '[') {
                    if (!inKey) {  // We're in a value
                        nestingInValue++;
                        value.append(c);
                    }
                    continue;
                } else if (c == ']') {
                    if (!inKey && nestingInValue > 0) {  // Closing bracket in value
                        nestingInValue--;
                        value.append(c);
                    }
                    continue;
                } else if (c == ':' && level == 1) {
                    inKey = false;
                    key = new StringBuilder(unescapeJsonString(key.toString()));
                    continue;
                } else if (c == ',' && level == 1 && nestingInValue == 0) {
                    String v = value.toString().trim();
                    if (v.startsWith("\"") && v.endsWith("\"")) {
                        v = unescapeJsonString(v);
                    }
                    result.put(key.toString(), v);
                    key = new StringBuilder();
                    value = new StringBuilder();
                    inKey = true;
                    continue;
                } else if (Character.isWhitespace(c) && (key.length() == 0 || (inKey && value.length() == 0))) {
                    continue;
                }
            }

            if (inKey) {
                key.append(c);
            } else {
                value.append(c);
            }
        }

        if (key.length() > 0) {
            String v = value.toString().trim();
            if (v.startsWith("\"") && v.endsWith("\"")) {
                v = unescapeJsonString(v);
            }
            result.put(key.toString(), v);
        }

        return result;
    }

    private static class FieldInfo {
        String name;
        String kind;
        List<String> enumValues;
    }
}
