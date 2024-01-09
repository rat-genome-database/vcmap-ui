<template>
    <div class="p-menuitem">
        <a href="#" class="p-menuitem-link">
            <!-- Render icon -->
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
import { computed } from 'vue';

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

const hasSubmenu = computed(() => {
    return props.item.items && props.item.items.length > 0;
});

</script>

<style scoped="scss">
.menuitem-content {
    display: block;
}

.custom-subtext {
    display: block;
    font-size: 0.7em;
    font-style: italic;
    color: grey;
}

.p-menuitem-icon.pi.pi-chevron-right {
    margin-left: auto;
}
</style>
