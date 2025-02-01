<script>
    import { createEventDispatcher } from "svelte";

    export let value = []; // Array of selected tags.
    export let suggestions = []; // Array of possible suggestions.

    const dispatch = createEventDispatcher();

    let inputText = "";
    let filteredSuggestions = [];
    let showSuggestions = false;

    function updateValue(newTags) {
        value = newTags;
        dispatch("change", { value });
    }

    function addTag(tag) {
        tag = tag.trim();
        if (tag && !value.includes(tag)) {
            updateValue([...value, tag]);
        }
        inputText = "";
        showSuggestions = false;
    }

    function removeTag(index) {
        const newTags = [...value];
        newTags.splice(index, 1);
        updateValue(newTags);
    }

    function onInput(e) {
        inputText = e.target.value;
        if (inputText.length > 0) {
            filteredSuggestions = suggestions.filter(
                (s) =>
                    s.toLowerCase().includes(inputText.toLowerCase()) &&
                    !value.includes(s),
            );
            showSuggestions = filteredSuggestions.length > 0;
        } else {
            showSuggestions = false;
        }
    }

    function onKeyDown(e) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(inputText);
        } else if (
            e.key === "Backspace" &&
            inputText === "" &&
            value.length > 0
        ) {
            removeTag(value.length - 1);
        }
    }

    function selectSuggestion(suggestion) {
        addTag(suggestion);
    }
</script>

<div class="autocomplete-container">
    <div class="tag-input">
        {#each value as tag, index}
            <div class="tag">
                {tag} <span on:click={() => removeTag(index)}>×</span>
            </div>
        {/each}
        <input
            type="text"
            bind:value={inputText}
            on:input={onInput}
            on:keydown={onKeyDown}
            placeholder="Type and press Enter..."
        />
    </div>
    {#if showSuggestions}
        <div class="suggestions">
            {#each filteredSuggestions as suggestion}
                <div
                    class="suggestion-item"
                    on:click={() => selectSuggestion(suggestion)}
                >
                    {suggestion}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .tag-input {
        display: flex;
        flex-wrap: wrap;
        border: 1px solid #ccc;
        padding: 4px;
        border-radius: 4px;
    }
    .tag {
        background: #007acc;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        margin: 2px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
    }
    .tag span {
        margin-left: 4px;
        cursor: pointer;
    }
    .tag-input input {
        border: none;
        outline: none;
        flex: 1;
        min-width: 120px;
        margin: 2px;
    }
    .suggestions {
        position: absolute;
        background: #fff;
        border: 1px solid #ccc;
        border-top: none;
        width: 100%;
        max-height: 150px;
        overflow-y: auto;
        z-index: 10;
    }
    .suggestion-item {
        padding: 4px 8px;
        cursor: pointer;
    }
    .suggestion-item:hover {
        background: #007acc;
        color: #fff;
    }
    .autocomplete-container {
        position: relative;
    }
</style>
