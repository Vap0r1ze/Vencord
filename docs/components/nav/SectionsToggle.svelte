<script lang="ts">
    const className = "sections-isopen";

    function toggle() {
        document.body.classList.contains(className)
            ? document.body.classList.remove(className)
            : document.body.classList.add(className);
    }
    function keypress(evt: KeyboardEvent) {
        if (evt.key === "Enter") toggle();
    }
</script>

<div
    class="toggle-btn"
    aria-label="View pages"
    role="button"
    tabindex="0"
    on:click={toggle}
    on:keypress={keypress}
>
    <div class="icon-slot"><slot /></div>
</div>

<style>
    .toggle-btn {
        border-radius: 4px;
        border: 1px solid var(--catppuccin-text);
        cursor: pointer;
        padding: 3px;
    }
    .icon-slot {
        height: 24px;
        width: 24px;
    }
</style>
