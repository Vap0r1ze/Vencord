<script lang="ts">
    import { onMount, tick } from "svelte";
    import { Link, Section } from "./Sections";

    export let sections: Section[];
    export let activePath: string;

    let selectedSection = sections.find(isSectionActive);

    function isActive(href: string) {
        return activePath === href;
    }
    function isSectionActive(section: Section) {
        return section.items.some((item) => isActive(item.href));
    }

    async function selectSection(section: Section): Promise<void> {
        if (section === selectedSection) return void (selectedSection = null);
        selectedSection = section;
        await tick();
        markOverflows(section);
    }

    const markedOverflows = new Set<Section>();
    let overflows = new Set<Link>();
    function markOverflows(section: Section) {
        if (markedOverflows.has(section)) return;

        const index = sections.indexOf(section);
        if (index === -1) return;
        const sectionEl = nav.children[index];

        sectionEl.querySelectorAll(".section-item-wrap").forEach((item, i) => {
            const span = item.querySelector("span");
            if (
                span.getBoundingClientRect().width <=
                span.parentElement.getBoundingClientRect().width
            )
                return;
            overflows = overflows.add(section.items[i]);
        });

        markedOverflows.add(section);
    }

    let nav: HTMLElement;
    onMount(() => {
        if (selectedSection) markOverflows(selectedSection);
    });
</script>

<nav bind:this={nav} class="sections">
    {#each sections as section (section.title)}
        <ul
            class="section"
            class:active={isSectionActive(section)}
            class:selected={section === selectedSection}
        >
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                class="section-title-wrap"
                on:click={() => selectSection(section)}
            >
                <div class="section-title" aria-label={section.title}>
                    <span>{section.title}</span>
                </div>
            </div>
            <div class="section-items" class:font-code={section.code}>
                {#each section.items as item (item.title)}
                    <div
                        class={`section-item-wrap depth-${
                            (item.depth ?? 0) + 2
                        }`}
                        class:active={isActive(item.href)}
                        class:has-overflow={overflows.has(item)}
                    >
                        <a
                            class="section-item"
                            on:click={(e) => e.stopPropagation()}
                            href={item.href}
                            title={item.title}
                        >
                            <span>{item.title}</span>
                        </a>
                    </div>
                {/each}
            </div>
        </ul>
    {/each}
</nav>

<style lang="scss">
    @use "../../assets/responsive";

    $base-thickness: 2px;
    $depth-vars: (
            color: var(--catppuccin-overlay2),
            padding: 8px,
            thickness: 2px,
        ),
        (
            color: var(--catppuccin-overlay0),
            padding: 16px,
            thickness: 1px,
        ),
        (
            text: var(--catppuccin-overlay1),
            color: var(--catppuccin-surface1),
            padding: 24px,
            thickness: 2px,
        );

    @function depth($depth, $key) {
        @return map-get(nth($depth-vars, $depth), $key);
    }

    .sections {
        box-sizing: border-box;
        padding: 1rem 0rem 1rem 1rem;
        width: 100%;

        @include responsive.mobile {
            :global(body:not(.sections-isopen)) & {
                display: none;
            }
        }
    }
    .section {
        padding: 0;
        margin: 0;

        @include responsive.mobile {
            &:not(:first-child) {
                margin-top: 1rem;
            }
        }
    }
    .section-title-wrap {
        display: flex;
    }
    .section-title {
        flex: 1;
        font-size: 18px;
        margin-bottom: 6px;

        .section.active & {
            color: var(--catppuccin-blue);
        }
    }
    .section-items {
        color: var(--catppuccin-subtext0);
    }
    .section-item-wrap {
        padding: 2px 8px;

        &.active {
            color: var(--catppuccin-blue);
        }

        @for $i from 3 through 3 {
            &.depth-#{$i} {
                color: #{depth($i, text)};
                padding: 2px #{depth($i, padding)};
            }
        }
    }
    .section-item {
        display: block;
        color: inherit;
        text-decoration: none;

        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
    .section-item:hover {
        color: var(--catppuccin-blue);
    }

    @include responsive.desktop {
        .section-title {
            border-left: #{$base-thickness} solid #{depth(1, color)};
            padding: 4px #{depth(1, padding)};
            cursor: pointer;
            transition: letter-spacing 0.2s;

            margin-bottom: 0;

            .section &:hover,
            .section.selected & {
                border-width: #{$base-thickness + depth(1, thickness)};
                padding-left: #{depth(1, padding) - depth(1, thickness)};
            }
            .section &:hover {
                letter-spacing: 1px;
            }
            .section.active & {
                border-color: var(--catppuccin-blue);
            }
        }
        .section:not(.selected) .section-items {
            display: none;
        }
        .section-item-wrap {
            &:hover,
            &.active {
                border-color: var(--catppuccin-blue);
            }

            @for $i from 2 through 3 {
                &.depth-#{$i} {
                    color: #{depth($i, text)};
                    padding: 2px #{depth($i, padding)};
                    border-left: #{$base-thickness} solid #{depth($i, color)};
                    &:hover {
                        border-width: #{$base-thickness + depth($i, thickness)};
                        padding-left: #{depth($i, padding) -
                            depth($i, thickness)};
                    }
                }
            }
        }
        .section-item-wrap.has-overflow:hover {
            width: fit-content;
            background: var(--sections-bg);
            border-radius: 0 4px 4px 0;
            box-shadow: 0 0 5px 1px var(--catppuccin-mantle);

            .section-item {
                overflow: visible;
            }
        }
    }
</style>
