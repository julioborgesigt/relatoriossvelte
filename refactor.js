const fs = require('fs');
const file = 'src/lib/components/FormularioPlantao.svelte';
let content = fs.readFileSync(file, 'utf8');

// Chunk 1: Script imports and Props
content = content.replace(
    /\<script lang="ts"\>[\s\S]*?let \{ data, form \}: \{ PageData; form: ActionData \} = \\(\);\s*/,
);
