<template>
    <div class="p-menuitem">
        <a href="#" class="p-menuitem-link">
            <!-- Rendering the icon, if provided -->
            <span v-if="item.icon" :class="['p-menuitem-icon', item.icon]"></span>
            <div class="menuitem-content">
                <!-- Main label -->
                <span class="p-menuitem-text">{{ item.label }}</span>
                <!-- Subtext -->
                <span v-if="item.subtext" class="custom-subtext">{{ item.subtext }}</span>
            </div>
            <!-- Right chevron for submenu -->
            <span v-if="hasSubmenu" class="p-menuitem-icon pi pi-chevron-right"></span>
        </a>
    </div>
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

// Computed property to check if the item has a submenu
const hasSubmenu = computed(() => {
    return props.item.items && props.item.items.length > 0;
});
</script>

<style>
.menuitem-content {
    display: block;
    /* Change display to block to stack elements vertically */
}

.custom-subtext {
    font-size: 0.8em;
    color: grey;
    display: block;
    /* Ensure subtext appears on a new line */
}

/* You might need to adjust the style for the chevron icon */
.p-menuitem-icon.pi.pi-chevron-right {
    margin-left: auto;
    /* Push the icon to the right */
}
</style>
