import {copyFileSync, readdirSync,} from "fs";

copyFileSync("./manifest.json", "./dist/manifest.json");

const files = readdirSync("./src/pages");
for (const file of files) {
    copyFileSync("./src/pages/" + file, "./dist/" + file);
}
